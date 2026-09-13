import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';

@Component({
  selector: 'app-vendor-rfq-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './rfq-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqDetailsComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly vendorApi = inject(VendorApiService);

  readonly rfqId = signal<string | null>(null);
  readonly apiRFQ = signal<any | null>(null);
  readonly isLoading = signal<boolean>(false);

  readonly activeRFQ = computed(() => {
    return this.apiRFQ();
  });

  readonly activePR = computed(() => {
    const rfq = this.apiRFQ();
    if (!rfq) return null;
    return {
      items: rfq.items || rfq.purchaseRequest?.items || []
    };
  });

  readonly vendorStatus = computed(() => {
    const rfq = this.apiRFQ();
    if (!rfq) return 'Pending';
    return rfq.myStatus || rfq.status || 'Pending';
  });

  readonly myQuotation = computed(() => {
    const rfq = this.apiRFQ();
    if (!rfq) return null;
    return rfq.myQuotation || null;
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal', url: '/vendor-portal' },
      { label: this.translate.instant('vendor.portal.my_rfqs') || 'My RFQs', url: '/vendor-portal/rfqs' },
      { label: this.translate.instant('vendor.portal.rfq_details') || 'RFQ Details' }
    ]);

    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.rfqId.set(id);
      if (id) {
        this.loadDetails(id);
      }
    });
  }

  loadDetails(id: string) {
    this.isLoading.set(true);
    this.vendorApi.getPortalRFQDetails(id).subscribe({
      next: (res) => {
        if (res?.data) {
          this.apiRFQ.set(res.data);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.apiRFQ.set(null);
        this.isLoading.set(false);
      }
    });
  }
}
