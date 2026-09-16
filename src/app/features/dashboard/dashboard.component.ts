import { Component, OnInit, inject, computed, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ActivityTimelineComponent } from '../../shared/components/activity-timeline/activity-timeline.component';
import { AuditService } from '../../core/services/audit.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { WorkflowService } from '../../core/services/workflow.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../shared/interfaces/dashboard.interface';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ActivityTimelineComponent, TranslateModule],
  templateUrl: './dashboard.component.html',
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly mockDataService = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly auditService = inject(AuditService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);
  readonly workflowService = inject(WorkflowService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Live Backend Data Signal
  readonly liveData = this.dashboardService.dashboardData;
  readonly isLoading = this.dashboardService.isLoading;

  readonly currentUser = this.authService.currentUser;

  // Fallback Mock Data
  readonly purchaseRequests = this.mockDataService.purchaseRequests;
  readonly rfqs = this.mockDataService.rfqs;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly inspectionRequests = this.mockDataService.inspectionRequests;
  readonly mrvs = this.mockDataService.mrvs;
  readonly inventoryItems = this.mockDataService.inventoryItems;
  readonly workOrders = this.mockDataService.workOrders;
  readonly equipment = this.mockDataService.equipment;
  readonly rigs = this.mockDataService.rigs;
  readonly bankAccounts = this.mockDataService.bankAccountsDetails;
  readonly cashAccounts = this.mockDataService.cashAccountsDetails;
  readonly apAging = this.mockDataService.apAging;
  readonly hseIncidents = this.mockDataService.hseIncidents;

  // ─── Real / Dynamic KPIs ───────────────────────────────────────────────────

  readonly inventoryValue = computed(() => {
    const live = this.liveData();
    if (live?.kpis && typeof live.kpis.inventoryValue === 'number') {
      return live.kpis.inventoryValue;
    }
    return this.inventoryItems().reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  });

  readonly openPOs = computed(() => {
    const live = this.liveData();
    if (live?.kpis && typeof live.kpis.openPurchaseOrdersCount === 'number') {
      return live.kpis.openPurchaseOrdersCount;
    }
    return this.purchaseOrders().filter(po => po.status === 'Pending Approval' || po.status === 'Approved').length;
  });

  readonly criticalStock = computed(() => {
    const live = this.liveData();
    if (live?.kpis && typeof live.kpis.criticalStockCount === 'number') {
      return live.kpis.criticalStockCount;
    }
    return this.inventoryItems().filter(i => i.status === 'Out of Stock' || i.status === 'Low Stock').length;
  });

  // ─── Procurement Pipeline ──────────────────────────────────────────────────

  readonly totalPipelineRecords = computed(() => {
    const live = this.liveData();
    if (live?.procurementPipeline) {
      const p = live.procurementPipeline;
      return (p.purchaseRequestsCount || 0) + (p.rfqsCount || 0) + (p.purchaseOrdersCount || 0);
    }
    return this.purchaseRequests().length + this.rfqs().length + this.purchaseOrders().length;
  });

  readonly openPRs = computed(() => {
    const live = this.liveData();
    if (live?.procurementPipeline?.stageSummary && typeof live.procurementPipeline.stageSummary.openPRs === 'number') {
      return live.procurementPipeline.stageSummary.openPRs;
    }
    return this.purchaseRequests().filter(pr => pr.status === 'Pending Approval' || pr.status === 'Draft').length;
  });

  readonly openRFQs = computed(() => {
    const live = this.liveData();
    if (live?.procurementPipeline?.stageSummary && typeof live.procurementPipeline.stageSummary.activeRFQs === 'number') {
      return live.procurementPipeline.stageSummary.activeRFQs;
    }
    return this.rfqs().filter(r => r.status === 'Sent' || r.status === 'Partially Responded' || r.status === 'Fully Responded').length;
  });

  readonly pendingInspections = computed(() => {
    const live = this.liveData();
    if (live?.procurementPipeline?.stageSummary && typeof live.procurementPipeline.stageSummary.queueInspections === 'number') {
      return live.procurementPipeline.stageSummary.queueInspections;
    }
    return this.inspectionRequests().filter(i => i.status === 'Pending').length;
  });

  readonly pendingMRVs = computed(() => {
    const live = this.liveData();
    if (live?.procurementPipeline?.stageSummary && typeof live.procurementPipeline.stageSummary.pendingMRVs === 'number') {
      return live.procurementPipeline.stageSummary.pendingMRVs;
    }
    return this.mrvs().filter(m => m.status === 'Draft' || m.status === 'Pending Approval').length;
  });

  readonly procurementPipeline = computed(() => {
    const live = this.liveData();
    let prCount = this.purchaseRequests().length;
    let rfqCount = this.rfqs().length;
    let poCount = this.purchaseOrders().length;
    let inspectCount = this.inspectionRequests().length;
    let mrvCount = this.mrvs().length;

    if (live?.procurementPipeline) {
      const p = live.procurementPipeline;
      prCount = p.purchaseRequestsCount ?? prCount;
      rfqCount = p.rfqsCount ?? rfqCount;
      poCount = p.purchaseOrdersCount ?? poCount;
      inspectCount = p.inspectionsCount ?? inspectCount;
      mrvCount = p.goodsReceiptsCount ?? mrvCount;
    }

    const stages = [
      { label: 'Purchase Requests', labelAr: 'طلبات الشراء', count: prCount, color: '#f59e0b', icon: '📋' },
      { label: 'RFQs Sent', labelAr: 'طلبات عروض أسعار', count: rfqCount, color: '#6366f1', icon: '📩' },
      { label: 'Purchase Orders', labelAr: 'أوامر الشراء', count: poCount, color: '#0ea5e9', icon: '🛒' },
      { label: 'Inspections', labelAr: 'الفحص والاستلام', count: inspectCount, color: '#10b981', icon: '🔍' },
      { label: 'Goods Receipts', labelAr: 'إذن إضافة مخزن', count: mrvCount, color: '#8b5cf6', icon: '📦' },
    ];
    const max = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({ ...s, pct: Math.round((s.count / max) * 100) }));
  });

  // ─── Inventory Health Donut ────────────────────────────────────────────────

  readonly inventoryDonut = computed(() => {
    const live = this.liveData();
    const circ = 251.32;

    if (live?.inventoryHealth) {
      const h = live.inventoryHealth;
      const total = h.totalItems || 1;
      const inStock = h.inStock ?? 0;
      const lowStock = h.lowStock ?? 0;
      const outOfStock = h.outOfStock ?? 0;

      const inPct = inStock / total;
      const lowPct = lowStock / total;
      const outPct = outOfStock / total;

      return {
        total,
        inStock,
        lowStock,
        outOfStock,
        inStrokePct: h.inStockPercentage ?? Math.round(inPct * 100),
        lowStrokePct: h.lowStockPercentage ?? Math.round(lowPct * 100),
        outStrokePct: h.outOfStockPercentage ?? Math.round(outPct * 100),
        circ,
        inStroke: inPct * circ,
        lowStroke: lowPct * circ,
        outStroke: outPct * circ,
        inOffset: 0,
        lowOffset: circ - inPct * circ,
        outOffset: circ - inPct * circ - lowPct * circ,
      };
    }

    const items = this.inventoryItems();
    const total = items.length || 1;
    const inStock = items.filter(i => i.status === 'In Stock').length;
    const lowStock = items.filter(i => i.status === 'Low Stock').length;
    const outOfStock = items.filter(i => i.status === 'Out of Stock').length;

    const inPct = inStock / total;
    const lowPct = lowStock / total;
    const outPct = outOfStock / total;

    return {
      total,
      inStock, lowStock, outOfStock,
      inStrokePct: Math.round(inPct * 100),
      lowStrokePct: Math.round(lowPct * 100),
      outStrokePct: Math.round(outPct * 100),
      circ,
      inStroke: inPct * circ,
      lowStroke: lowPct * circ,
      outStroke: outPct * circ,
      inOffset: 0,
      lowOffset: circ - inPct * circ,
      outOffset: circ - inPct * circ - lowPct * circ,
    };
  });

  // ─── My Tasks ──────────────────────────────────────────────────────────────

  readonly pendingPRs = computed(() => {
    const live = this.liveData();
    if (live?.myTasks?.pendingPRs && Array.isArray(live.myTasks.pendingPRs)) {
      return live.myTasks.pendingPRs;
    }
    return this.purchaseRequests().filter(pr => pr.status === 'Pending Approval');
  });

  readonly pendingInspectionsList = computed(() => {
    const live = this.liveData();
    if (live?.myTasks?.pendingInspections && Array.isArray(live.myTasks.pendingInspections)) {
      return live.myTasks.pendingInspections;
    }
    return this.inspectionRequests().filter(i => i.status === 'Pending');
  });

  // ─── Critical Alerts ───────────────────────────────────────────────────────

  readonly criticalStockItems = computed(() => {
    const live = this.liveData();
    if (live?.criticalStockAlerts && Array.isArray(live.criticalStockAlerts)) {
      return live.criticalStockAlerts;
    }
    return this.inventoryItems().filter(i => i.status === 'Out of Stock' || i.status === 'Low Stock').slice(0, 4);
  });

  readonly recentLogCount = computed(() => this.auditService.logs().length);

  // Unused / Commented elements fallback
  readonly pendingWCCs = computed(() =>
    this.workflowService.wccs().filter(w => w.status === 'Draft' || w.status === 'Pending Approval')
  );
  readonly breakdownWorkOrders = computed(() =>
    this.workOrders().filter(wo => wo.type === 'Breakdown' && wo.status !== 'Completed').slice(0, 4)
  );
  readonly expiredPermits = computed(() =>
    this.mockDataService.ptws().filter(p => p.status === 'Expired').slice(0, 3)
  );
  readonly criticalAlertsCount = computed(() => this.criticalStock());
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
  readonly activeRigs = computed(() => this.rigs().slice(0, 4));
  readonly totalFuelStock = computed(() =>
    this.mockDataService.fuelTanks().reduce((s, t) => s + t.currentLevelLiters, 0)
  );
  readonly openSupplierInvoices = computed(() =>
    this.mockDataService.supplierInvoices().filter(i => i.status === 'Unpaid' || i.status === 'Partially Paid').length
  );
  readonly financialBars = computed<{ label: string; unit: string; value: number; pct: number; color: string }[]>(() => []);
  readonly equipmentDonut = computed(() => ({
    total: 0, active: 0, maintenance: 0, standby: 0, outOfService: 0,
    activePct: 0, maintPct: 0, standbyPct: 0, outPct: 0,
    circ: 251.32, activeStroke: 0, maintStroke: 0, standbyStroke: 0, outStroke: 0,
    activeOffset: 0, maintOffset: 0, standbyOffset: 0, outOffset: 0
  }));
  readonly woDonut = computed(() => ({
    total: 0, open: 0, inProgress: 0, completed: 0,
    openPct: 0, inProgressPct: 0, completedPct: 0,
    circ: 251.32, openStroke: 0, inProgressStroke: 0, completedStroke: 0,
    openOffset: 0, inProgressOffset: 0, completedOffset: 0
  }));

  navigate(path: string) { this.router.navigate([path]); }

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([]);
    this.loadRealDashboardData();
  }

  loadRealDashboardData() {
    this.dashboardService.getStatistics().subscribe({
      next: () => {
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('Dashboard live API fallback to mock data:', err?.message || err);
        this.cdr.markForCheck();
      }
    });
  }
}
