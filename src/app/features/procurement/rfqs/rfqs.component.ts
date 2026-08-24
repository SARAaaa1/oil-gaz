import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';
import { RFQ, RFQVendor, RFQQuotation } from '../../../shared/interfaces/rfq.interface';
import { PurchaseRequest, PurchaseRequestItem } from '../../../shared/interfaces/purchase-request.interface';
import { ProcurementChainComponent } from '../../../shared/components/procurement-chain/procurement-chain.component';
import { ProcurementService } from '../../../core/services/procurement.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { finalize } from 'rxjs/operators';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapApiRFQ(raw: any): RFQ {
  return {
    id:                    raw._id ?? raw.id,
    rfqNumber:             raw.rfqNumber ?? raw.documentNumber ?? '',
    documentNumber:        raw.documentNumber ?? raw.rfqNumber ?? '',
    procurementChain:      raw.procurementChain ?? '',
    rootProcurementNumber: raw.rootProcurementNumber ?? '',
    chainId:               raw.chainId ?? raw._id ?? raw.id,
    parentDocumentId:      raw.parentDocumentId ?? raw.purchaseRequestId ?? '',
    parentDocumentNumber:  raw.parentDocumentNumber ?? raw.purchaseRequestNumber ?? '',
    purchaseRequestId:     raw.purchaseRequestId ?? '',
    purchaseRequestNumber: raw.purchaseRequestNumber ?? raw.rootProcurementNumber ?? '',
    title:                 raw.title ?? '',
    createdDate:           raw.createdAt ?? raw.createdDate ?? '',
    deadlineDate:          raw.deadlineDate ?? '',
    requiredDeliveryDate:  raw.requiredDeliveryDate,
    requester:             raw.requester,
    status:                raw.status ?? 'Sent',
    vendors:               (raw.vendors ?? []).map(mapApiVendor),
    quotations:            (raw.quotations ?? []).map(mapApiQuotation),
    awardedVendorId:       raw.awardedVendorId,
    awardedVendorName:     raw.awardedVendorName,
    awardedQuotationId:    raw.awardedQuotationId,
    awardedQuotationNumber: raw.awardedQuotationNumber,
    chargeType:            raw.chargeType,
    projectId:             raw.projectId,
    projectName:           raw.projectName,
    assetId:               raw.assetId,
    assetName:             raw.assetName,
    costCenter:            raw.costCenter,
  };
}

function mapApiVendor(raw: any): RFQVendor {
  return {
    vendorId:               raw.vendorId ?? raw._id ?? raw.id,
    vendorName:             raw.vendorName ?? '',
    contactEmail:           raw.contactEmail ?? '',
    status:                 raw.status ?? 'Pending',
    invitationSentDate:     raw.invitationSentDate,
    quotationSubmittedDate: raw.quotationSubmittedDate,
  };
}

