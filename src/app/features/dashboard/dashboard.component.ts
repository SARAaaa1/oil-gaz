import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { ActivityTimelineComponent } from '../../shared/components/activity-timeline/activity-timeline.component';
import { AuditService } from '../../core/services/audit.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, KpiCardComponent, ActivityTimelineComponent, TranslateModule],
  templateUrl: './dashboard.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly auditService = inject(AuditService);

  // Expose signals from the data service
  readonly stats = this.mockDataService.stats;

  readonly activeRigs = computed(() => 
    this.mockDataService.rigs().slice(0, 3)
  );

  readonly pendingPRs = computed(() => 
    this.mockDataService.purchaseRequests().filter(pr => pr.status === 'Pending Approval')
  );

  readonly biddedRFQs = computed(() => 
    this.mockDataService.rfqs().filter(rfq => rfq.status === 'Quotations Received')
  );

  readonly pendingPOs = computed(() => 
    this.mockDataService.purchaseOrders().filter(po => po.status === 'Pending Approval')
  );

  readonly recentLogCount = computed(() => this.auditService.logs().length);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([]); // Top level has no sub-breadcrumbs
  }
}
