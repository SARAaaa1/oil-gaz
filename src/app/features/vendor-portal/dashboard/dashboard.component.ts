import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { VendorApiService } from '../../../core/services/vendor-api.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);
  private readonly vendorApi = inject(VendorApiService);

  readonly apiDashboardData = signal<any | null>(null);
  readonly apiRFQs = signal<any[]>([]);

  // Filter RFQs strictly from Backend API
  readonly myRFQs = computed(() => {
    return this.apiRFQs();
  });

  // Calculate KPIs strictly from Backend API
  readonly kpis = computed(() => {
    const api = this.apiDashboardData();
    if (api) {
      return {
        open: api.openRFQs ?? 0,
        submitted: api.submittedBids ?? 0,
        awarded: api.awardedContracts ?? 0,
        rejected: api.rejectedBids ?? 0
      };
    }
    return {
      open: 0,
      submitted: 0,
      awarded: 0,
      rejected: 0
    };
  });

  // Recent RFQs
  readonly recentRFQs = computed(() => {
    return this.myRFQs().slice(0, 5);
  });

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: this.translate.instant('vendor.portal.breadcrumb_home') || 'Vendor Portal' },
      { label: this.translate.instant('vendor.dashboard.breadcrumb') || 'Dashboard' }
    ]);

    this.loadBackendData();
  }

  loadBackendData() {
    this.vendorApi.getPortalDashboard().subscribe({
      next: (res) => {
        if (res?.data) this.apiDashboardData.set(res.data);
      },
      error: () => {}
    });

    this.vendorApi.getPortalRFQs().subscribe({
      next: (res) => {
        const items = res?.data ?? [];
        this.apiRFQs.set(items);
      },
      error: () => {
        this.apiRFQs.set([]);
      }
    });
  }

  getVendorStatus(rfq: any): string {
    return rfq.myStatus || rfq.status || 'Pending';
  }

  getQuotationAmount(rfqId: string): number | null {
    const rfq = this.myRFQs().find(r => (r._id ?? r.id) === rfqId);
    if (!rfq) return null;
    return rfq.myQuotation?.totalAmount ?? null;
  }
}
