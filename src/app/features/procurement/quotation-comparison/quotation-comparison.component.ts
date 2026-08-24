import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RFQ, RFQQuotation } from '../../../shared/interfaces/rfq.interface';
import { ProcurementService } from '../../../core/services/procurement.service';
import { finalize } from 'rxjs/operators';

// ─── Mappers (reused from rfqs) ───────────────────────────────────────────────

function mapApiRFQ(raw: any): RFQ {
  return {
    id:                    raw._id ?? raw.id,
    rfqNumber:             raw.rfqNumber ?? raw.documentNumber ?? '',
    documentNumber:        raw.documentNumber ?? '',
    procurementChain:      raw.procurementChain ?? '',
    rootProcurementNumber: raw.rootProcurementNumber ?? '',
    chainId:               raw.chainId ?? raw._id ?? raw.id,
    parentDocumentId:      raw.purchaseRequestId ?? '',
    parentDocumentNumber:  raw.purchaseRequestNumber ?? '',
    purchaseRequestId:     raw.purchaseRequestId ?? '',
    purchaseRequestNumber: raw.purchaseRequestNumber ?? '',
    title:                 raw.title ?? '',
    createdDate:           raw.createdAt ?? '',
    deadlineDate:          raw.deadlineDate ?? '',
    status:                raw.status ?? 'Sent',
    vendors:               (raw.vendors ?? []).map((v: any) => ({
      vendorId: v.vendorId ?? '', vendorName: v.vendorName ?? '',
      contactEmail: v.contactEmail ?? '', status: v.status ?? 'Pending',
      invitationSentDate: v.invitationSentDate
    })),
    quotations: (raw.quotations ?? []).map((q: any) => ({
      id:               q._id ?? q.id,
      quotationNumber:  q.quotationNumber ?? '',
      quotationSequence: q.quotationSequence ?? 1,
      procurementChain: q.procurementChain ?? '',
      vendorId:         q.vendorId ?? '',
      vendorName:       q.vendorName ?? '',
      price:            q.price ?? q.subtotal ?? 0,
      deliveryWeeks:    q.deliveryWeeks ?? 2,
      submissionDate:   q.submissionDate,
      subtotal:         q.subtotal ?? q.price ?? 0,
      taxPercent:       q.taxPercent ?? 15,
      taxAmount:        q.taxAmount ?? 0,
      totalAmount:      q.totalAmount ?? 0,
      status:           q.status ?? 'Submitted',
      items:            q.items ?? [],
    })),
    awardedVendorId:   raw.awardedVendorId,
    awardedVendorName: raw.awardedVendorName,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-quotation-comparison',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './quotation-comparison.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotationComparisonComponent implements OnInit {
  private readonly procurementService  = inject(ProcurementService);
  private readonly breadcrumbService   = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly route               = inject(ActivatedRoute);
  private readonly router              = inject(Router);
  private readonly translate           = inject(TranslateService);
  private readonly cdr                 = inject(ChangeDetectorRef);

  // ── State ─────────────────────────────────────────────────────────────────
  readonly rfqs             = signal<RFQ[]>([]);
  readonly purchaseRequests = signal<any[]>([]);
  readonly isLoading        = signal<boolean>(false);
  readonly selectedRFQId    = signal<string | null>(null);

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly activeRFQ = computed(() => {
    const id = this.selectedRFQId();
    if (!id) return null;
    return this.rfqs().find(r => r.id === id) || null;
  });

  readonly sourcePRItems = computed(() => {
    const rfq = this.activeRFQ();
    if (!rfq) return [];
    const pr = this.purchaseRequests().find(p => p.id === rfq.purchaseRequestId);
    return pr ? pr.items : [];
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.procurement'), url: '/procurement' },
      { label: this.translate.instant('procurement.quotation_comparison.breadcrumb') }
    ]);

    this.loadRFQs();

    this.route.queryParams.subscribe(params => {
      const id = params['rfqId'];
      if (id) {
        this.selectedRFQId.set(id);
        // جلب تفاصيل الـ RFQ المحدد مباشرة إن لم يكن محملاً
        this.procurementService.getRFQById(id).subscribe({
          next: detail => {
            const mapped = mapApiRFQ(detail);
            this.rfqs.update(list => {
              const exists = list.some(r => r.id === mapped.id);
              return exists ? list.map(r => r.id === mapped.id ? mapped : r) : [mapped, ...list];
            });
            this.cdr.markForCheck();
          },
          error: () => {}
        });
      }
    });
  }

  private loadRFQs() {
    this.isLoading.set(true);
    this.procurementService.getRFQs(1, 200)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = res?.items ?? (Array.isArray(res) ? res : []);
          this.rfqs.set(raw.map(mapApiRFQ));
        },
        error: err => console.error('Failed to load RFQs for comparison:', err)
      });
  }

  onRFQChange(id: string) {
    this.selectedRFQId.set(id || null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: id ? { rfqId: id } : {},
      queryParamsHandling: 'merge'
    });

    // جلب تفاصيل الـ RFQ مع كل الـ quotations
    if (id) {
      this.procurementService.getRFQById(id).subscribe({
        next: detail => {
          const mapped = mapApiRFQ(detail);
          this.rfqs.update(list => list.map(r => r.id === id ? mapped : r));
          this.cdr.markForCheck();
        },
        error: () => {}
      });
    }
  }

  awardContract(quote: RFQQuotation) {
    const rfq = this.activeRFQ();
    if (!rfq) return;

    this.isLoading.set(true);
    this.procurementService.awardRFQ(rfq.id, { vendorId: quote.vendorId, quotationId: quote.id })
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: awardedRFQ => {
          const mappedRFQ = mapApiRFQ(awardedRFQ);
          this.rfqs.update(list => list.map(r => r.id === rfq.id ? mappedRFQ : r));

          this.notificationService.success(
            this.translate.instant('procurement.quotation_comparison.notif_awarded_title'),
            this.translate.instant('procurement.quotation_comparison.notif_awarded_desc', {
              vendor: quote.vendorName
            })
          );

          // انتقل إلى Purchase Orders — الـ Backend أنشأ الـ PO تلقائياً
          this.router.navigate(['/procurement/purchase-orders']);
        },
        error: err => {
          this.notificationService.danger(
            this.translate.instant('procurement.quotation_comparison.err_failed_title'),
            err?.error?.message ?? this.translate.instant('procurement.quotation_comparison.err_failed_desc')
          );
        }
      });
  }
}
