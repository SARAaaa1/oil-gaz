import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { FinanceV2MockService } from '../shared/finance-v2-mock.service';
import { LedgerAccount, LedgerTransaction, BalanceType } from '../shared/finance-v2.interfaces';

@Component({
  selector: 'app-finv2-general-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './general-ledger.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinV2GeneralLedgerComponent implements OnInit {
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  readonly mockService = inject(FinanceV2MockService);

  // ── Filters ───────────────────────────────────────────────────────
  readonly selectedAccountCode = signal<string>('1121');
  readonly dateFrom            = signal<string>('');
  readonly dateTo              = signal<string>('');
  readonly costCenterFilter    = signal<string>('');
  readonly postedOnly          = signal<boolean>(true);

  // ── Selected ledger account ────────────────────────────────────────
  readonly selectedAccount = computed<LedgerAccount | null>(() => {
    const code = this.selectedAccountCode();
    return this.mockService.ledgerAccounts().find(a => a.accountCode === code) ?? null;
  });

  // ── Filtered + running-balance recalculated transactions ───────────
  readonly filteredTransactions = computed<LedgerTransaction[]>(() => {
    const account = this.selectedAccount();
    if (!account) return [];
    let txns = account.transactions.filter(t => {
      const matchDate = (!this.dateFrom() || t.date >= this.dateFrom()) &&
                        (!this.dateTo()   || t.date <= this.dateTo());
      const matchCC   = !this.costCenterFilter() ||
                        t.costCenterCode.includes(this.costCenterFilter());
      return matchDate && matchCC;
    });
    // Recalculate running balance from opening balance
    let balance = account.openingBalance;
    const isDebitNormal = account.openingBalanceType === 'Dr';
    return txns.map(t => {
      if (isDebitNormal) {
        balance = balance + t.debit - t.credit;
      } else {
        balance = balance - t.debit + t.credit;
      }
      const balanceType: BalanceType = balance > 0
        ? (isDebitNormal ? 'Dr' : 'Cr')
        : balance < 0 ? (isDebitNormal ? 'Cr' : 'Dr') : 'Zero';
      return { ...t, runningBalance: Math.abs(balance), balanceType };
    });
  });

  // ── Summary cards ──────────────────────────────────────────────────
  readonly summary = computed(() => {
    const account = this.selectedAccount();
    const txns    = this.filteredTransactions();
    if (!account) return { opening: 0, openingType: 'Dr' as BalanceType, debit: 0, credit: 0, closing: 0, closingType: 'Dr' as BalanceType };
    const debit  = txns.reduce((s, t) => s + t.debit, 0);
    const credit = txns.reduce((s, t) => s + t.credit, 0);
    const isDebitNormal = account.openingBalanceType === 'Dr';
    let closing = isDebitNormal
      ? account.openingBalance + debit - credit
      : account.openingBalance - debit + credit;
    const closingType: BalanceType = closing > 0
      ? (isDebitNormal ? 'Dr' : 'Cr')
      : closing < 0 ? (isDebitNormal ? 'Cr' : 'Dr') : 'Zero';
    return {
      opening: account.openingBalance, openingType: account.openingBalanceType,
      debit, credit,
      closing: Math.abs(closing), closingType
    };
  });

  // ── Source module badge ────────────────────────────────────────────
  getModuleClass(mod: string): string {
    switch (mod) {
      case 'Journal':   return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'AP':        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'AR':        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'Payroll':   return 'bg-violet-50 text-violet-700 border-violet-200';
      case 'Asset':     return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Inventory': return 'bg-teal-50 text-teal-700 border-teal-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  }

  getBalanceClass(type: BalanceType): string {
    switch (type) {
      case 'Dr': return 'text-blue-700';
      case 'Cr': return 'text-rose-600';
      default:   return 'text-slate-500';
    }
  }

  formatAmount(v: number): string {
    if (!v && v !== 0) return '—';
    return v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  readonly availableAccounts = computed(() => this.mockService.ledgerAccounts());

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance' },
      { label: 'finance_v2.gl.title' }
    ]);
  }
}
