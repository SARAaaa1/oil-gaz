import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RFQ, RFQQuotation } from '../../../shared/interfaces/rfq.interface';

@Component({
  selector: 'app-quotation-comparison',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './quotation-comparison.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuotationComparisonComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  // States
  readonly rfqs = this.mockDataService.rfqs;
  readonly purchaseRequests = this.mockDataService.purchaseRequests;

  readonly selectedRFQId = signal<string | null>(null);

  // Computed active RFQ
  readonly activeRFQ = computed(() => {
    const id = this.selectedRFQId();
    if (!id) return null;
    return this.rfqs().find(r => r.id === id) || null;
  });

  // Computed source items
  readonly sourcePRItems = computed(() => {
    const rfq = this.activeRFQ();
    if (!rfq) return [];
    const pr = this.purchaseRequests().find(p => p.id === rfq.purchaseRequestId);
    return pr ? pr.items : [];
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('navigation.procurement'), url: '/procurement' },
      { label: this.translate.instant('procurement.quotation_comparison.breadcrumb') }
    ]);

    // Check query params
    this.route.queryParams.subscribe(params => {
      const id = params['rfqId'];
      if (id) {
        this.selectedRFQId.set(id);
      }
    });
  }

  onRFQChange(id: string) {
    this.selectedRFQId.set(id ? id : null);
    // Sync query parameters without reload
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: id ? { rfqId: id } : {},
      queryParamsHandling: 'merge'
    });
  }

  awardContract(quote: RFQQuotation) {
    const rfq = this.activeRFQ();
    if (!rfq) return;

    const newPO = this.mockDataService.createPOFromRFQ(rfq.id, quote.vendorId);
    if (newPO) {
      this.notificationService.success(
        'Contract Awarded',
        `Purchase Order ${newPO.poNumber} has been successfully generated for ${quote.vendorName}.`
      );

      // Redirect to Purchase Orders with newly created PO highlighted
      this.router.navigate(['/procurement/purchase-orders'], {
        queryParams: { poId: newPO.id }
      });
    } else {
      this.notificationService.danger(
        'Action Failed',
        'Could not create Purchase Order from this quotation. Please try again.'
      );
    }
  }
}
