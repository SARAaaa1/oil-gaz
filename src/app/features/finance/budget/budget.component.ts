import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { WorkflowService } from '../../../core/services/workflow.service';
import { MockDataService } from '../../../core/services/mock-data.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { NotificationService } from '../../../core/services/notification.service';
import { LanguageService } from '../../../core/services/language.service';

export type BudgetCategory = 'Materials' | 'Labor' | 'Equipment' | 'Subcontractors' | 'Transportation' | 'G&A' | 'Contingency';

export interface BudgetLine {
  category: BudgetCategory;
  budgetAmount: number;
  actualAmount: number;
  committedAmount: number;
}

export interface ProjectBudget {
  id: string;
  projectCode: string;
  projectName: string;
  fiscalYear: number;
  totalBudget: number;
  lines: BudgetLine[];
  createdDate: string;
  status: 'Active' | 'Approved' | 'Draft';
}

const BUDGET_KEY = 'petroflow_project_budgets';

const CATEGORIES: BudgetCategory[] = ['Materials','Labor','Equipment','Subcontractors','Transportation','G&A','Contingency'];

@Component({
  selector: 'app-budget',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './budget.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BudgetComponent implements OnInit {
  private readonly workflowService  = inject(WorkflowService);
  private readonly mockDataService  = inject(MockDataService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  private readonly notificationService = inject(NotificationService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly categories = CATEGORIES;

  // State
  readonly budgets       = signal<ProjectBudget[]>([]);
  readonly selectedCode  = signal<string>('all');
  readonly fiscalYear    = signal<number>(new Date().getFullYear());
  readonly showModal     = signal<boolean>(false);
  readonly editingBudget = signal<ProjectBudget | null>(null);

  // Form state
  formProjectCode  = '';
  formYear         = new Date().getFullYear();
  formStatus: 'Draft' | 'Active' | 'Approved' = 'Active';
  formLines: Record<BudgetCategory, number> = {
    'Materials': 0, 'Labor': 0, 'Equipment': 0,
    'Subcontractors': 0, 'Transportation': 0, 'G&A': 0, 'Contingency': 0
  };

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.budget' }
    ]);
    this.loadBudgets();
  }

  private loadBudgets() {
    const cached = localStorage.getItem(BUDGET_KEY);
    if (cached) {
      this.budgets.set(JSON.parse(cached));
    } else {
      this.seedDemoBudgets();
    }
  }

  private saveBudgets() {
    localStorage.setItem(BUDGET_KEY, JSON.stringify(this.budgets()));
  }

  private seedDemoBudgets() {
    const projects = this.workflowService.projects();
    const seed: ProjectBudget[] = projects.slice(0, 3).map((p, i) => ({
      id: `bud_${i + 1}`,
      projectCode: p.code,
      projectName: p.name,
      fiscalYear: 2026,
      totalBudget: p.contractValue,
      status: 'Active' as const,
      createdDate: '2026-01-01',
      lines: [
        { category: 'Materials',      budgetAmount: p.contractValue * 0.30, actualAmount: 0, committedAmount: 0 },
        { category: 'Labor',          budgetAmount: p.contractValue * 0.25, actualAmount: 0, committedAmount: 0 },
        { category: 'Equipment',      budgetAmount: p.contractValue * 0.20, actualAmount: 0, committedAmount: 0 },
        { category: 'Subcontractors', budgetAmount: p.contractValue * 0.10, actualAmount: 0, committedAmount: 0 },
        { category: 'Transportation', budgetAmount: p.contractValue * 0.05, actualAmount: 0, committedAmount: 0 },
        { category: 'G&A',            budgetAmount: p.contractValue * 0.05, actualAmount: 0, committedAmount: 0 },
        { category: 'Contingency',    budgetAmount: p.contractValue * 0.05, actualAmount: 0, committedAmount: 0 },
      ]
    }));
    this.budgets.set(seed);
    this.saveBudgets();
  }

  // ─── COMPUTED DATA WITH ACTUALS ────────────────────────────────────────
  readonly enrichedBudgets = computed(() => {
    const budgets = this.budgets().filter(b => b.fiscalYear === this.fiscalYear());
    const matCons  = this.workflowService.materialConsumptions();
    const labRec   = this.workflowService.laborRecords();
    const invoices = this.mockDataService.supplierInvoices();
    const pos      = this.mockDataService.purchaseOrders();

    return budgets.map(budget => {
      const pc = budget.projectCode;

      // Materials actual = material consumptions for this project
      const matActual = matCons
        .filter(m => m.projectCode === pc)
        .reduce((s, m) => s + (m.consumedQuantity * m.unitPrice), 0);

      // Labor actual = labor records for this project
      const labActual = labRec
        .filter(l => l.projectCode === pc)
        .reduce((s, l) => s + l.totalCost, 0);

      // Equipment actual = equipment transfer costs for this project
      const eqActual = this.workflowService.equipmentTransfers()
        .filter((t: any) => t.projectCode === pc)
        .reduce((s: number, t: any) => s + (t.transferCost || 0), 0);

      // G&A actual = supplier invoices for this project
      const gaActual = invoices
        .filter(i => i.poId && pos.find(p => p.id === i.poId)?.costCenter === pc)
        .reduce((s, i) => s + i.subTotal, 0);

      // Commitments = open POs for this project
      const committed = pos
        .filter(p => p.costCenter === pc && ['Approved','Issued'].includes(p.status))
        .reduce((s, p) => s + p.totalAmount, 0);

      const enrichedLines = budget.lines.map(line => {
        let actual = 0;
        let commit = 0;
        switch (line.category) {
          case 'Materials':      actual = matActual; break;
          case 'Labor':          actual = labActual; break;
          case 'Equipment':      actual = eqActual;  break;
          case 'G&A':            actual = gaActual;  break;
          case 'Subcontractors': commit = committed; break;
        }
        const totalUsed = actual + commit;
        const variance  = line.budgetAmount - totalUsed;
        const utilPct   = line.budgetAmount > 0 ? (totalUsed / line.budgetAmount) * 100 : 0;
        return { ...line, actualAmount: actual, committedAmount: commit, variance, utilPct };
      });

      const totalActual    = enrichedLines.reduce((s, l) => s + l.actualAmount, 0);
      const totalCommitted = enrichedLines.reduce((s, l) => s + l.committedAmount, 0);
      const totalUsed      = totalActual + totalCommitted;
      const totalVariance  = budget.totalBudget - totalUsed;
      const totalUtilPct   = budget.totalBudget > 0 ? (totalUsed / budget.totalBudget) * 100 : 0;
      const isOverBudget   = totalVariance < 0;
      const alertLevel     = totalUtilPct >= 100 ? 'danger' : totalUtilPct >= 80 ? 'warning' : 'ok';

      return { ...budget, lines: enrichedLines, totalActual, totalCommitted, totalUsed, totalVariance, totalUtilPct, isOverBudget, alertLevel };
    });
  });

  // Filter by selected project
  readonly filteredBudgets = computed(() => {
    const all = this.enrichedBudgets();
    const code = this.selectedCode();
    return code === 'all' ? all : all.filter(b => b.projectCode === code);
  });

  // Portfolio totals
  readonly portfolioTotals = computed(() => {
    const all = this.enrichedBudgets();
    return {
      totalBudget:    all.reduce((s, b) => s + b.totalBudget,    0),
      totalActual:    all.reduce((s, b) => s + b.totalActual,    0),
      totalCommitted: all.reduce((s, b) => s + b.totalCommitted, 0),
      totalVariance:  all.reduce((s, b) => s + b.totalVariance,  0),
      overBudgetCount: all.filter(b => b.isOverBudget).length,
      warningCount:   all.filter(b => b.alertLevel === 'warning').length
    };
  });

  // Available projects for dropdown
  readonly availableProjects = computed(() =>
    this.workflowService.projects()
  );

  // ─── MODAL ACTIONS ─────────────────────────────────────────────────────
  openCreateModal() {
    this.editingBudget.set(null);
    this.formProjectCode  = '';
    this.formYear         = this.fiscalYear();
    this.formStatus       = 'Active';
    this.categories.forEach(c => this.formLines[c] = 0);
    this.showModal.set(true);
  }

  openEditModal(budget: any) {
    this.editingBudget.set(budget);
    this.formProjectCode  = budget.projectCode;
    this.formYear         = budget.fiscalYear;
    this.formStatus       = budget.status;
    this.categories.forEach(c => {
      const line = budget.lines.find((l: any) => l.category === c);
      this.formLines[c] = line ? line.budgetAmount : 0;
    });
    this.showModal.set(true);
  }

  get formTotalBudget(): number {
    return this.categories.reduce((s, c) => s + (Number(this.formLines[c]) || 0), 0);
  }

  saveBudget() {
    if (!this.formProjectCode) {
      this.notificationService.danger('common.validation_error', 'common.fill_required_fields');
      return;
    }
    const project = this.availableProjects().find(p => p.code === this.formProjectCode);
    const lines: BudgetLine[] = this.categories.map(c => ({
      category: c, budgetAmount: Number(this.formLines[c]) || 0,
      actualAmount: 0, committedAmount: 0
    }));

    const editing = this.editingBudget();
    if (editing) {
      this.budgets.update(list => list.map(b => b.id === editing.id
        ? { ...b, fiscalYear: this.formYear, status: this.formStatus, totalBudget: this.formTotalBudget, lines }
        : b
      ));
      this.notificationService.success('finance.budget.updated_title', 'finance.budget.updated_desc');
    } else {
      const newBudget: ProjectBudget = {
        id: `bud_${Date.now()}`, projectCode: this.formProjectCode,
        projectName: project?.name || this.formProjectCode, fiscalYear: this.formYear,
        totalBudget: this.formTotalBudget, status: this.formStatus,
        createdDate: new Date().toISOString().split('T')[0], lines
      };
      this.budgets.update(list => [newBudget, ...list]);
      this.notificationService.success('finance.budget.created_title', 'finance.budget.created_desc');
    }
    this.saveBudgets();
    this.showModal.set(false);
  }

  deleteBudget(id: string) {
    this.budgets.update(list => list.filter(b => b.id !== id));
    this.saveBudgets();
    this.notificationService.success('finance.budget.deleted_title', 'finance.budget.deleted_desc');
  }

  getAlertClass(level: string): string {
    return level === 'danger' ? 'bg-red-50 border-red-200 text-red-700'
      : level === 'warning'   ? 'bg-amber-50 border-amber-200 text-amber-700'
      : 'bg-green-50 border-green-200 text-green-700';
  }

  getBarClass(pct: number): string {
    return pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
  }
}
