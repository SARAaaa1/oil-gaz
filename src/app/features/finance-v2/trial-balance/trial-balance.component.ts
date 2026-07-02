import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { TrialBalanceLine, TrialBalanceTotals, AccountType } from '../shared/finance-v2.interfaces';

@Component({
  selector: 'app-finv2-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './trial-balance.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2TrialBalanceComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly reportDate       = signal<string>('2025-06-30');
  readonly levelFilter      = signal<number>(0);          // 0 = All
  readonly includeZero      = signal<boolean>(false);
  readonly includeInactive  = signal<boolean>(false);

  // ── Filtered lines ────────────────────────────────────────────────
  readonly filteredLines = computed<TrialBalanceLine[]>(() => {
    const level       = this.levelFilter();
    const incZero     = this.includeZero();
    return this.mockService.trialBalanceLines().filter(line => {
      const matchLevel  = level === 0 || line.level === level;
      const hasBalance  = incZero || (line.closingDebit + line.closingCredit) > 0;
      return matchLevel && hasBalance;
    });
  });

  // ── Grand totals ──────────────────────────────────────────────────
  readonly totals = computed<TrialBalanceTotals>(() => {
    const lines = this.filteredLines();
    const openingDebit  = lines.reduce((s, l) => s + l.openingDebit, 0);
    const openingCredit = lines.reduce((s, l) => s + l.openingCredit, 0);
    const periodDebit   = lines.reduce((s, l) => s + l.periodDebit, 0);
    const periodCredit  = lines.reduce((s, l) => s + l.periodCredit, 0);
    const closingDebit  = lines.reduce((s, l) => s + l.closingDebit, 0);
    const closingCredit = lines.reduce((s, l) => s + l.closingCredit, 0);
    const difference    = Math.abs(closingDebit - closingCredit);
    return {
      openingDebit, openingCredit, periodDebit, periodCredit,
      closingDebit, closingCredit,
      isBalanced: difference < 1,
      difference
    };
  });

  // ── Chart: breakdown by type ───────────────────────────────────────
  readonly typeBreakdown = computed(() => {
    const all = this.mockService.trialBalanceLines().filter(l => l.level === 1);
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
  }
}
