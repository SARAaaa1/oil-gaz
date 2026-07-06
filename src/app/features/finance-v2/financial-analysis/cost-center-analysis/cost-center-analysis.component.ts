import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../../core/services/language.service';
import { WorkflowService } from '../../../../core/services/workflow.service';
import { MockDataService } from '../../../../core/services/mock-data.service';
import { FinanceV2MockService } from '../../shared/finance-v2-mock.service';
import { ApMockService } from '../../shared/ap-mock.service';

@Component({
  selector: 'app-cost-center-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cost-center-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CostCenterAnalysisComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly financeMockService = inject(FinanceV2MockService);
  readonly apMockService = inject(ApMockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly selectedCcCode = signal<string>('CC-310');
  readonly selectedDept = signal<string>('ALL');
  readonly selectedProjCode = signal<string>('ALL');
  readonly periodFilter = signal<string>('2025-Q2');

  // ── UI States ─────────────────────────────────────────────────────
  readonly currentTab = signal<string>('expenses');
  readonly searchQuery = signal<string>('');
  readonly toastMessage = signal<string>('');
  readonly currentView = signal<string>('Default View');
  readonly savedViews = signal<string[]>(['Default View', 'HQ Cost Control']);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.cost_center_analysis' }
    ]);
  }

  // ── Available Cost Centers ────────────────────────────────────────
  readonly costCentersList = computed(() => {
    return this.financeMockService.costCenters();
  });

  // ── Active Cost Center ────────────────────────────────────────────
  readonly activeCc = computed(() => {
    const code = this.selectedCcCode();
    return this.financeMockService.costCenters().find(cc => cc.code === code) || null;
  });

  // ── KPI Computations ──────────────────────────────────────────────
  readonly ccBudget = computed(() => {
    const cc = this.activeCc();
    if (!cc) return 1000000;
    return cc.budget || 1200000;
  });

  readonly ccActual = computed(() => {
    const code = this.selectedCcCode();
    const mivSum = this.mockDataService.mivs()
      .filter(m => m.destinationId === code)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const fuelSum = this.mockDataService.fuelIssues()
      .filter(f => f.costCenterCode === code)
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
    const jvSum = this.financeMockService.journalEntries()
      .filter(je => je.lines.some(l => l.costCenterCode === code))
      .reduce((sum, je) => sum + je.totalDebit, 0);

    return mivSum + fuelSum + (jvSum * 0.4) || 750000;
  });

  readonly ccVariance = computed(() => {
    return this.ccBudget() - this.ccActual();
  });

  readonly ccCommitted = computed(() => {
    const code = this.selectedCcCode();
    const openPos = this.mockDataService.purchaseOrders()
      .filter(po => po.costCenter === code && po.status === 'Approved')
      .reduce((sum, po) => sum + po.totalAmount, 0);
    return this.ccActual() + openPos;
  });

  readonly ccRemainingBudget = computed(() => {
    return this.ccBudget() - this.ccCommitted();
  });

  // ── Expense Breakdown List ────────────────────────────────────────
  readonly expenseBreakdown = computed(() => {
    const actual = this.ccActual();
    return [
      { category: 'Material Cost', code: '5110', amount: actual * 0.45, pct: 45, color: '#4f46e5' },
      { category: 'Labor & Wages', code: '5120', amount: actual * 0.30, pct: 30, color: '#10b981' },
      { category: 'Equipment Fuel', code: '5135', amount: actual * 0.12, pct: 12, color: '#f59e0b' },
      { category: 'Site Maintenance', code: '5140', amount: actual * 0.08, pct: 8, color: '#ec4899' },
      { category: 'Indirect Overheads', code: '5190', amount: actual * 0.05, pct: 5, color: '#6b7280' }
    ];
  });

  // ── Tab Lists ─────────────────────────────────────────────────────

  readonly revenueList = computed(() => {
    return this.workflowService.invoices();
  });

  // 2. Payroll / Labor
  readonly payrollList = computed(() => {
    const code = this.selectedCcCode();
    return this.mockDataService.timesheets()
      .filter(t => t.rigId === code)
      .map((t, idx) => ({
        id: `PAY-${idx}`,
        employeeName: t.rigName + ' Crew',
        hours: t.totalOperatingHours,
        cost: t.totalOperatingHours * 80,
        period: t.month
      }));
  });

  // 3. Purchase Orders
  readonly poList = computed(() => {
    const code = this.selectedCcCode();
    return this.mockDataService.purchaseOrders().filter(po => po.costCenter === code);
  });

  // 4. Assets Deployed
  readonly assetsList = computed(() => {
    const code = this.selectedCcCode();
    return this.mockDataService.assetAssignments().filter(ass => ass.assignedToId === code);
  });

  // 5. Inventory Issues
  readonly inventoryList = computed(() => {
    const code = this.selectedCcCode();
    return this.mockDataService.mivs().filter(m => m.destinationId === code);
  });

  // 6. Journal Entries
  readonly journalEntriesList = computed(() => {
    const code = this.selectedCcCode();
    return this.financeMockService.journalEntries().filter(je =>
      je.lines.some(l => l.costCenterCode === code)
    );
  });

  // ── Methods ───────────────────────────────────────────────────────
  formatAmount(val: number): string {
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(''), 3000);
  }

  exportToExcel() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  exportToPDF() {
    this.showToast('finance_v2.analysis.msg_exported');
  }

  printReport() {
    window.print();
  }

  onDrillDown(type: string, id: string) {
    this.router.navigate(['/finance/drill-down'], { queryParams: { type, id } });
  }
}
