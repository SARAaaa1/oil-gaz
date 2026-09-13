import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';

@Component({
  selector: 'app-vendor-submit-quotation',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './submit-quotation.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubmitQuotationComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly notificationService = inject(NotificationService);
  private readonly vendorApi = inject(VendorApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly rfqId = signal<string | null>(null);
  readonly apiRFQDetail = signal<any | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);

  readonly activeRFQ = computed(() => {
    return this.apiRFQDetail();
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

      if (id) {
        this.isLoading.set(true);
        this.vendorApi.getPortalRFQDetails(id).subscribe({
          next: (res) => {
            const data = res?.data;
            if (data) {
              this.apiRFQDetail.set(data);
              const items = data.items || data.purchaseRequest?.items || [];
              if (items.length > 0) {
                this.quoteItems.set(items.map((item: any) => ({
                  itemCode: item.itemCode || item.code || '',
                  itemName: item.itemName || item.name || '',
                  uom: item.uom || 'EA',
                  quantity: item.quantity || 1,
                  unitPrice: item.unitPrice || 0,
                  discountPercent: 0
                })));
              }
            }
            this.isLoading.set(false);
          },
          error: () => {
            this.isLoading.set(false);
          }
        });
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
    const id = this.rfqId();
    const vName = this.authService.currentUser()?.companyName || 'Vendor';

    if (!id) return;

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

    const payload = {
      deliveryWeeks: this.deliveryWeeks,
      paymentTerms: this.paymentTerms,
      notes: this.notes || undefined,
      taxPercent: this.taxPercent,
      items: submissionItems,
      subtotal: this.subtotal(),
      taxAmount: this.taxAmount(),
      totalAmount: this.grandTotal(),
      attachments: this.uploadedFiles()
    };

    this.isSubmitting.set(true);

    this.vendorApi.submitPortalQuotation(id, payload).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.notificationService.success(
          'vendor.notifications.quotation_submitted_title',
          'vendor.notifications.quotation_submitted_desc',
          { vendor: vName, rfq: rfq?.rfqNumber || id }
        );
        this.router.navigate(['/vendor-portal/rfqs', id]);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.notificationService.danger(
          'Error',
          err?.error?.message || 'Failed to submit quotation'
        );
      }
    });
  }
}
