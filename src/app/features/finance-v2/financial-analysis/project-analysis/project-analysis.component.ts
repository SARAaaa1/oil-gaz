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
import { ArMockService } from '../../shared/ar-mock.service';

@Component({
  selector: 'app-project-analysis',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './project-analysis.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectAnalysisComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly workflowService = inject(WorkflowService);
  readonly mockDataService = inject(MockDataService);
  readonly financeMockService = inject(FinanceV2MockService);
  readonly apMockService = inject(ApMockService);
  readonly arMockService = inject(ArMockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly selectedProjectCode = signal<string>('');
  readonly startDate = signal<string>('2025-01-01');
  readonly endDate = signal<string>('2025-12-31');
  readonly statusFilter = signal<string>('ALL');
  readonly currencyFilter = signal<string>('SAR');
  readonly showClosed = signal<boolean>(true);

  // ── View management ────────────────────────────────────────────────
  readonly currentTab = signal<string>('overview');
  readonly searchQuery = signal<string>('');
  readonly toastMessage = signal<string>('');
  readonly savedViews = signal<string[]>(['Default View', 'Aramco Active Projects']);
  readonly currentView = signal<string>('Default View');

  // Column chooser / Grouping / Sorting
  readonly sortBy = signal<string>('date');
  readonly sortOrder = signal<'asc' | 'desc'>('desc');
  readonly activeColumns = signal<string[]>(['docNum', 'ref', 'date', 'amount', 'status', 'actions']);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'navigation.financial_analysis' },
      { label: 'navigation.project_analysis' }
    ]);
    
    // Auto-select first project if available
    const projs = this.workflowService.projects();
    if (projs.length > 0) {
      this.selectedProjectCode.set(projs[0].code);
    }
  }

  // ── Available Projects ──────────────────────────────────────────
  readonly projectsList = computed(() => {
    const list = this.workflowService.projects();
    if (this.showClosed()) {
      return list;
    }
    return list.filter(p => p.status !== 'Completed');
  });

  // ── Active Project object ─────────────────────────────────────────
  readonly activeProject = computed(() => {
    const code = this.selectedProjectCode();
    return this.workflowService.projects().find(p => p.code === code) || null;
  });

  // ── Project Budget (Budget Management Integration) ─────────────────
  readonly projectBudget = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return p.contractValue || 1500000;
  });

  // ── Actual Costs (Accumulated Direct Expenses) ──────────────────
  readonly actualCost = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    const cc = p.costCenterCode;
    const mivSum = this.mockDataService.mivs()
      .filter(m => m.destinationId === p.code || m.destinationId === cc)
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const fuelSum = this.mockDataService.fuelIssues()
      .filter(f => f.costCenterCode === cc)
      .reduce((sum, item) => sum + (item.totalCost || 0), 0);
    
    return mivSum + fuelSum + (p.contractValue * 0.65);
  });

  // ── Revenue (AR Customer Invoices) ──────────────────────────────
  readonly projectRevenue = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return this.arMockService.customerInvoices()
      .filter(i => i.projectCode === p.code && i.status !== 'Draft')
      .reduce((sum, i) => sum + i.grandTotal, 0) || (p.contractValue * p.progressPercent / 100);
  });

  // ── Profit Metrics ────────────────────────────────────────────────
  readonly profitValue = computed(() => this.projectRevenue() - this.actualCost());
  readonly profitPercent = computed(() => {
    const rev = this.projectRevenue();
    return rev > 0 ? (this.profitValue() / rev) * 100 : 0;
  });

  // ── Committed Costs & Open POs ──────────────────────────────────
  readonly openPoValue = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return this.mockDataService.purchaseOrders()
      .filter(po => po.projectId === p.code && po.status === 'Approved')
      .reduce((sum, po) => sum + po.totalAmount, 0);
  });

  readonly committedCost = computed(() => {
    return this.actualCost() + this.openPoValue();
  });

  // ── Cash Collected ───────────────────────────────────────────────
  readonly cashCollected = computed(() => {
    const p = this.activeProject();
    if (!p) return 0;
    return this.arMockService.collections()
      .filter(c => c.customerName.includes(p.customer))
      .reduce((sum, c) => sum + c.totalAmount, 0) || (this.projectRevenue() * 0.85);
  });

  // ── Tabs lists ────────────────────────────────────────────────────
  
  // 1. Invoices List
  readonly invoicesList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.arMockService.customerInvoices().filter(i => i.projectCode === p.code);
  });

  // 2. Collections List
  readonly collectionsList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.arMockService.collections().filter(c => c.customerName.includes(p.customer));
  });

  // 3. Purchasing POs
  readonly purchasingList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.mockDataService.purchaseOrders().filter(po => po.projectId === p.code);
  });

  // 4. Inventory Issues (MIV)
  readonly inventoryList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.mockDataService.mivs().filter(m => m.destinationId === p.code || m.destinationId === p.costCenterCode);
  });

  // 5. Payroll / Labor records
  readonly payrollList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.mockDataService.timesheets()
      .filter(t => t.rigId === p.costCenterCode || p.name.includes(t.rigName))
      .map((t, idx) => ({
        id: `PAY-REC-${idx}`,
        employeeName: t.rigName + ' Crew',
        role: 'Crew Rig Labor',
        date: t.month,
        amount: t.totalOperatingHours * 75,
        status: 'Paid'
      }));
  });

  // 6. Assets Assigned
  readonly assetsList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.mockDataService.assetAssignments().filter(a => a.assignedToId === p.code || a.assignedToId === p.costCenterCode);
  });

  // 7. Journal Entries
  readonly journalEntriesList = computed(() => {
    const p = this.activeProject();
    if (!p) return [];
    return this.financeMockService.journalEntries().filter(je => 
      je.lines.some(l => l.costCenterCode === p.costCenterCode)
    );
  });

  // ── Simulated Charts ──────────────────────────────────────────────
  readonly chartMax = computed(() => Math.max(this.projectBudget(), this.actualCost(), this.projectRevenue()) || 1);

  // ── Helper methods ────────────────────────────────────────────────
  formatAmount(val: number): string {
    const factor = this.currencyFilter() === 'USD' ? 0.27 : 1;
    const finalVal = val * factor;
    return finalVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
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

  saveView() {
    const name = `View ${this.savedViews().length + 1}`;
    this.savedViews.update(v => [...v, name]);
    this.currentView.set(name);
    this.showToast('finance_v2.analysis.msg_view_saved');
  }

  onDrillDown(type: string, id: string) {
    this.router.navigate(['/finance/drill-down'], { queryParams: { type, id } });
  }

  toggleSort(column: string) {
    if (this.sortBy() === column) {
      this.sortOrder.update(o => o === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortBy.set(column);
      this.sortOrder.set('desc');
    }
  }
}
