import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { ProjectBudget, BudgetLine, BudgetStatus, BudgetCategory, BudgetLineStatus } from '../shared/budget.interfaces';
import { BranchService } from '../shared/branch.service';

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
  readonly financeApi         = inject(FinanceApiService);
  readonly branchService      = inject(BranchService);

  readonly budgets = signal<any[]>([]);
  readonly portfolioTotals = signal<any>(null);
  readonly isLoading = signal(false);

  readonly searchQuery      = signal('');
  readonly projectFilter    = signal('All');
  readonly costCenterFilter = signal('All');
  readonly categoryFilter   = signal('All');
  readonly statusFilter     = signal<BudgetStatus | 'All'>('All');
  readonly fiscalYearFilter = signal('All');
  readonly branchFilter     = signal('All');

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
    const list = this.budgets().map((b: ProjectBudget) => ({ code: b.projectCode, name: b.projectName }));
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
    const br  = this.branchFilter();

    return this.budgets()
      .filter((b: ProjectBudget) => {
        const mq = !q || b.budgetNumber.toLowerCase().includes(q) ||
                   b.projectName.toLowerCase().includes(q) ||
                   b.projectManager.toLowerCase().includes(q);
        const mp = prj === 'All' || b.projectCode === prj;
        const ms = st  === 'All' || b.status === st;
        const my = yr  === 'All' || b.fiscalYear === yr;
        const mb = br  === 'All' || (b.branchId || 'HeadOffice') === br;
        return mq && mp && ms && my && mb;
      })
      .sort((a, b) => b.budgetNumber.localeCompare(a.budgetNumber));
  });

  readonly activeBudget = computed(() => {
    const id = this.selectedId();
    return id ? (this.budgets().find((b: ProjectBudget) => b.id === id) ?? null) : null;
  });

  // Filter lines inside active budget based on Category and Cost Center
  readonly activeBudgetLines = computed(() => {
    const b = this.activeBudget();
    if (!b) return [];
    const cat = this.categoryFilter();
    const cc  = this.costCenterFilter();
    return b.lines.filter((l: any) => {
      const mc = cat === 'All' || l.category === cat;
      const mcc = cc === 'All' || l.costCenterCode === cc;
      return mc && mcc;
    });
  });

  // Unique cost centers in active budget
  readonly activeCostCenters = computed(() => {
    const b = this.activeBudget();
    if (!b) return [];
    const list = b.lines.map((l: any) => ({ code: l.costCenterCode, name: l.costCenterName }));
    const seen = new Set();
    return list.filter((c: any) => seen.has(c.code) ? false : seen.add(c.code));
  });

  // Warnings / Alerts engine
  readonly warnings = computed(() => {
    const b = this.activeBudget();
    if (!b || b.status !== 'Active') return [];
    const list: string[] = [];

    b.lines.forEach((l: any) => {
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
    const total = b.lines.reduce((s: any, l: any) => s + l.budgetAmount, 0);
    const actual = b.lines.reduce((s: any, l: any) => s + l.actualCost, 0);
    const committed = b.lines.reduce((s: any, l: any) => s + l.committedCost, 0);
    const forecast = actual + committed;
    const remaining = total - forecast;
    const utilPct = total > 0 ? Math.round((actual / total) * 100) : 0;
    const overBudgetCount = b.lines.filter((l: any) => l.status === 'Red').length;

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

  // Main global KPIs — includes all fields the template references
  readonly kpis = computed(() => {
    const list = this.budgets();
    let totalBudget = 0;
    let actualCost  = 0;
    let committedCost = 0;
    list.forEach((b: ProjectBudget) => {
      if (b.lines) {
        b.lines.forEach((l: BudgetLine) => {
          totalBudget   += l.budgetAmount;
          actualCost    += l.actualCost;
          committedCost += l.committedCost;
        });
      }
    });
    const forecastCost      = actualCost + committedCost;
    const availableBudget   = totalBudget - forecastCost;
    const utilizationPct    = totalBudget > 0 ? Math.round((actualCost / totalBudget) * 100) : 0;
    const forecastVariance  = totalBudget - forecastCost;
    const overBudgetItemCount = list.filter((b: ProjectBudget) =>
      b.lines?.some((l: BudgetLine) => l.actualCost + l.committedCost > l.budgetAmount)
    ).length;

    return {
      totalBudget,
      actualCost,
      committedCost,
      availableBudget,
      utilizationPct,
      forecastCost,
      forecastVariance,
      overBudgetItemCount,
      remaining: totalBudget - actualCost
    };
  });

  selectBudget(b: ProjectBudget) {
    this.selectedId.set(b.id);
    this.categoryFilter.set('All');
    this.costCenterFilter.set('All');
  }

  // Workflow actions
  submitBudget(b: ProjectBudget) {
    if (b.status !== 'Draft') return;
    this.financeApi.updateBudgetStatus(b.id, 'Submitted').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Submitted' } : item));
        this.notify.success('finance_v2.budget.msg.submitted', 'finance_v2.budget.msg.submitted_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Submitted' } : item));
        this.notify.success('finance_v2.budget.msg.submitted', 'finance_v2.budget.msg.submitted_desc');
      }
    });
  }

  approveBudget(b: ProjectBudget) {
    if (b.status !== 'Submitted') return;
    this.financeApi.updateBudgetStatus(b.id, 'Approved').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Approved', approvedBy: 'Sara Al-Rasheed', approvalDate: new Date().toISOString().split('T')[0] } : item));
        this.notify.success('finance_v2.budget.msg.approved', 'finance_v2.budget.msg.approved_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Approved', approvedBy: 'Sara Al-Rasheed', approvalDate: '2025-07-02' } : item));
        this.notify.success('finance_v2.budget.msg.approved', 'finance_v2.budget.msg.approved_desc');
      }
    });
  }

  rejectBudget(b: ProjectBudget) {
    if (b.status !== 'Submitted') return;
    this.financeApi.updateBudgetStatus(b.id, 'Draft').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Draft' } : item));
        this.notify.warning('finance_v2.budget.msg.rejected', 'finance_v2.budget.msg.rejected_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Draft' } : item));
        this.notify.warning('finance_v2.budget.msg.rejected', 'finance_v2.budget.msg.rejected_desc');
      }
    });
  }

  activateBudget(b: ProjectBudget) {
    if (b.status !== 'Approved') return;
    this.financeApi.updateBudgetStatus(b.id, 'Active').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Active' } : item));
        this.notify.success('finance_v2.budget.msg.activated', 'finance_v2.budget.msg.activated_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Active' } : item));
        this.notify.success('finance_v2.budget.msg.activated', 'finance_v2.budget.msg.activated_desc');
      }
    });
  }

  closeBudget(b: ProjectBudget) {
    if (b.status !== 'Active') return;
    this.financeApi.updateBudgetStatus(b.id, 'Closed').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Closed' } : item));
        this.notify.info('finance_v2.budget.msg.closed', 'finance_v2.budget.msg.closed_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Closed' } : item));
        this.notify.info('finance_v2.budget.msg.closed', 'finance_v2.budget.msg.closed_desc');
      }
    });
  }

  cancelBudget(b: ProjectBudget) {
    if (b.status === 'Closed' || b.status === 'Cancelled') return;
    this.financeApi.updateBudgetStatus(b.id, 'Closed').subscribe({
      next: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Cancelled' } : item));
        this.notify.warning('finance_v2.budget.msg.cancelled', 'finance_v2.budget.msg.cancelled_desc');
      },
      error: () => {
        this.budgets.update(arr => arr.map(item => item.id === b.id ? { ...item, status: 'Cancelled' } : item));
        this.notify.warning('finance_v2.budget.msg.cancelled', 'finance_v2.budget.msg.cancelled_desc');
      }
    });
  }

  duplicateBudget(b: ProjectBudget) {
    const list = this.budgets();
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
    this.budgets.update(arr => [...arr, duplicated]);
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
    
    const linesRecord = this.formLines().reduce((acc, l) => {
      acc[l.category] = l.budgetAmount;
      return acc;
    }, {} as Record<string, number>);

    this.isLoading.set(true);
    this.financeApi.createBudget({ 
      projectCode: this.formProjectCode(), 
      fiscalYear: +this.formFiscalYear(), 
      lines: linesRecord 
    }).subscribe({
      next: res => {
        this.isLoading.set(false);
        this.closeCreateModal();
        this.notify.success('finance_v2.budget.msg.saved', 'finance_v2.budget.msg.saved_desc');
        this.loadBudgets();
      },
      error: () => this.isLoading.set(false)
    });
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
    this.loadBudgets();
  }

  loadBudgets() {
    this.isLoading.set(true);
    this.financeApi.getBudgets({ fiscalYear: new Date().getFullYear() }).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((b: any) => ({
            id: b.id ?? b._id,
            budgetNumber: b.budgetNumber ?? b.code ?? '',
            projectCode: b.projectCode ?? '',
            projectName: b.projectName ?? b.title ?? '',
            fiscalYear: String(b.fiscalYear ?? '2025'),
            clientName: b.clientName ?? '',
            projectManager: b.projectManager ?? b.pm ?? '',
            status: b.status ?? 'Draft',
            approvedBy: b.approvedBy ?? '',
            approvalDate: b.approvalDate ?? '',
            lines: (b.lines ?? []).map((l: any) => ({
              id: l.id ?? l._id ?? 'l-' + Math.random(),
              category: l.category ?? 'Materials',
              costCenterCode: l.costCenterCode ?? '',
              costCenterName: l.costCenterName ?? '',
              budgetAmount: l.budgetAmount ?? l.amount ?? 0,
              actualCost: l.actualCost ?? 0,
              committedCost: l.committedCost ?? 0,
              remainingBudget: l.remainingBudget ?? ((l.budgetAmount ?? 0) - (l.actualCost ?? 0) - (l.committedCost ?? 0)),
              forecastCost: l.forecastCost ?? ((l.actualCost ?? 0) + (l.committedCost ?? 0)),
              variance: l.variance ?? 0,
              variancePct: l.variancePct ?? 0,
              status: l.status ?? 'Green'
            })),
            branchId: b.branchId ?? 'HeadOffice'
          }));
          this.budgets.set(mapped);
        }
        if (res?.portfolioTotals) {
          this.portfolioTotals.set(res.portfolioTotals);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
