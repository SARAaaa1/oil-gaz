import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RFQ, RFQVendor, RFQQuotation } from '../../../shared/interfaces/rfq.interface';
import { PurchaseRequest } from '../../../shared/interfaces/purchase-request.interface';
import { ProcurementChainComponent } from '../../../shared/components/procurement-chain/procurement-chain.component';

@Component({
  selector: 'app-rfqs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProcurementChainComponent],
  templateUrl: './rfqs.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // States
  readonly rfqs = this.mockDataService.rfqs;
  readonly vendors = this.mockDataService.vendors;
  readonly purchaseRequests = this.mockDataService.purchaseRequests;

  readonly isFormView = signal<boolean>(false);
  readonly selectedPRSource = signal<PurchaseRequest | null>(null);
  readonly selectedRFQ = signal<RFQ | null>(null);
  readonly biddingRFQ = signal<RFQ | null>(null);

  // Search & Filter
  readonly searchQuery = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // New RFQ form fields
  formRFQ = {
    title: '',
    deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days out
    invitedVendorIds: new Set<string>()
  };

  // Bid simulation form
  bidForm = {
    vendorId: '',
    price: 0,
    deliveryWeeks: 2,
    notes: '',
    paymentTerms: 'Net 30',
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [] as { name: string; size: string; type: string; url: string }[]
  };

  // Computed lists
  readonly activeVendors = computed(() => 
    this.vendors().filter(v => v.status === 'Active')
  );

  readonly vendorSearchQuery = signal<string>('');

  readonly displayedVendors = computed(() => {
    const list = this.vendors();
    const query = this.vendorSearchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter(v => 
      v.vendorName.toLowerCase().includes(query) ||
      (v.arabicName && v.arabicName.toLowerCase().includes(query)) ||
      (v.category && v.category.toLowerCase().includes(query)) ||
      v.vendorCode.toLowerCase().includes(query)
    );
  });

  readonly filteredRFQs = computed(() => {
    let list = this.rfqs();
    const query = this.searchQuery().trim().toLowerCase();
    const filter = this.statusFilter();

    if (filter !== 'ALL') {
      list = list.filter(r => r.status === filter);
    }

    if (query) {
      list = list.filter(r => 
        r.rfqNumber.toLowerCase().includes(query) ||
        r.title.toLowerCase().includes(query) ||
        r.purchaseRequestNumber.toLowerCase().includes(query)
      );
    }

    return [...list].sort((a, b) => b.rfqNumber.localeCompare(a.rfqNumber));
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.procurement'), url: '/procurement' },
      { label: this.translate.instant('procurement.rfqs.breadcrumb') }
    ]);

    // Check query params for PR source auto-fill or RFQ detail drawer view
    this.route.queryParams.subscribe(params => {
      const prId = params['createForPR'];
      if (prId) {
        const pr = this.purchaseRequests().find(p => p.id === prId);
        if (pr && (pr.status === 'Approved' || pr.status === 'Pending Approval' || pr.status === 'RFQ Created')) {
          this.selectedPRSource.set(pr);
          this.formRFQ.title = this.translate.instant('procurement.rfqs.rfq_for_title', { pr: pr.requestNumber, dept: pr.department });
          this.formRFQ.invitedVendorIds.clear();
          this.isFormView.set(true);
        } else {
          this.router.navigate([], { queryParams: {} });
        }
      }
      
      const rfqId = params['rfqId'];
      if (rfqId) {
        const rfq = this.rfqs().find(r => r.id === rfqId);
        if (rfq) {
          this.selectedRFQ.set(rfq);
          this.activeDetailsTab.set('vendors');
        }
      }
    });
  }

  // --- RFQ FORM ACTIONS ---
  toggleVendorSelection(id: string) {
    if (this.formRFQ.invitedVendorIds.has(id)) {
      this.formRFQ.invitedVendorIds.delete(id);
    } else {
      this.formRFQ.invitedVendorIds.add(id);
    }
  }

  isVendorSelected(id: string): boolean {
    return this.formRFQ.invitedVendorIds.has(id);
  }

  cancelRFQForm() {
    this.isFormView.set(false);
    this.selectedPRSource.set(null);
    this.formRFQ.invitedVendorIds.clear();
    // Clear query parameters
    this.router.navigate([], { queryParams: {} });
  }

  submitRFQ(event: Event) {
    event.preventDefault();
    const pr = this.selectedPRSource();
    if (!pr) return;

    if (this.formRFQ.invitedVendorIds.size === 0) {
      this.notificationService.danger(
        this.translate.instant('procurement.rfqs.err_missing_vendors_title'),
        this.translate.instant('procurement.rfqs.err_missing_vendors_desc')
      );
      return;
    }

    // Map invited vendors
    const rfqVendors: RFQVendor[] = Array.from(this.formRFQ.invitedVendorIds).map(vid => {
      const vend = this.vendors().find(v => v.id === vid)!;
      return {
        vendorId: vid,
        vendorName: vend.vendorName,
        contactEmail: vend.contactEmail,
        status: 'Pending' as const,
        invitationSentDate: new Date().toISOString().split('T')[0]
      };
    });

    const newRfq = this.mockDataService.addRFQ({
      purchaseRequestId: pr.id,
      purchaseRequestNumber: pr.requestNumber,
      title: this.formRFQ.title,
      deadlineDate: this.formRFQ.deadlineDate,
      vendors: rfqVendors
    });

    this.notificationService.success(
      this.translate.instant('procurement.rfqs.notif_dispatched_title'),
      this.translate.instant('procurement.rfqs.notif_dispatched_desc', { rfq: newRfq.rfqNumber })
    );

    this.cancelRFQForm();
  }

  // --- DETAILS ---
  viewRFQDetails(rfq: RFQ) {
    this.selectedRFQ.set(rfq);
    this.activeDetailsTab.set('vendors');
  }

  closeRFQDetails() {
    this.selectedRFQ.set(null);
  }

  goToComparison(rfqId: string) {
    this.router.navigate(['/procurement/quotation-comparison'], { queryParams: { rfqId } });
  }

  getInvitedBiddedRatio(rfq: RFQ): string {
    const total = rfq.vendors.length;
    const submitted = rfq.vendors.filter(v => v.status === 'Submitted').length;
    return `${submitted} / ${total}`;
  }

  getVendorCategoryClass(category: string | undefined): string {
    if (!category) return 'bg-purple-50 text-purple-700';
    if (category === 'Drilling') return 'bg-blue-50 text-blue-700';
    if (category === 'Logistics') return 'bg-amber-50 text-amber-700';
    if (category === 'HSE') return 'bg-green-50 text-green-700';
    return 'bg-purple-50 text-purple-700';
  }

  // --- BID / QUOTATION ENTRY ---
  openBiddingModal(rfq: RFQ) {
    this.biddingRFQ.set(rfq);
    this.bidForm = {
      vendorId: '',
      price: 0,
      deliveryWeeks: 2,
      notes: '',
      paymentTerms: 'Net 30',
      validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      attachments: []
    };
  }

  // Trigger the hidden file input
  triggerFileInput() {
    const input = document.getElementById('quotation-file-input') as HTMLInputElement;
    if (input) input.click();
  }

  // Handle real file selection from the browser file picker
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const alreadyAdded = this.bidForm.attachments.some(a => a.name === file.name);
      if (!alreadyAdded) {
        const sizeStr = file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : (file.size / 1024).toFixed(0) + ' KB';
        // Use FileReader to create a local preview URL for images
        const reader = new FileReader();
        reader.onload = (e) => {
          this.bidForm.attachments.push({
            name: file.name,
            size: sizeStr,
            type: file.type,
            url: e.target?.result as string || '#'
          });
        };
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsArrayBuffer(file);
          this.bidForm.attachments.push({
            name: file.name,
            size: sizeStr,
            type: file.type,
            url: '#'
          });
        }
      }
    });
    // Reset input so same file can be re-selected
    input.value = '';
  }

  removeAttachment(index: number) {
    this.bidForm.attachments.splice(index, 1);
  }

  isImageFile(file: { type: string }): boolean {
    return file.type.startsWith('image/');
  }

  // Allow adding quotations for Sent, Partially Responded, or Fully Responded RFQs
  canAddQuotation(rfq: RFQ): boolean {
    return rfq.status === 'Sent' || rfq.status === 'Partially Responded' || rfq.status === 'Fully Responded';
  }

  closeBiddingModal() {
    this.biddingRFQ.set(null);
  }

  // Return all invited vendors that have NOT yet submitted a quotation
  getUnsubmittedVendors(rfq: RFQ) {
    const submittedVendorIds = new Set(rfq.quotations.map(q => q.vendorId));
    return rfq.vendors.filter(v => !submittedVendorIds.has(v.vendorId));
  }

  submitVendorBid(event: Event) {
    event.preventDefault();
    const rfq = this.biddingRFQ();
    if (!rfq || !this.bidForm.vendorId) return;

    if (this.bidForm.price <= 0) {
      this.notificationService.danger(
        this.translate.instant('procurement.rfqs.err_invalid_price_title'),
        this.translate.instant('procurement.rfqs.err_invalid_price_desc')
      );
      return;
    }

    const vendor = this.vendors().find(v => v.id === this.bidForm.vendorId)!;
    const taxPercent = 15; // 15% Standard VAT
    const taxAmount = Math.round(this.bidForm.price * (taxPercent / 100));
    const total = this.bidForm.price + taxAmount;

    // Save bid quotation
    this.mockDataService.submitQuotation(rfq.id, {
      vendorId: vendor.id,
      vendorName: vendor.vendorName,
      price: this.bidForm.price,
      deliveryWeeks: this.bidForm.deliveryWeeks,
      subtotal: this.bidForm.price,
      taxPercent,
      taxAmount,
      totalAmount: total,
      submissionDate: new Date().toISOString().split('T')[0],
      validityDate: this.bidForm.validityDate || undefined,
      paymentTerms: this.bidForm.paymentTerms || 'Net 30',
      notes: this.bidForm.notes || undefined,
      attachments: this.bidForm.attachments.length > 0 ? [...this.bidForm.attachments] : undefined,
      status: 'Submitted' as const
    });

    // Update vendor status inside RFQ in local view
    rfq.vendors = rfq.vendors.map(v => 
      v.vendorId === vendor.id ? { ...v, status: 'Submitted' as const } : v
    );

    this.notificationService.success(
      this.translate.instant('procurement.rfqs.notif_bid_logged_title'),
      this.translate.instant('procurement.rfqs.notif_bid_logged_desc', { vendor: vendor.vendorName, rfq: rfq.rfqNumber })
    );

    this.closeBiddingModal();
  }

  readonly activeDetailsTab = signal<'vendors' | 'responses' | 'comparison'>('vendors');

  awardVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.mockDataService.awardQuotation(rfq.id, quote.vendorId);
    const newPO = this.mockDataService.createPOFromRFQ(rfq.id, quote.vendorId);

    if (newPO) {
      this.notificationService.success(
        'procurement.quotation_comparison.notif_awarded_title',
        'procurement.quotation_comparison.notif_awarded_desc',
        { po: newPO.poNumber, vendor: quote.vendorName }
      );

      this.notificationService.addNotification(
        'vendor.notifications.quotation_accepted_title',
        'vendor.notifications.quotation_accepted_desc',
        'success',
        { rfq: rfq.rfqNumber }
      );

      this.closeRFQDetails();
      this.router.navigate(['/procurement/purchase-orders'], { queryParams: { poId: newPO.id } });
    }
  }

  rejectVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.mockDataService.rejectQuotation(rfq.id, quote.vendorId);
    this.notificationService.warning(
      'procurement.rfq.notif_rejected_title',
      'procurement.rfq.notif_rejected_desc',
      { vendor: quote.vendorName }
    );

    this.notificationService.addNotification(
      'vendor.notifications.quotation_rejected_title',
      'vendor.notifications.quotation_rejected_desc',
      'danger',
      { rfq: rfq.rfqNumber }
    );

    const updated = this.rfqs().find(r => r.id === rfq.id);
    if (updated) this.selectedRFQ.set(updated);
  }

  requestRevisionVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.mockDataService.requestRevision(rfq.id, quote.vendorId);
    this.notificationService.info(
      'procurement.rfq.notif_revision_title',
      'procurement.rfq.notif_revision_desc',
      { vendor: quote.vendorName }
    );

    this.notificationService.addNotification(
      'vendor.notifications.revision_requested_title',
      'vendor.notifications.revision_requested_desc',
      'warning',
      { rfq: rfq.rfqNumber }
    );

    const updated = this.rfqs().find(r => r.id === rfq.id);
    if (updated) this.selectedRFQ.set(updated);
  }
}