function mapApiQuotation(raw: any): RFQQuotation {
  return {
    id:                raw._id ?? raw.id,
    quotationNumber:   raw.quotationNumber ?? '',
    quotationSequence: raw.quotationSequence ?? 1,
    procurementChain:  raw.procurementChain ?? '',
    vendorId:          raw.vendorId ?? '',
    vendorName:        raw.vendorName ?? '',
    price:             raw.price ?? raw.subtotal ?? 0,
    deliveryWeeks:     raw.deliveryWeeks ?? 2,
    submissionDate:    raw.submissionDate ?? raw.submittedDate,
    validityDate:      raw.validityDate,
    paymentTerms:      raw.paymentTerms,
    notes:             raw.notes ?? raw.remarks,
    subtotal:          raw.subtotal ?? raw.price ?? 0,
    taxPercent:        raw.taxPercent ?? 15,
    taxAmount:         raw.taxAmount ?? 0,
    totalAmount:       raw.totalAmount ?? 0,
    status:            raw.status ?? 'Submitted',
    attachments:       raw.attachments ?? [],
    items:             raw.items ?? [],
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-rfqs',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, ProcurementChainComponent],
  templateUrl: './rfqs.component.html',
  styleUrls: ['./rfqs.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqsComponent implements OnInit {
  private readonly procurementService  = inject(ProcurementService);
  private readonly mockDataService     = inject(MockDataService); // للـ vendors فقط
  private readonly breadcrumbService   = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService        = inject(AuditService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly translate           = inject(TranslateService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly rfqs             = signal<RFQ[]>([]);
  readonly purchaseRequests = signal<PurchaseRequest[]>([]);
  readonly isLoading        = signal<boolean>(false);

  // الـ Vendors لا تزال من الـ Mock حتى يتوفر endpoint لها
  readonly vendors = this.mockDataService.vendors;

  readonly isFormView       = signal<boolean>(false);
  readonly selectedPRSource = signal<PurchaseRequest | null>(null);
  readonly selectedRFQ      = signal<RFQ | null>(null);
  readonly biddingRFQ       = signal<RFQ | null>(null);

  readonly searchQuery  = signal<string>('');
  readonly statusFilter = signal<string>('ALL');

  // New RFQ form
  formRFQ = {
    title: '',
    deadlineDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    invitedVendorIds: new Set<string>()
  };

  // Bid form
  bidForm = {
    vendorId: '',
    price: 0,
    deliveryWeeks: 2,
    notes: '',
    paymentTerms: 'Net 30',
    validityDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    attachments: [] as { name: string; size: string; type: string; url: string }[]
  };

  // ── Computed ──────────────────────────────────────────────────────────────

  readonly activeVendors = computed(() =>
    this.vendors().filter(v => v.status === 'Active')
  );

  readonly vendorSearchQuery = signal<string>('');

  readonly displayedVendors = computed(() => {
    const list  = this.vendors();
    const query = this.vendorSearchQuery().trim().toLowerCase();
    if (!query) return list;
    return list.filter(v =>
      v.vendorName.toLowerCase().includes(query) ||
      (v.arabicName && v.arabicName.toLowerCase().includes(query)) ||
      (v.category   && v.category.toLowerCase().includes(query)) ||
      v.vendorCode.toLowerCase().includes(query)
    );
  });

  readonly filteredRFQs = computed(() => {
    let list   = this.rfqs();
    const query  = this.searchQuery().trim().toLowerCase();
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

  // ── Init ──────────────────────────────────────────────────────────────────

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.procurement'), url: '/procurement' },
      { label: this.translate.instant('procurement.rfqs.breadcrumb') }
    ]);

    this.loadRFQs();
    this.loadPRs();

    this.route.queryParams.subscribe(params => {
      const prId = params['createForPR'];
      if (prId) {
        // انتظر تحميل الـ PRs ثم افتح النموذج
        const tryOpen = () => {
          const pr = this.purchaseRequests().find(p => p.id === prId);
          if (pr && (pr.status === 'Approved' || pr.status === 'Pending Approval' || pr.status === 'RFQ Created')) {
            this.selectedPRSource.set(pr);
            this.formRFQ.title = this.translate.instant('procurement.rfqs.rfq_for_title', {
              pr: pr.requestNumber, dept: pr.department
            });
            this.formRFQ.invitedVendorIds.clear();
            this.isFormView.set(true);
            this.cdr.markForCheck();
          } else if (!pr) {
            // أعد المحاولة بعد 500ms إن لم تكن الـ PRs محملة بعد
            setTimeout(tryOpen, 500);
          } else {
            this.router.navigate([], { queryParams: {} });
          }
        };
        tryOpen();
      }

      const rfqId = params['rfqId'];
      if (rfqId) {
        const rfq = this.rfqs().find(r => r.id === rfqId);
        if (rfq) {
          this.selectedRFQ.set(rfq);
          this.activeDetailsTab.set('requisition');
          this.detailsInvitedVendorIds.set(new Set(rfq.vendors.map(v => v.vendorId)));
        } else {
          // سيُفتح بعد تحميل الـ RFQs
          setTimeout(() => {
            const found = this.rfqs().find(r => r.id === rfqId);
            if (found) {
              this.selectedRFQ.set(found);
              this.activeDetailsTab.set('requisition');
              this.detailsInvitedVendorIds.set(new Set(found.vendors.map(v => v.vendorId)));
              this.cdr.markForCheck();
            }
          }, 800);
        }
      }
    });
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  private loadRFQs() {
    this.isLoading.set(true);
    this.procurementService.getRFQs(1, 200)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = res?.items ?? (Array.isArray(res) ? res : []);
          this.rfqs.set(raw.map(mapApiRFQ));
        },
        error: err => {
          console.error('Failed to load RFQs:', err);
          this.notificationService.danger('Error', 'Failed to load RFQs.');
        }
      });
  }

  private loadPRs() {
    this.procurementService.getPRs({ limit: 200 }).subscribe({
      next: res => {
        const raw = res?.items ?? (Array.isArray(res) ? res : []);
        // نقوم بـ import inline للـ mapper من الـ PR component
        this.purchaseRequests.set(raw.map((r: any) => ({
          id:             r._id ?? r.id,
          requestNumber:  r.requestNumber ?? r.prNumber ?? '',
          documentNumber: r.documentNumber ?? '',
          procurementChain: r.procurementChain ?? '',
          rootProcurementNumber: r.rootProcurementNumber ?? '',
          chainId:        r.chainId ?? r._id ?? r.id,
          department:     r.department ?? '',
          costCenter:     r.costCenter ?? '',
          chargeType:     r.chargeType ?? 'General Overhead',
          requestDate:    r.createdAt ?? '',
          requiredDate:   r.requiredDate ?? '',
          status:         r.status ?? 'Draft',
          description:    r.description ?? '',
          requestedBy:    r.requestedBy ?? '',
          items:          r.items ?? [],
        })));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load PRs:', err)
    });
  }

  // ── RFQ Form Actions ──────────────────────────────────────────────────────

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

    const rfqVendors = Array.from(this.formRFQ.invitedVendorIds).map(vid => {
      const vend = this.vendors().find(v => v.id === vid)!;
      return {
        vendorId:     vid,
        vendorName:   vend?.vendorName ?? '',
        contactEmail: vend?.contactEmail ?? ''
      };
    });

    const payload = {
      purchaseRequestId:    pr.id,
      title:                this.formRFQ.title,
      deadlineDate:         this.formRFQ.deadlineDate,
      vendors:              rfqVendors
    };

    this.isLoading.set(true);
    this.procurementService.createRFQ(payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: created => {
          const newRFQ = mapApiRFQ(created);
          this.rfqs.update(list => [newRFQ, ...list]);

          // تحديث حالة الـ PR محلياً
          this.purchaseRequests.update(list =>
            list.map(p => p.id === pr.id ? { ...p, status: 'RFQ Created' as any } : p)
          );

          this.notificationService.success(
            this.translate.instant('procurement.rfqs.notif_dispatched_title'),
            this.translate.instant('procurement.rfqs.notif_dispatched_desc', { rfq: newRFQ.rfqNumber })
          );
          this.cancelRFQForm();
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to create RFQ.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── Details ───────────────────────────────────────────────────────────────

  viewRFQDetails(rfq: RFQ) {
    // جلب التفاصيل الكاملة من الـ API (تشمل الـ quotations)
    this.procurementService.getRFQById(rfq.id).subscribe({
      next: detail => {
        const mapped = mapApiRFQ(detail);
        this.selectedRFQ.set(mapped);
        this.activeDetailsTab.set('requisition');
        this.detailsInvitedVendorIds.set(new Set(mapped.vendors.map(v => v.vendorId)));
        this.cdr.markForCheck();
      },
      error: () => {
        // fallback: استخدم البيانات المحلية
        this.selectedRFQ.set(rfq);
        this.activeDetailsTab.set('requisition');
        this.detailsInvitedVendorIds.set(new Set(rfq.vendors.map(v => v.vendorId)));
        this.cdr.markForCheck();
      }
    });
  }

  closeRFQDetails() {
    this.selectedRFQ.set(null);
  }

  goToComparison(rfqId: string) {
    this.router.navigate(['/procurement/quotation-comparison'], { queryParams: { rfqId } });
  }

  getInvitedBiddedRatio(rfq: RFQ): string {
    const total     = rfq.vendors.length;
    const submitted = rfq.vendors.filter(v => v.status === 'Submitted').length;
    return `${submitted} / ${total}`;
  }

  getVendorCategoryClass(category: string | undefined): string {
    if (!category)                return 'bg-purple-50 text-purple-700';
    if (category === 'Drilling')   return 'bg-blue-50 text-blue-700';
    if (category === 'Logistics')  return 'bg-amber-50 text-amber-700';
    if (category === 'HSE')        return 'bg-green-50 text-green-700';
    return 'bg-purple-50 text-purple-700';
  }

  // ── Bid / Quotation ───────────────────────────────────────────────────────

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

  triggerFileInput() {
    const input = document.getElementById('quotation-file-input') as HTMLInputElement;
    if (input) input.click();
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files).forEach(file => {
      const alreadyAdded = this.bidForm.attachments.some(a => a.name === file.name);
      if (!alreadyAdded) {
        const sizeStr = file.size > 1024 * 1024
          ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
          : (file.size / 1024).toFixed(0) + ' KB';
        const reader = new FileReader();
        reader.onload = e => {
          this.bidForm.attachments.push({
            name: file.name, size: sizeStr, type: file.type,
            url: e.target?.result as string || '#'
          });
        };
        if (file.type.startsWith('image/')) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsArrayBuffer(file);
          this.bidForm.attachments.push({ name: file.name, size: sizeStr, type: file.type, url: '#' });
        }
      }
    });
    input.value = '';
  }

  removeAttachment(index: number) {
    this.bidForm.attachments.splice(index, 1);
  }

  isImageFile(file: { type: string }): boolean {
    return file.type.startsWith('image/');
  }

  canAddQuotation(rfq: RFQ): boolean {
    return rfq.status === 'Sent' || rfq.status === 'Partially Responded' || rfq.status === 'Fully Responded';
  }

  closeBiddingModal() {
    this.biddingRFQ.set(null);
  }

  getUnsubmittedVendors(rfq: RFQ) {
    const submittedIds = new Set(rfq.quotations.map(q => q.vendorId));
    return rfq.vendors.filter(v => !submittedIds.has(v.vendorId));
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

    const vendor     = this.vendors().find(v => v.id === this.bidForm.vendorId)!;
    const taxPercent = 15;
    const taxAmount  = Math.round(this.bidForm.price * (taxPercent / 100));
    const total      = this.bidForm.price + taxAmount;

    const payload = {
      vendorId:     vendor?.id ?? this.bidForm.vendorId,
      vendorName:   vendor?.vendorName ?? '',
      price:        this.bidForm.price,
      subtotal:     this.bidForm.price,
      taxPercent,
      taxAmount,
      totalAmount:  total,
      deliveryWeeks: this.bidForm.deliveryWeeks,
      paymentTerms:  this.bidForm.paymentTerms || 'Net 30',
      validityDate:  this.bidForm.validityDate || undefined,
      notes:         this.bidForm.notes || undefined,
      items:         []
    };

    this.isLoading.set(true);
    this.procurementService.addQuotation(rfq.id, payload)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: newQuotation => {
          const mappedQ = mapApiQuotation(newQuotation);
          // تحديث الـ RFQ محلياً
          this.rfqs.update(list => list.map(r => {
            if (r.id !== rfq.id) return r;
            const updatedVendors = r.vendors.map(v =>
              v.vendorId === vendor?.id ? { ...v, status: 'Submitted' as const } : v
            );
            return { ...r, vendors: updatedVendors, quotations: [...r.quotations, mappedQ] };
          }));
          // تحديث الـ biddingRFQ و selectedRFQ
          const updated = this.rfqs().find(r => r.id === rfq.id);
          if (updated) this.biddingRFQ.set(updated);

          this.notificationService.success(
            this.translate.instant('procurement.rfqs.notif_bid_logged_title'),
            this.translate.instant('procurement.rfqs.notif_bid_logged_desc', {
              vendor: vendor?.vendorName, rfq: rfq.rfqNumber
            })
          );
          this.closeBiddingModal();
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to submit quotation.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── Details Tab & Vendor Invite ───────────────────────────────────────────

  readonly activeDetailsTab       = signal<'requisition' | 'vendors' | 'responses'>('requisition');
  readonly detailsInvitedVendorIds = signal<Set<string>>(new Set());

  toggleDetailsVendorSelection(id: string) {
    const current = new Set(this.detailsInvitedVendorIds());
    current.has(id) ? current.delete(id) : current.add(id);
    this.detailsInvitedVendorIds.set(current);
  }

  isDetailsVendorSelected(id: string): boolean {
    return this.detailsInvitedVendorIds().has(id);
  }

  isAlreadyInvited(vendorId: string): boolean {
    const rfq = this.selectedRFQ();
    if (!rfq) return false;
    return rfq.vendors.some(v => v.vendorId === vendorId);
  }

  getRFQVendor(vendorId: string): RFQVendor | null {
    const rfq = this.selectedRFQ();
    if (!rfq) return null;
    return rfq.vendors.find(v => v.vendorId === vendorId) || null;
  }

  hasNewVendorSelections(): boolean {
    const rfq = this.selectedRFQ();
    if (!rfq) return false;
    const currentIds = new Set(rfq.vendors.map(v => v.vendorId));
    return Array.from(this.detailsInvitedVendorIds()).some(id => !currentIds.has(id));
  }

  getRFQSourcePR(rfq: RFQ | null): PurchaseRequest | null {
    if (!rfq) return null;
    return this.purchaseRequests().find(p => p.id === rfq.purchaseRequestId) || null;
  }

  saveDetailsInvitedVendors() {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    const currentIds   = new Set(rfq.vendors.map(v => v.vendorId));
    const newVendorIds = Array.from(this.detailsInvitedVendorIds()).filter(id => !currentIds.has(id));
    if (newVendorIds.length === 0) return;

    const newVendors = newVendorIds.map(vid => {
      const v = this.vendors().find(x => x.id === vid);
      return { vendorId: vid, vendorName: v?.vendorName ?? '', contactEmail: v?.contactEmail ?? '' };
    });

    this.isLoading.set(true);
    this.procurementService.inviteVendors(rfq.id, { vendors: newVendors })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: updated => {
          const mappedRFQ = mapApiRFQ(updated);
          this.rfqs.update(list => list.map(r => r.id === rfq.id ? mappedRFQ : r));
          this.selectedRFQ.set(mappedRFQ);
          this.detailsInvitedVendorIds.set(new Set(mappedRFQ.vendors.map(v => v.vendorId)));

          this.notificationService.success(
            this.translate.instant('procurement.rfqs.notif_dispatched_title'),
            this.translate.instant('procurement.rfqs.notif_dispatched_desc', { rfq: rfq.rfqNumber })
          );
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to invite vendors.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  // ── Award / Reject / Revision ─────────────────────────────────────────────

  awardVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.isLoading.set(true);
    this.procurementService.awardRFQ(rfq.id, { vendorId: quote.vendorId, quotationId: quote.id })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: awardedRFQ => {
          const mappedRFQ = mapApiRFQ(awardedRFQ);
          this.rfqs.update(list => list.map(r => r.id === rfq.id ? mappedRFQ : r));

          this.notificationService.success(
            'procurement.quotation_comparison.notif_awarded_title',
            `RFQ ${rfq.rfqNumber} awarded to ${quote.vendorName}. PO created automatically.`
          );

          this.closeRFQDetails();
          this.router.navigate(['/procurement/purchase-orders']);
        },
        error: err => {
          const msg = err?.error?.message ?? 'Failed to award RFQ.';
          this.notificationService.danger('Error', msg);
        }
      });
  }

  rejectVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.procurementService.updateQuotationStatus(rfq.id, quote.id, { status: 'Rejected' }).subscribe({
      next: () => {
        this.rfqs.update(list => list.map(r => {
          if (r.id !== rfq.id) return r;
          const updatedQ = r.quotations.map(q =>
            q.id === quote.id ? { ...q, status: 'Rejected' as const } : q
          );
          return { ...r, quotations: updatedQ };
        }));
        const updated = this.rfqs().find(r => r.id === rfq.id);
        if (updated) this.selectedRFQ.set(updated);
        this.cdr.markForCheck();
        this.notificationService.warning(
          'procurement.rfq.notif_rejected_title',
          'procurement.rfq.notif_rejected_desc'
        );
      },
      error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to reject.')
    });
  }

  requestRevisionVendor(quote: RFQQuotation) {
    const rfq = this.selectedRFQ();
    if (!rfq) return;

    this.procurementService.updateQuotationStatus(rfq.id, quote.id, { status: 'Revision Requested' }).subscribe({
      next: () => {
        this.rfqs.update(list => list.map(r => {
          if (r.id !== rfq.id) return r;
          const updatedQ = r.quotations.map(q =>
            q.id === quote.id ? { ...q, status: 'Revision Requested' as const } : q
          );
          return { ...r, quotations: updatedQ };
        }));
        const updated = this.rfqs().find(r => r.id === rfq.id);
        if (updated) this.selectedRFQ.set(updated);
        this.cdr.markForCheck();
        this.notificationService.info(
          'procurement.rfq.notif_revision_title',
          'procurement.rfq.notif_revision_desc'
        );
      },
      error: err => this.notificationService.danger('Error', err?.error?.message ?? 'Failed to request revision.')
    });
  }

  getRFQItems(rfq: RFQ | null): PurchaseRequestItem[] {
    if (!rfq) return [];
    const pr = this.purchaseRequests().find(p => p.id === rfq.purchaseRequestId);
    return pr ? pr.items : [];
  }

  printRFQ(rfq: RFQ) {
    this.auditService.log({
      action: 'Status Change',
      module: 'Procurement',
      entityName: 'RFQ',
      entityId: rfq.rfqNumber,
      details: 'User printed/downloaded RFQ document ' + rfq.rfqNumber
    });
    window.print();
  }

  printSourcePR() {
    const pr = this.selectedPRSource();
    if (!pr) return;
    this.auditService.log({
      action: 'Status Change',
      module: 'Procurement',
      entityName: 'Purchase Request',
      entityId: pr.requestNumber,
      details: 'User printed/downloaded PR document from RFQ creation form: ' + pr.requestNumber
    });
    window.print();
  }
}