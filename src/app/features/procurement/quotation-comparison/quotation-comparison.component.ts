import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RFQ, RFQQuotation } from '../../../shared/interfaces/rfq.interface';
import { ProcurementService } from '../../../core/services/procurement.service';
import { extractApiArray } from '../../../core/services/inventory-api.service';
import { finalize } from 'rxjs/operators';

// ─── Mappers (reused from rfqs) ───────────────────────────────────────────────

function mapApiRFQ(raw: any): RFQ {
  const prObj = (raw.purchaseRequestId && typeof raw.purchaseRequestId === 'object') ? raw.purchaseRequestId : null;
  const prId = prObj ? (prObj._id ?? prObj.id) : (raw.purchaseRequestId ?? '');
  const prNum = prObj?.requestNumber ?? raw.purchaseRequestNumber ?? '';
  const rfqItems = (raw.items && raw.items.length > 0) ? raw.items : (prObj?.items ?? []);

  const quotations: RFQQuotation[] = (raw.quotations ?? []).map((q: any) => ({
    id:                q._id ?? q.id,
    quotationNumber:   q.quotationNumber ?? '',
    quotationSequence: q.quotationSequence ?? 1,
    procurementChain:  q.procurementChain ?? '',
    vendorId:          q.vendorId ?? '',
    vendorName:        q.vendorName ?? '',
    price:             q.price ?? q.subtotal ?? 0,
    deliveryWeeks:     q.deliveryWeeks ?? 2,
    submissionDate:    q.submissionDate,
    subtotal:          q.subtotal ?? q.price ?? 0,
    taxPercent:        q.taxPercent ?? 15,
    taxAmount:         q.taxAmount ?? 0,
    totalAmount:       q.totalAmount ?? 0,
    status:            q.status ?? 'Submitted',
    notes:             q.notes ?? q.remarks ?? '',
    items:             q.items ?? [],
    isBestPrice:       false,
    isRecommended:     false,
  }));

  if (quotations.length > 0) {
    const validPrices = quotations.map(q => q.price).filter(p => p > 0);
    if (validPrices.length > 0) {
      const minPrice = Math.min(...validPrices);
      quotations.forEach(q => {
        q.isBestPrice = q.price === minPrice;
      });
      const bestQuotes = quotations.filter(q => q.isBestPrice);
      const minWeeks = Math.min(...bestQuotes.map(q => q.deliveryWeeks));
      const recommended = bestQuotes.find(q => q.deliveryWeeks === minWeeks);
      if (recommended) {
        recommended.isRecommended = true;
      }
    }
  }

  return {
    id:                    raw._id ?? raw.id,
    rfqNumber:             raw.rfqNumber ?? raw.documentNumber ?? '',
    documentNumber:        raw.documentNumber ?? raw.rfqNumber ?? '',
    procurementChain:      raw.procurementChain ?? '',
    rootProcurementNumber: raw.rootProcurementNumber ?? '',
    chainId:               raw.chainId ?? raw._id ?? raw.id,
    parentDocumentId:      prId,
    parentDocumentNumber:  prNum,
    purchaseRequestId:     prId,
    purchaseRequestNumber: prNum,
    title:                 raw.title ?? '',
    createdDate:           raw.createdAt ?? raw.createdDate ?? '',
    deadlineDate:          raw.deadlineDate ?? '',
    status:                raw.status ?? 'Sent',
    items:                 rfqItems,
    vendors:               (raw.vendors ?? []).map((v: any) => ({
      vendorId: v.vendorId ?? '', vendorName: v.vendorName ?? '',
      contactEmail: v.contactEmail ?? '', status: v.status ?? 'Pending',
      invitationSentDate: v.invitationSentDate
    })),
    quotations,
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

    // 1. Direct items on the RFQ
    if (rfq.items && rfq.items.length > 0) {
      return rfq.items.map((i: any) => ({
        id: i._id ?? i.id ?? `item-${Math.random()}`,
        itemName: i.itemName ?? i.description ?? i.itemDescription ?? 'Item',
        quantity: i.quantity ?? 1,
        uom: i.uom ?? 'EA'
      }));
    }

    // 2. From loaded purchaseRequests list
    const pr = this.purchaseRequests().find(p => 
      p.id === rfq.purchaseRequestId || 
      (p as any)._id === rfq.purchaseRequestId ||
      (rfq.purchaseRequestNumber && p.requestNumber === rfq.purchaseRequestNumber)
    );
    if (pr && pr.items && pr.items.length > 0) {
      return pr.items;
    }

    // 3. Fallback from quotations line items if available
    const firstQWithItems = rfq.quotations?.find(q => q.items && q.items.length > 0);
    if (firstQWithItems && firstQWithItems.items) {
      return firstQWithItems.items.map((i: any) => ({
        id: i._id ?? i.id ?? `item-${Math.random()}`,
        itemName: i.itemName ?? i.description ?? i.itemDescription ?? 'Item',
        quantity: i.quantity ?? 1,
        uom: i.uom ?? 'EA'
      }));
    }

    return [];
  });

  // ── Init ──────────────────────────────────────────────────────────────────
  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.procurement'), url: '/procurement' },
      { label: this.translate.instant('procurement.quotation_comparison.breadcrumb') }
    ]);

    this.loadRFQs();
    this.loadPRs();

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

  private loadPRs() {
    this.procurementService.getPRs({ limit: 200 }).subscribe({
      next: res => {
        const raw = extractApiArray(res);
        this.purchaseRequests.set(raw.map((r: any) => ({
          id:            r._id ?? r.id,
          requestNumber: r.requestNumber ?? r.prNumber ?? r.documentNumber ?? '',
          items:         (r.items ?? []).map((i: any) => ({
            id:       i._id ?? i.id ?? `item-${Math.random()}`,
            itemName: i.itemName ?? i.description ?? 'Item',
            quantity: i.quantity ?? 1,
            uom:      i.uom ?? 'EA'
          }))
        })));
        this.cdr.markForCheck();
      },
      error: err => console.error('Failed to load PRs for comparison:', err)
    });
  }

  private loadRFQs() {
    this.isLoading.set(true);
    this.procurementService.getRFQs(1, 200)
      .pipe(finalize(() => { this.isLoading.set(false); this.cdr.markForCheck(); }))
      .subscribe({
        next: res => {
          const raw = extractApiArray(res);
          this.rfqs.set(raw.map(mapApiRFQ));
        },
        error: err => {
          console.error('Failed to load RFQs for comparison:', err);
          this.notificationService.danger('Error', 'Failed to load RFQs.');
        }
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
          let msg = this.translate.instant('procurement.quotation_comparison.err_failed_desc');
          if (err?.error?.message) {
            msg = Array.isArray(err.error.message) ? err.error.message.join(' | ') : err.error.message;
          } else if (err?.message) {
            msg = err.message;
          }
          this.notificationService.danger(
            this.translate.instant('procurement.quotation_comparison.err_failed_title'),
            msg
          );
        }
      });
  }
}
