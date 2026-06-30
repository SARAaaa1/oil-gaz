import { Component, OnInit, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MockDataService } from '../../core/services/mock-data.service';
import { BreadcrumbService } from '../../core/services/breadcrumb.service';
import { ActivityTimelineComponent } from '../../shared/components/activity-timeline/activity-timeline.component';
import { AuditService } from '../../core/services/audit.service';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { WorkflowService } from '../../core/services/workflow.service';

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
  readonly authService = inject(AuthService);
  readonly workflowService = inject(WorkflowService);

  readonly stats = this.mockDataService.stats;
  readonly bankAccounts = this.mockDataService.bankAccountsDetails;
  readonly cashAccounts = this.mockDataService.cashAccountsDetails;
  readonly hseIncidents = this.mockDataService.hseIncidents;
  readonly currentUser = this.authService.currentUser;

  // Raw data
  readonly purchaseRequests = this.mockDataService.purchaseRequests;
  readonly rfqs = this.mockDataService.rfqs;
  readonly purchaseOrders = this.mockDataService.purchaseOrders;
  readonly inspectionRequests = this.mockDataService.inspectionRequests;
  readonly mrvs = this.mockDataService.mrvs;
  readonly supplierInvoices = this.mockDataService.supplierInvoices;
  readonly apAging = this.mockDataService.apAging;
  readonly inventoryItems = this.mockDataService.inventoryItems;
  readonly assetTransfers = this.mockDataService.assetTransfers;
  readonly workOrders = this.mockDataService.workOrders;
  readonly equipment = this.mockDataService.equipment;
  readonly rigs = this.mockDataService.rigs;

  // ─── Derived KPIs ───────────────────────────────────────────────────────────
  readonly openPRs = computed(() =>
    this.purchaseRequests().filter(pr => pr.status === 'Pending Approval' || pr.status === 'Draft').length
  );
  readonly openRFQs = computed(() =>
    this.rfqs().filter(r => r.status === 'Sent' || r.status === 'Partially Responded' || r.status === 'Fully Responded').length
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
  readonly activeRigs = computed(() => this.rigs().slice(0, 4));
  readonly recentLogCount = computed(() => this.auditService.logs().length);

  // ─── My Tasks ────────────────────────────────────────────────────────────────
  readonly pendingPRs = computed(() =>
    this.purchaseRequests().filter(pr => pr.status === 'Pending Approval')
  );
  readonly biddedRFQs = computed(() =>
    this.rfqs().filter(rfq => rfq.status === 'Partially Responded' || rfq.status === 'Fully Responded')
  );
  readonly pendingPOs = computed(() =>
    this.purchaseOrders().filter(po => po.status === 'Pending Approval')
  );
  readonly pendingWCCs = computed(() =>
    this.workflowService.wccs().filter(w => w.status === 'Draft' || w.status === 'Pending Approval')
  );
  readonly pendingInspectionsList = computed(() =>
    this.inspectionRequests().filter(i => i.status === 'Pending')
  );

  // ─── Critical Alerts ─────────────────────────────────────────────────────────
  readonly criticalStockItems = computed(() =>
    this.inventoryItems().filter(i => i.status === 'Out of Stock' || i.status === 'Low Stock').slice(0, 4)
  );
  readonly breakdownWorkOrders = computed(() =>
    this.workOrders().filter(wo => wo.type === 'Breakdown' && wo.status !== 'Completed').slice(0, 4)
  );
  readonly expiredPermits = computed(() =>
    this.mockDataService.ptws().filter(p => p.status === 'Expired').slice(0, 3)
  );
  readonly criticalAlertsCount = computed(() =>
    this.criticalStock() + this.breakdownWorkOrders().length + this.expiredPermits().length
  );

  // ─── CHART 1: Procurement Pipeline (horizontal bars) ────────────────────────
  // Shows the volume in each procurement stage as %‑of‑total
  readonly procurementPipeline = computed(() => {
    const stages = [
      { label: 'Purchase Requests', labelAr: 'طلبات الشراء', count: this.purchaseRequests().length, color: '#f59e0b', icon: '📋' },
      { label: 'RFQs Sent', labelAr: 'طلبات عروض أسعار', count: this.rfqs().length, color: '#6366f1', icon: '📩' },
      { label: 'Purchase Orders', labelAr: 'أوامر الشراء', count: this.purchaseOrders().length, color: '#0ea5e9', icon: '🛒' },
      { label: 'Inspections', labelAr: 'الفحص والاستلام', count: this.inspectionRequests().length, color: '#10b981', icon: '🔍' },
      { label: 'Goods Receipts', labelAr: 'إذن إضافة مخزن', count: this.mrvs().length, color: '#8b5cf6', icon: '📦' },
    ];
    const max = Math.max(...stages.map(s => s.count), 1);
    return stages.map(s => ({ ...s, pct: Math.round((s.count / max) * 100) }));
  });

  // ─── CHART 2: Inventory Health Donut ────────────────────────────────────────
  readonly inventoryDonut = computed(() => {
    const items = this.inventoryItems();
    const total = items.length || 1;
    const inStock = items.filter(i => i.status === 'In Stock').length;
    const lowStock = items.filter(i => i.status === 'Low Stock').length;
    const outOfStock = items.filter(i => i.status === 'Out of Stock').length;

    const circ = 251.32;
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

  // ─── CHART 3: Equipment Fleet Donut ─────────────────────────────────────────
  readonly equipmentDonut = computed(() => {
    const list = this.equipment();
    const total = list.length || 1;
    const active = list.filter(e => e.status === 'Active').length;
    const maintenance = list.filter(e => e.status === 'Maintenance').length;
    const standby = list.filter(e => e.status === 'Standby').length;
    const outOfService = list.filter(e => e.status === 'Out Of Service').length;

    const circ = 251.32;
    const ap = active / total, mp = maintenance / total, sp = standby / total;

    return {
      total, active, maintenance, standby, outOfService,
      activePct: Math.round(ap * 100),
      maintPct: Math.round(mp * 100),
      standbyPct: Math.round(sp * 100),
      outPct: Math.round((outOfService / total) * 100),
      circ,
      activeStroke: ap * circ,
      maintStroke: mp * circ,
      standbyStroke: sp * circ,
      outStroke: (outOfService / total) * circ,
      activeOffset: 0,
      maintOffset: circ - ap * circ,
      standbyOffset: circ - ap * circ - mp * circ,
      outOffset: circ - ap * circ - mp * circ - sp * circ,
    };
  });

  // ─── CHART 4: Financial Overview bars (normalised to max) ───────────────────
  readonly financialBars = computed(() => {
    const vals = [
      { label: 'Cash & Bank Liquidity', labelAr: 'السيولة النقدية والبنكية', value: this.totalLiquidity(), color: '#10b981', unit: '$' },
      { label: 'Inventory Value', labelAr: 'قيمة المخزون', value: this.inventoryValue(), color: '#6366f1', unit: '$' },
      { label: 'AP Outstanding', labelAr: 'الذمم الدائنة', value: this.totalAPBalance(), color: '#ef4444', unit: '$' },
    ];
    const max = Math.max(...vals.map(v => v.value), 1);
    return vals.map(v => ({ ...v, pct: Math.round((v.value / max) * 100) }));
  });

  // ─── CHART 5: Work Orders Status Donut ──────────────────────────────────────
  readonly woDonut = computed(() => {
    const list = this.workOrders();
    const total = list.length || 1;
    const open = list.filter(w => w.status === 'Open').length;
    const inProgress = list.filter(w => w.status === 'In Progress').length;
    const completed = list.filter(w => w.status === 'Completed').length;

    const circ = 251.32;
    const op = open / total, ip = inProgress / total;

    return {
      total, open, inProgress, completed,
      openPct: Math.round(op * 100),
      inProgressPct: Math.round(ip * 100),
      completedPct: Math.round((completed / total) * 100),
      circ,
      openStroke: op * circ,
      inProgressStroke: ip * circ,
      completedStroke: (completed / total) * circ,
      openOffset: 0,
      inProgressOffset: circ - op * circ,
      completedOffset: circ - op * circ - ip * circ,
    };
  });

  navigate(path: string) { this.router.navigate([path]); }

  ngOnInit() { this.breadcrumbService.setBreadcrumbs([]); }
}
