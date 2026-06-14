import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ActivityTimelineComponent } from '../../shared/components/activity-timeline/activity-timeline.component';
import { AuditService } from '../../core/services/audit.service';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './dashboard.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly auditService = inject(AuditService);
  private readonly router = inject(Router);

  readonly stats = this.mockDataService.stats;
  readonly bankAccounts = this.mockDataService.bankAccountsDetails;
  readonly cashAccounts = this.mockDataService.cashAccountsDetails;
  readonly hseIncidents = this.mockDataService.hseIncidents;

  // Procurement
  readonly purchaseRequests = this.mockDataService.purchaseRequests;
  readonly rfqs = this.mockDataService.rfqs;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly inspectionRequests = this.mockDataService.inspectionRequests;
  readonly mrvs = this.mockDataService.mrvs;
  readonly supplierInvoices = this.mockDataService.supplierInvoices;
  readonly apAging = this.mockDataService.apAging;

  // Inventory & Assets
  readonly inventoryItems = this.mockDataService.inventoryItems;
  readonly assetTransfers = this.mockDataService.assetTransfers;
  readonly tripLogs = this.mockDataService.tripLogs;
  readonly workOrders = this.mockDataService.workOrders;

  // Derived KPIs
  readonly openPRs = computed(() =>
    this.purchaseRequests().filter(pr => pr.status === 'Pending Approval' || pr.status === 'Draft').length
  );
  readonly openRFQs = computed(() =>
    this.rfqs().filter(r => r.status === 'Sent' || r.status === 'Quotations Received').length
  );
  readonly openPOs = computed(() =>
    this.purchaseOrders().filter(po => po.status === 'Pending Approval' || po.status === 'Approved').length
  );
  readonly pendingInspections = computed(() =>
    this.inspectionRequests().filter(i => i.status === 'Pending').length
  );
  readonly pendingMRVs = computed(() =>
    this.mrvs().filter(m => m.status === 'Draft' || m.status === 'Pending Approval').length
  );
  readonly inventoryValue = computed(() =>
    this.inventoryItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  );
  readonly criticalStock = computed(() =>
    this.inventoryItems().filter(i => i.status === 'Out of Stock' || i.status === 'Low Stock').length
  );
  readonly totalFuelStock = computed(() =>
    this.mockDataService.fuelTanks().reduce((s, t) => s + t.currentLevelLiters, 0)
  );
  readonly assetsInTransit = computed(() =>
    this.assetTransfers().filter(t => t.status === 'Pending' || t.status === 'Completed').length
  );
  readonly openSupplierInvoices = computed(() =>
    this.supplierInvoices().filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid').length
  );
  readonly totalAPBalance = computed(() =>
    this.apAging().reduce((sum, entry) => sum + entry.totalDue, 0)
  );
  readonly totalLiquidity = computed(() => {
    const bankUSD = this.bankAccounts().reduce((s, b) => s + (b.currency === 'SAR' ? b.balance / 3.75 : b.balance), 0);
    const cashUSD = this.cashAccounts().reduce((s, c) => s + (c.currency === 'SAR' ? c.balance / 3.75 : c.balance), 0);
    return bankUSD + cashUSD;
  });
  readonly openWorkOrders = computed(() =>
    this.workOrders().filter(wo => wo.status === 'Open' || wo.status === 'In Progress').length
  );
  readonly ltiFreeDays = computed(() =>
    this.hseIncidents().filter(i => i.type === 'LTI').length === 0 ? 365 : 12
  );
  readonly activeRigs = computed(() => this.mockDataService.rigs().slice(0, 3));
  readonly pendingPRs = computed(() =>
    this.purchaseRequests().filter(pr => pr.status === 'Pending Approval')
  );
  readonly biddedRFQs = computed(() =>
    this.rfqs().filter(rfq => rfq.status === 'Quotations Received')
  );
  readonly pendingPOs = computed(() =>
    this.purchaseOrders().filter(po => po.status === 'Pending Approval')
  );
  readonly recentLogCount = computed(() => this.auditService.logs().length);

  navigate(path: string) { this.router.navigate([path]); }

  ngOnInit() { this.breadcrumbService.setBreadcrumbs([]); }
}
