import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-vendor-submit-quotation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './submit-quotation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitQuotationComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly rfqId = signal<string | null>(null);

  readonly activeRFQ = computed(() => {
    const id = this.rfqId();
    if (!id) return null;
    return this.mockDataService.rfqs().find(r => r.id === id) || null;
  });

  readonly activePR = computed(() => {
    const rfq = this.activeRFQ();
    if (!rfq) return null;
    return this.mockDataService.purchaseRequests().find(p => p.id === rfq.purchaseRequestId) || null;
  });

  // Quotation form fields
  readonly quoteItems = signal<Array<{
    itemCode: string;
    itemName: string;
    uom: string;
    quantity: number;
    unitPrice: number;
    discountPercent: number;
  }>>([]);

  deliveryWeeks = 2;
  paymentTerms = 'Net 30';
  notes = '';

  // Attached files list
  readonly uploadedFiles = signal<Array<{ name: string; size: string; type: string; url: string }>>([]);

  // Subtotal calculation
  readonly subtotal = computed(() => {
    return this.quoteItems().reduce((sum, item) => {
      const discountedPrice = item.unitPrice * (1 - (item.discountPercent || 0) / 100);
      return sum + (discountedPrice * item.quantity);
    }, 0);
  });

  // Tax amount (15%)
  readonly taxPercent = 15;
  readonly taxAmount = computed(() => {
    return Math.round(this.subtotal() * (this.taxPercent / 100));
  });

  // Grand Total calculation
  readonly grandTotal = computed(() => {
    return this.subtotal() + this.taxAmount();
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal', url: '/vendor-portal' },
      { label: this.translate.instant('vendor.portal.my_rfqs') || 'My RFQs', url: '/vendor-portal/rfqs' },
      { label: this.translate.instant('vendor.quotation.submit_title') || 'Submit Quotation' }
    ]);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.rfqId.set(id);

      // Initialize items from PR
      const pr = this.activePR();
      if (pr) {
        const items = pr.items.map(item => ({
          itemCode: item.itemCode,
          itemName: item.itemName,
          uom: item.uom,
          quantity: item.quantity,
          unitPrice: 0,
          discountPercent: 0
        }));
        this.quoteItems.set(items);
      }
    });
  }

  // File upload simulation
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      
      const newFile = {
        name: file.name,
        size: `${sizeMB} MB`,
        type: file.type,
        url: '#'
      };
      
      this.uploadedFiles.update(files => [...files, newFile]);
      this.notificationService.success('vendor.notifications.file_uploaded_title', 'vendor.notifications.file_uploaded_desc', { file: file.name });
    }
  }

  removeFile(index: number) {
    this.uploadedFiles.update(files => files.filter((_, i) => i !== index));
  }

  submitQuotationForm(event: Event) {
    event.preventDefault();
    const rfq = this.activeRFQ();
    const vId = this.authService.currentUser()?.vendorId;
    const vName = this.authService.currentUser()?.companyName || 'Vendor';

    if (!rfq || !vId) return;

    // Validate that all items have positive unit prices
    const invalidItem = this.quoteItems().find(item => item.unitPrice <= 0);
    if (invalidItem) {
      this.notificationService.danger('vendor.quotation.err_invalid_price_title', 'vendor.quotation.err_invalid_price_desc');
      return;
    }

    // Map line items
    const submissionItems = this.quoteItems().map(item => {
      const sub = item.unitPrice * item.quantity;
      const discAmt = Math.round(sub * (item.discountPercent / 100));
      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        uom: item.uom,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: discAmt,
        totalPrice: sub - discAmt
      };
    });

    const totalDiscountAmount = submissionItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);

    // Call service to log bid quotation
    this.mockDataService.submitQuotation(rfq.id, {
      vendorId: vId,
      vendorName: vName,
      price: this.subtotal(),
      deliveryWeeks: this.deliveryWeeks,
      taxPercent: this.taxPercent,
      taxAmount: this.taxAmount(),
      totalAmount: this.grandTotal(),
      notes: this.notes || undefined,
      submissionDate: new Date().toISOString().split('T')[0],
      status: 'Submitted',
      paymentTerms: this.paymentTerms,
      discountPercent: Math.round((totalDiscountAmount / (this.subtotal() + totalDiscountAmount)) * 100) || 0,
      discountAmount: totalDiscountAmount,
      attachments: this.uploadedFiles(),
      items: submissionItems
    });

    // Notify non-vendor users (procurement) via Notification system!
    this.notificationService.addNotification(
      'vendor.notifications.quotation_submitted_title',
      'vendor.notifications.quotation_submitted_desc',
      'success',
      { vendor: vName, rfq: rfq.rfqNumber }
    );

    // Redirect to My RFQs
    this.router.navigate(['/vendor-portal/rfqs', rfq.id]);
  }
}
