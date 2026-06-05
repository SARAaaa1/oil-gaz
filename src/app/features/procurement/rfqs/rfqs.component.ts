import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RFQ, RFQVendor, RFQQuotation } from '../../../shared/interfaces/rfq.interface';
import { PurchaseRequest } from '../../../shared/interfaces/purchase-request.interface';

@Component({
  selector: 'app-rfqs',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, TranslateModule],
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
    notes: ''
  };

  // Computed lists
  readonly activeVendors = computed(() => 
    this.vendors().filter(v => v.status === 'Active')
  );

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

    // Check query params for PR source auto-fill
    this.route.queryParams.subscribe(params => {
      const prId = params['createForPR'];
      if (prId) {
        const pr = this.purchaseRequests().find(p => p.id === prId);
        if (pr && pr.status === 'Approved') {
          this.selectedPRSource.set(pr);
          this.formRFQ.title = this.translate.instant('procurement.rfqs.rfq_for_title', { pr: pr.requestNumber, dept: pr.department });
          this.formRFQ.invitedVendorIds.clear();
          this.isFormView.set(true);
        } else {
          this.router.navigate([], { queryParams: {} });
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
        status: 'Invited'
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
  }

  closeRFQDetails() {
    this.selectedRFQ.set(null);
  }

  getInvitedBiddedRatio(rfq: RFQ): string {
    const total = rfq.vendors.length;
    const submitted = rfq.vendors.filter(v => v.status === 'Submitted').length;
    return `${submitted} / ${total}`;
  }

  // --- BID SIMULATION ---
  openBiddingModal(rfq: RFQ) {
    this.biddingRFQ.set(rfq);
    this.bidForm = {
      vendorId: '',
      price: 0,
      deliveryWeeks: 2,
      notes: ''
    };
  }

  closeBiddingModal() {
    this.biddingRFQ.set(null);
  }

  getUnsubmittedVendors(rfq: RFQ) {
    // Return vendors invited that haven't submitted yet
    return rfq.vendors.filter(v => v.status === 'Invited');
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
      taxPercent,
      taxAmount,
      totalAmount: total,
      notes: this.bidForm.notes || undefined
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
}
