import { Component, OnInit, signal, computed, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MockDataService } from '../../../core/services/mock-data.service';
import { AuthService } from '../../../core/services/auth.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';

@Component({
  selector: 'app-vendor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  readonly authService = inject(AuthService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly translate = inject(TranslateService);

  readonly rfqList = this.mockDataService.rfqs;

  // Filter RFQs assigned to the logged-in vendor
  readonly myRFQs = computed(() => {
    const vId = this.authService.currentUser()?.vendorId;
    if (!vId) return [];
    return this.rfqList().filter(rfq => 
      rfq.vendors.some(v => v.vendorId === vId)
    );
  });

  // Calculate KPIs
  readonly kpis = computed(() => {
    const vId = this.authService.currentUser()?.vendorId;
    const list = this.myRFQs();
    
    let openCount = 0;
    let submittedCount = 0;
    let awardedCount = 0;
    let rejectedCount = 0;

    list.forEach(rfq => {
      const vState = rfq.vendors.find(v => v.vendorId === vId);
      if (!vState) return;

      if (vState.status === 'Pending' || vState.status === 'Revision Requested') {
        openCount++;
      } else if (vState.status === 'Submitted') {
        submittedCount++;
      } else if (vState.status === 'Accepted') {
        awardedCount++;
      } else if (vState.status === 'Rejected') {
        rejectedCount++;
      }
    });

    return {
      open: openCount,
      submitted: submittedCount,
      awarded: awardedCount,
      rejected: rejectedCount
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
  }

  getVendorStatus(rfq: any): string {
    const vId = this.authService.currentUser()?.vendorId;
    const v = rfq.vendors.find((item: any) => item.vendorId === vId);
    return v ? v.status : 'Pending';
  }

  getQuotationAmount(rfqId: string): number | null {
    const vId = this.authService.currentUser()?.vendorId;
    const rfq = this.rfqList().find(r => r.id === rfqId);
    if (!rfq) return null;
    const q = rfq.quotations.find(item => item.vendorId === vId);
    return q ? q.totalAmount : null;
  }
}
