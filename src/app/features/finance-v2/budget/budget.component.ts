import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { BudgetMockService } from '../shared/budget-mock.service';
import { ProjectBudget, BudgetLine, BudgetStatus, BudgetCategory, BudgetLineStatus } from '../shared/budget.interfaces';

@Component({
  selector: 'app-finv2-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './budget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2BudgetComponent implements OnInit {
  private readonly breadcrumb = inject(BreadcrumbService);
  private readonly notify     = inject(NotificationService);
  readonly budgetService      = inject(BudgetMockService);

  readonly searchQuery     = signal('');
  readonly projectFilter   = signal('All');
  readonly costCenterFilter = signal('All');
  readonly categoryFilter   = signal('All');
  readonly statusFilter     = signal<BudgetStatus | 'All'>('All');
  readonly fiscalYearFilter = signal('All');

  readonly selectedId = signal<string | null>(null);

  // New budget form modal state
  readonly showCreateModal   = signal(false);
  readonly formProjectCode   = signal('');
  readonly formFiscalYear    = signal('2025');
  readonly formClient        = signal('');
  readonly formPM            = signal('');
  readonly formLines         = signal<Omit<BudgetLine, 'id' | 'remainingBudget' | 'forecastCost' | 'variance' | 'variancePct' | 'status'>[]>([]);

  // Category & cost center list options for dropdown filters
  readonly availableProjects = computed(() => {
    const list = this.budgetService.budgets().map(b => ({ code: b.projectCode, name: b.projectName }));
    // Deduplicate
    const seen = new Set();
    return list.filter(p => seen.has(p.code) ? false : seen.add(p.code));
  });

  readonly allCategories: BudgetCategory[] = [
    'Materials', 'Labor', 'Equipment', 'Subcontractors', 'Transportation',
    'Fuel', 'Maintenance', 'Accommodation', 'Administration', 'Other'
  ];

  readonly allStatuses: BudgetStatus[] = ['Draft', 'Submitted', 'Approved', 'Active', 'Closed', 'Cancelled'];

  readonly filtered = computed(() => {
    const q   = this.searchQuery().toLowerCase();
    const prj = this.projectFilter();
    const st  = this.statusFilter();
    const yr  = this.fiscalYearFilter();

    return this.budgetService.budgets()
      .filter(b => {
        const mq = !q || b.budgetNumber.toLowerCase().includes(q) ||
                   b.projectName.toLowerCase().includes(q) ||
                   b.projectManager.toLowerCase().includes(q);
        const mp = prj === 'All' || b.projectCode === prj;
        const ms = st === 'All' || b.status === st;
        const my = yr === 'All' || b.fiscalYear === yr;
        return mq && mp && ms && my;
      })
      .sort((a, b) => b.budgetNumber.localeCompare(a.budgetNumber));
  });

  readonly activeBudget = computed(() => {
    const id = this.selectedId();
    return id ? (this.budgetService.budgets().find(b => b.id === id) ?? null) : null;
  });

  // Filter lines inside active budget based on Category and Cost Center
  readonly activeBudgetLines = computed(() => {
    const b = this.activeBudget();
    if (!b) return [];
    const cat = this.categoryFilter();
    const cc  = this.costCenterFilter();
    return b.lines.filter(l => {
      const mc = cat === 'All' || l.category === cat;
      const mcc = cc === 'All' || l.costCenterCode === cc;
      return mc && mcc;
    });
  });

  // Unique cost centers in active budget
  readonly activeCostCenters = computed(() => {
    const b = this.activeBudget();
    if (!b) return [];
    const list = b.lines.map(l => ({ code: l.costCenterCode, name: l.costCenterName }));
    const seen = new Set();
    return list.filter(c => seen.has(c.code) ? false : seen.add(c.code));
  });

  // Warnings / Alerts engine
  readonly warnings = computed(() => {
    const b = this.activeBudget();
    if (!b || b.status !== 'Active') return [];
    const list: string[] = [];

    b.lines.forEach(l => {
      const totalCost = l.actualCost + l.committedCost;
      const utilPct = l.budgetAmount > 0 ? (totalCost / l.budgetAmount) * 100 : 0;

      if (utilPct > 100) {
        list.push(`finance_v2.budget.alerts.exceeded||${l.category} (${l.costCenterName})`);
      } else if (utilPct > 90) {
        list.push(`finance_v2.budget.alerts.above_90||${l.category} (${l.costCenterName})`);
      } else if (utilPct >= 80) {
        list.push(`finance_v2.budget.alerts.above_80||${l.category} (${l.costCenterName})`);
      }
    });

    return list;
  });

  // KPIs of the selected budget
  readonly activeBudgetKpis = computed(() => {
    const b = this.activeBudget();
    if (!b) return null;
    const total = b.lines.reduce((s, l) => s + l.budgetAmount, 0);
    const actual = b.lines.reduce((s, l) => s + l.actualCost, 0);
    const committed = b.lines.reduce((s, l) => s + l.committedCost, 0);
    const forecast = actual + committed;
    const remaining = total - forecast;
    const utilPct = total > 0 ? Math.round((actual / total) * 100) : 0;
    const overBudgetCount = b.lines.filter(l => l.status === 'Red').length;

    return {
      total,
      actual,
      committed,
      forecast,
      remaining,
      utilPct,
      overBudgetCount
    };
  });

  // Main global KPIs
  readonly kpis = this.budgetService.kpis;

  selectBudget(b: ProjectBudget) {
    this.selectedId.set(b.id);
    this.categoryFilter.set('All');
    this.costCenterFilter.set('All');
  }

  // Workflow actions
  submitBudget(b: ProjectBudget) {
    if (b.status !== 'Draft') return;
    this.budgetService.updateBudgetStatus(b.id, 'Submitted');
    this.notify.success('finance_v2.budget.msg.submitted', 'finance_v2.budget.msg.submitted_desc');
  }

  approveBudget(b: ProjectBudget) {
    if (b.status !== 'Submitted') return;
    this.budgetService.updateBudgetStatus(b.id, 'Approved', { approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-02' });
    this.notify.success('finance_v2.budget.msg.approved', 'finance_v2.budget.msg.approved_desc');
  }

  rejectBudget(b: ProjectBudget) {
    if (b.status !== 'Submitted') return;
    this.budgetService.updateBudgetStatus(b.id, 'Draft');
    this.notify.warning('finance_v2.budget.msg.rejected', 'finance_v2.budget.msg.rejected_desc');
  }

  activateBudget(b: ProjectBudget) {
    if (b.status !== 'Approved') return;
    this.budgetService.updateBudgetStatus(b.id, 'Active');
    this.notify.success('finance_v2.budget.msg.activated', 'finance_v2.budget.msg.activated_desc');
  }

  closeBudget(b: ProjectBudget) {
    if (b.status !== 'Active') return;
    this.budgetService.updateBudgetStatus(b.id, 'Closed');
    this.notify.info('finance_v2.budget.msg.closed', 'finance_v2.budget.msg.closed_desc');
  }

  cancelBudget(b: ProjectBudget) {
    if (b.status === 'Closed' || b.status === 'Cancelled') return;
    this.budgetService.updateBudgetStatus(b.id, 'Cancelled');
    this.notify.warning('finance_v2.budget.msg.cancelled', 'finance_v2.budget.msg.cancelled_desc');
  }

  duplicateBudget(b: ProjectBudget) {
    const list = this.budgetService.budgets();
    const nextNo = `BGT-2025-${String(list.length + 1).padStart(3, '0')}`;
    const duplicated: ProjectBudget = {
      ...b,
      id: `b${Date.now()}`,
      budgetNumber: nextNo,
      status: 'Draft',
      approvedBy: '',
      approvalDate: '',
      createdDate: '2025-07-02',
      lastUpdated: '2025-07-02',
      lines: b.lines.map((l, idx) => ({
        ...l,
        id: `bl_dup_${idx}_${Date.now()}`,
        actualCost: 0,
        committedCost: 0,
        remainingBudget: l.budgetAmount,
        forecastCost: 0,
        variance: l.budgetAmount,
        status: 'Green' as const
      }))
    };
    this.budgetService.budgets.update(arr => [...arr, duplicated]);
    this.selectedId.set(duplicated.id);
    this.notify.success('finance_v2.budget.msg.duplicated', 'finance_v2.budget.msg.duplicated_desc');
  }

  openCreateModal() {
    this.formProjectCode.set('PRJ-002');
    this.formFiscalYear.set('2025');
    this.formClient.set('SABIC Industries');
    this.formPM.set('Faisal Al-Qahtani');
    this.formLines.set([
      { category: 'Materials', costCenterCode: 'CC-PRJ-002-A', costCenterName: 'SABIC Site A', budgetAmount: 1_200_000, actualCost: 0, committedCost: 0, notes: 'Direct raw materials' },
      { category: 'Labor', costCenterCode: 'CC-PRJ-002-A', costCenterName: 'SABIC Site A', budgetAmount: 600_000, actualCost: 0, committedCost: 0, notes: 'Specialized engineers' }
    ]);
    this.showCreateModal.set(true);
  }

  closeCreateModal() {
    this.showCreateModal.set(false);
  }

  saveNewBudget() {
    if (!this.formProjectCode() || this.formLines().length === 0) return;
    
    const list = this.budgetService.budgets();
    const nextNo = `BGT-2025-${String(list.length + 1).padStart(3, '0')}`;
    const newLines = this.formLines().map((l, idx) => 
      this.budgetService.createLine(
        `bl_new_${idx}_${Date.now()}`, l.category, l.costCenterCode, l.costCenterName,
        l.budgetAmount, l.actualCost, l.committedCost, l.notes
      )
    );

    const newBudget: ProjectBudget = {
      id: `b${Date.now()}`,
      budgetNumber: nextNo,
      projectCode: this.formProjectCode(),
      projectName: this.formProjectCode() === 'PRJ-002' ? 'SABIC plant expansion' : 'New Project Expansion',
      projectManager: this.formPM(),
      client: this.formClient(),
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      fiscalYear: this.formFiscalYear(),
      status: 'Draft',
      currency: 'SAR',
      approvedBy: '',
      approvalDate: '',
      createdBy: 'Reem Al-Muaiqel',
      createdDate: '2025-07-02',
      lastUpdated: '2025-07-02',
      lines: newLines
    };

    this.budgetService.budgets.update(arr => [...arr, newBudget]);
    this.selectedId.set(newBudget.id);
    this.closeCreateModal();
    this.notify.success('finance_v2.budget.msg.saved', 'finance_v2.budget.msg.saved_desc');
  }

  // UIs helpers
  formatAmt(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  getStatusClass(s: BudgetStatus): string {
    switch (s) {
      case 'Draft':     return 'bg-slate-100 text-slate-600';
      case 'Submitted': return 'bg-amber-100 text-amber-700';
      case 'Approved':  return 'bg-blue-100 text-blue-700';
      case 'Active':    return 'bg-green-100 text-green-700';
      case 'Closed':    return 'bg-slate-200 text-slate-500';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default:          return 'bg-slate-100 text-slate-500';
    }
  }

  getLineStatusClass(s: BudgetLineStatus): string {
    switch (s) {
      case 'Green':  return 'bg-green-100 text-green-700';
      case 'Yellow': return 'bg-amber-100 text-amber-700';
      case 'Red':    return 'bg-red-100 text-red-700';
      default:       return 'bg-slate-100 text-slate-500';
    }
  }

  getLinePercent(l: BudgetLine): number {
    if (l.budgetAmount === 0) return 0;
    return Math.round((l.forecastCost / l.budgetAmount) * 100);
  }

  getAlertTranslate(alert: string): string {
    const parts = alert.split('||');
    return parts[0];
  }

  getAlertItem(alert: string): string {
    const parts = alert.split('||');
    return parts[1] || '';
  }

  ngOnInit() {
    this.breadcrumb.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.budget.title' }
    ]);
  }
}
