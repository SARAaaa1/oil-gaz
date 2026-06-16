import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-vendor-rfq-details',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './rfq-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RfqDetailsComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);

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

  readonly vendorStatus = computed(() => {
    const rfq = this.activeRFQ();
    const vId = this.authService.currentUser()?.vendorId;
    if (!rfq || !vId) return 'Pending';
    const v = rfq.vendors.find(item => item.vendorId === vId);
    return v ? v.status : 'Pending';
  });

  readonly myQuotation = computed(() => {
    const rfq = this.activeRFQ();
    const vId = this.authService.currentUser()?.vendorId;
    if (!rfq || !vId) return null;
    return rfq.quotations.find(q => q.vendorId === vId) || null;
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
    });
  }
}
