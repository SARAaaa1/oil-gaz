import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { TrialBalanceLine, TrialBalanceTotals, AccountType } from '../shared/finance-v2.interfaces';
import { BranchService } from '../shared/branch.service';

@Component({
  selector: 'app-finv2-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './trial-balance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2TrialBalanceComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService   = inject(LanguageService);
  readonly financeApi    = inject(FinanceApiService);
  readonly branchService = inject(BranchService);

  readonly rawLines = signal<any[]>([]);
  readonly rawTotals = signal<any>(null);
  readonly isLoading = signal(false);

  // ── Filters ──────────────────────────────────────────────────
  readonly reportDate       = signal<string>('2025-06-30');
  readonly levelFilter      = signal<number>(0);          // 0 = All
  readonly includeZero      = signal<boolean>(false);
  readonly includeInactive  = signal<boolean>(false);
  readonly branchFilter     = signal<string>('All');

  // ── Filtered lines ────────────────────────────────────────────────
  readonly filteredLines = computed<TrialBalanceLine[]>(() => {
    const level   = this.levelFilter();
    const incZero = this.includeZero();
    const branch  = this.branchFilter();
    return this.rawLines().filter(line => {
      const matchLevel  = level === 0 || line.level === level;
      const hasBalance  = incZero || (line.closingDebit + line.closingCredit) > 0;
      const matchBranch = branch === 'All' || (line.branchId || 'HeadOffice') === branch;
      return matchLevel && hasBalance && matchBranch;
    });
  });

  // ── Grand totals ──────────────────────────────────────────────────
  readonly totals = computed<TrialBalanceTotals>(() => {
    return this.rawTotals() ?? {
      openingDebit: 0, openingCredit: 0, periodDebit: 0, periodCredit: 0,
      closingDebit: 0, closingCredit: 0,
      isBalanced: true, difference: 0
    };
  });

  // ── Chart: breakdown by type ───────────────────────────────────────
  readonly typeBreakdown = computed(() => {
    const all = this.rawLines().filter(l => l.level === 1);
    return [
      { type: 'Asset'    as AccountType, key: 'finance_v2.coa.type_asset',     value: all.find(l => l.accountCode === '1000')?.closingDebit ?? 0,  color: '#6366f1' },
      { type: 'Liability'as AccountType, key: 'finance_v2.coa.type_liability', value: all.find(l => l.accountCode === '2000')?.closingCredit ?? 0, color: '#f43f5e' },
      { type: 'Equity'   as AccountType, key: 'finance_v2.coa.type_equity',    value: all.find(l => l.accountCode === '3000')?.closingCredit ?? 0, color: '#8b5cf6' },
      { type: 'Revenue'  as AccountType, key: 'finance_v2.coa.type_revenue',   value: all.find(l => l.accountCode === '4000')?.closingCredit ?? 0, color: '#10b981' },
      { type: 'Expense'  as AccountType, key: 'finance_v2.coa.type_expense',   value: all.find(l => l.accountCode === '5000')?.closingDebit ?? 0,  color: '#f59e0b' },
    ];
  });

  readonly chartMax = computed(() => Math.max(...this.typeBreakdown().map(t => t.value)) * 1.1 || 1);

  // ── Type badge ────────────────────────────────────────────────────
  getTypeClass(type: AccountType): string {
    switch (type) {
      case 'Asset':     return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Liability': return 'bg-red-50 text-red-700 border-red-200';
      case 'Equity':    return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Revenue':   return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Expense':   return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  }

  getLevelIndent(level: number): number { return (level - 1) * 16; }

  formatAmount(v: number): string {
    if (!v) return '—';
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  readonly levelOptions = [0, 1, 2, 3];

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.tb.title' }
    ]);
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.financeApi.getTrialBalance(this.reportDate()).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data ?? []);
        if (raw && raw.length > 0) {
          const mapped = raw.map((l: any) => ({
            id: l.id ?? l._id ?? l.accountCode,
            accountCode: l.accountCode ?? '',
            accountNameEn: l.accountNameEn ?? l.accountName ?? l.name ?? '',
            accountNameAr: l.accountNameAr ?? l.accountName ?? '',
            type: l.type ?? l.accountType ?? 'Asset',
            level: l.level ?? 1,
            openingDebit: l.openingDebit ?? 0,
            openingCredit: l.openingCredit ?? 0,
            periodDebit: l.periodDebit ?? 0,
            periodCredit: l.periodCredit ?? 0,
            closingDebit: l.closingDebit ?? 0,
            closingCredit: l.closingCredit ?? 0,
            branchId: l.branchId ?? 'HeadOffice'
          }));
          this.rawLines.set(mapped);
        }
        if (res?.totals) {
          this.rawTotals.set(res.totals);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}
