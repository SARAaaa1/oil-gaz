import {
  Component, OnInit, inject, signal, computed, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FinanceCoreService } from '../../../core/services/finance-core.service';
import { FinanceApiService } from '../../../core/services/finance-api.service';
import { BreadcrumbService } from '../../../core/services/breadcrumb.service';
import { LanguageService } from '../../../core/services/language.service';
import { ChartOfAccount, JournalEntry } from '../../../shared/interfaces/finance.interface';

type StatementTab = 'trial_balance' | 'income_statement' | 'balance_sheet';

interface TrialBalanceLine {
  code: string;
  name: string;
  type: string;
  debit: number;
  credit: number;
  isParent: boolean;
  level: number;
}

interface IncomeRow {
  label: string;
  labelAr: string;
  amount: number;
  isSubtotal?: boolean;
  isTotal?: boolean;
  isNegative?: boolean;
  indent?: boolean;
}

interface BalanceSheetSection {
  label: string;
  labelAr: string;
  amount: number;
  isHeader?: boolean;
  isSubtotal?: boolean;
  isTotal?: boolean;
  indent?: boolean;
}

@Component({
  selector: 'app-financial-statements',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './financial-statements.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FinancialStatementsComponent implements OnInit {
  private readonly financeService = inject(FinanceCoreService);
  private readonly financeApi = inject(FinanceApiService);
  private readonly breadcrumbService = inject(BreadcrumbService);
  readonly langService = inject(LanguageService);
  private readonly translate = inject(TranslateService);

  readonly activeTab = signal<StatementTab>('trial_balance');
  readonly asOfDate = signal<string>(new Date().toISOString().split('T')[0]);
  readonly periodStart = signal<string>('2026-01-01');

  // API-fetched signals — preferred when populated
  readonly apiTrialBalance       = signal<any[]>([]);
  readonly apiTrialBalanceTotals = signal<any>(null);
  readonly apiIncomeStatement    = signal<any[]>([]);
  readonly apiBalanceSheet       = signal<any>(null);
  readonly isLoadingStatements   = signal(false);

  ngOnInit() {
    this.breadcrumbService.setBreadcrumbs([
      { label: 'navigation.finance', url: '/finance' },
      { label: 'navigation.financial_statements' }
    ]);
    this.loadStatements();
  }

  loadStatements() {
    this.isLoadingStatements.set(true);
    const today     = this.asOfDate();
    const yearStart = this.periodStart();

    this.financeApi.getTrialBalance(today).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.apiTrialBalance.set(res.data);
          this.apiTrialBalanceTotals.set(res.totals ?? null);
        }
        this.isLoadingStatements.set(false);
      },
      error: () => this.isLoadingStatements.set(false)
    });

    this.financeApi.getIncomeStatement(yearStart, today).subscribe({
      next: (res: any) => {
        const data = Array.isArray(res) ? res : (res.data ?? []);
        if (data.length > 0) this.apiIncomeStatement.set(data);
      },
      error: () => {}
    });

    this.financeApi.getBalanceSheet(today).subscribe({
      next: (res: any) => {
        const sheet = res.data ?? res;
        if (sheet && sheet.assets != null) this.apiBalanceSheet.set(sheet);
      },
      error: () => {}
    });
  }

  // ─── TRIAL BALANCE ────────────────────────────────────────────────────
  readonly trialBalanceLines = computed<TrialBalanceLine[]>(() => {
    const accounts = this.financeService.accountsWithBalances();
    const cutoff = this.asOfDate();

    // Compute debit/credit totals from posted journal entries up to cutoff date
    const postedEntries = this.financeService.journalEntries()
      .filter(e => e.status === 'Posted' && e.date <= cutoff);

    const debitMap = new Map<string, number>();
    const creditMap = new Map<string, number>();

    for (const entry of postedEntries) {
      for (const line of entry.lines) {
        debitMap.set(line.accountCode, (debitMap.get(line.accountCode) || 0) + (line.debit || 0));
        creditMap.set(line.accountCode, (creditMap.get(line.accountCode) || 0) + (line.credit || 0));
      }
    }

    // Build hierarchical list
    const rootAccounts = accounts.filter(a => !a.parentCode);
    const result: TrialBalanceLine[] = [];

    const walk = (nodes: typeof accounts, level: number) => {
      for (const acc of nodes) {
        const children = accounts.filter(a => a.parentCode === acc.code);
        const isParent = children.length > 0;

        // Aggregate debits/credits including children
        const sumDebit = (code: string): number => {
          const direct = debitMap.get(code) || 0;
          const kids = accounts.filter(a => a.parentCode === code);
          return direct + kids.reduce((s, k) => s + sumDebit(k.code), 0);
        };
        const sumCredit = (code: string): number => {
          const direct = creditMap.get(code) || 0;
          const kids = accounts.filter(a => a.parentCode === code);
          return direct + kids.reduce((s, k) => s + sumCredit(k.code), 0);
        };

        const totalDebit = sumDebit(acc.code);
        const totalCredit = sumCredit(acc.code);

        if (totalDebit !== 0 || totalCredit !== 0 || isParent) {
          result.push({
            code: acc.code,
            name: acc.name,
            type: acc.type,
            debit: totalDebit,
            credit: totalCredit,
            isParent,
            level
          });
        }
        if (isParent) walk(children, level + 1);
      }
    };

    walk(rootAccounts, 0);
    return result;
  });

  readonly trialBalanceTotals = computed(() => {
    const lines = this.trialBalanceLines().filter(l => l.level === 0);
    return {
      totalDebit: lines.reduce((s, l) => s + l.debit, 0),
      totalCredit: lines.reduce((s, l) => s + l.credit, 0)
    };
  });

  readonly isBalanced = computed(() => {
    const t = this.trialBalanceTotals();
    return Math.abs(t.totalDebit - t.totalCredit) < 0.01;
  });

  // ─── INCOME STATEMENT (P&L) ──────────────────────────────────────────
  readonly incomeStatement = computed<IncomeRow[]>(() => {
    const accounts = this.financeService.accountsWithBalances();
    const start = this.periodStart();
    const end = this.asOfDate();

    const postedEntries = this.financeService.journalEntries()
      .filter(e => e.status === 'Posted' && e.date >= start && e.date <= end);

    // Build net movement per account within period
    const netMap = new Map<string, number>();
    for (const entry of postedEntries) {
      for (const line of entry.lines) {
        netMap.set(line.accountCode, (netMap.get(line.accountCode) || 0) + (line.debit - line.credit));
      }
    }

    const getBalance = (code: string): number => {
      const acc = accounts.find(a => a.code === code);
      if (!acc) return 0;
      const direct = netMap.get(code) || 0;
      const children = accounts.filter(a => a.parentCode === code);
      const childSum = children.reduce((s, c) => s + getBalance(c.code), 0);
      const raw = direct + childSum;
      return (acc.type === 'Revenue') ? -raw : raw;
    };

    const revenueAccounts = accounts.filter(a => a.type === 'Revenue' && !a.parentCode === false && accounts.find(p => p.code === a.parentCode)?.type === 'Revenue');
    const directRevenueAccounts = accounts.filter((a: ChartOfAccount) => a.type === 'Revenue' && !a.parentCode);
    const allRevenue = accounts.filter((a: ChartOfAccount) => a.type === 'Revenue');

    // Revenue section
    const revenueLeaves = allRevenue.filter((a: ChartOfAccount) => !allRevenue.some((b: ChartOfAccount) => b.parentCode === a.code));
    const totalRevenue = revenueLeaves.reduce((s: number, a: ChartOfAccount) => s + getBalance(a.code), 0);

    // Expense section
    const allExpense = accounts.filter((a: ChartOfAccount) => a.type === 'Expense');
    const expenseLeaves = allExpense.filter((a: ChartOfAccount) => !allExpense.some((b: ChartOfAccount) => b.parentCode === a.code));
    const totalExpense = expenseLeaves.reduce((s: number, a: ChartOfAccount) => s + getBalance(a.code), 0);

    const grossProfit = totalRevenue - totalExpense;

    const rows: IncomeRow[] = [];

    // Revenue
    rows.push({ label: 'finance.statements.revenue', labelAr: 'الإيرادات', amount: 0, isHeader: true } as any);
    for (const acc of revenueLeaves) {
      const bal = getBalance(acc.code);
      if (bal !== 0) {
        rows.push({ label: acc.name, labelAr: acc.name, amount: bal, indent: true });
      }
    }
    rows.push({ label: 'finance.statements.total_revenue', labelAr: 'إجمالي الإيرادات', amount: totalRevenue, isSubtotal: true });

    // Expenses
    rows.push({ label: 'finance.statements.expenses', labelAr: 'المصروفات', amount: 0, isHeader: true } as any);
    for (const acc of expenseLeaves) {
      const bal = getBalance(acc.code);
      if (bal !== 0) {
        rows.push({ label: acc.name, labelAr: acc.name, amount: bal, indent: true, isNegative: true });
      }
    }
    rows.push({ label: 'finance.statements.total_expenses', labelAr: 'إجمالي المصروفات', amount: totalExpense, isSubtotal: true, isNegative: true });

    // Net Profit
    rows.push({
      label: grossProfit >= 0 ? 'finance.statements.net_profit' : 'finance.statements.net_loss',
      labelAr: grossProfit >= 0 ? 'صافي الربح' : 'صافي الخسارة',
      amount: grossProfit,
      isTotal: true
    });

    return rows;
  });

  readonly netProfit = computed(() => {
    const rows = this.incomeStatement();
    return rows.find(r => r.isTotal)?.amount ?? 0;
  });

  // ─── BALANCE SHEET ───────────────────────────────────────────────────
  readonly balanceSheet = computed(() => {
    const accounts: ChartOfAccount[] = this.financeService.accountsWithBalances();
    const cutoff = this.asOfDate();

    const postedEntries: JournalEntry[] = this.financeService.journalEntries()
      .filter((e: JournalEntry) => e.status === 'Posted' && e.date <= cutoff);

    const netMap = new Map<string, number>();
    for (const entry of postedEntries) {
      for (const line of entry.lines) {
        netMap.set(line.accountCode, (netMap.get(line.accountCode) || 0) + (line.debit - line.credit));
      }
    }

    const getBalance = (code: string): number => {
      const acc = accounts.find((a: ChartOfAccount) => a.code === code);
      if (!acc) return 0;
      const direct = netMap.get(code) || 0;
      const children = accounts.filter((a: ChartOfAccount) => a.parentCode === code);
      const childSum = children.reduce((s: number, c: ChartOfAccount) => s + getBalance(c.code), 0);
      const raw = direct + childSum;
      if (acc.type === 'Liability' || acc.type === 'Equity' || acc.type === 'Revenue') {
        return -raw;
      }
      return raw;
    };

    // Assets
    const assetRoots = accounts.filter((a: ChartOfAccount) => a.type === 'Asset' && !a.parentCode);
    const assetSections: BalanceSheetSection[] = [];
    let totalAssets = 0;

    for (const root of assetRoots) {
      const children = accounts.filter((a: ChartOfAccount) => a.parentCode === root.code && a.type === 'Asset');
      const rootBal = getBalance(root.code);
      if (rootBal !== 0 || children.length > 0) {
        assetSections.push({ label: root.name, labelAr: root.name, amount: rootBal, isHeader: true });
        for (const child of children) {
          const bal = getBalance(child.code);
          if (bal !== 0) {
            assetSections.push({ label: child.name, labelAr: child.name, amount: bal, indent: true });
          }
        }
        assetSections.push({ label: `Total ${root.name}`, labelAr: `إجمالي ${root.name}`, amount: rootBal, isSubtotal: true });
        totalAssets += rootBal;
      }
    }
    assetSections.push({ label: 'finance.statements.total_assets', labelAr: 'إجمالي الأصول', amount: totalAssets, isTotal: true });

    // Liabilities
    const liabRoots = accounts.filter((a: ChartOfAccount) => a.type === 'Liability' && !a.parentCode);
    const liabSections: BalanceSheetSection[] = [];
    let totalLiab = 0;

    for (const root of liabRoots) {
      const children = accounts.filter((a: ChartOfAccount) => a.parentCode === root.code && a.type === 'Liability');
      const rootBal = getBalance(root.code);
      if (rootBal !== 0 || children.length > 0) {
        liabSections.push({ label: root.name, labelAr: root.name, amount: rootBal, isHeader: true });
        for (const child of children) {
          const bal = getBalance(child.code);
          if (bal !== 0) {
            liabSections.push({ label: child.name, labelAr: child.name, amount: bal, indent: true });
          }
        }
        liabSections.push({ label: `Total ${root.name}`, labelAr: `إجمالي ${root.name}`, amount: rootBal, isSubtotal: true });
        totalLiab += rootBal;
      }
    }

    // Equity
    const equityAccounts = accounts.filter((a: ChartOfAccount) => a.type === 'Equity');
    const equitySections: BalanceSheetSection[] = [];
    let totalEquity = 0;

    for (const acc of equityAccounts.filter((a: ChartOfAccount) => !a.parentCode)) {
      const bal = getBalance(acc.code);
      equitySections.push({ label: acc.name, labelAr: acc.name, amount: bal, indent: true });
      totalEquity += bal;
    }

    // Add net profit to retained earnings
    const np = this.netProfit();
    if (np !== 0) {
      equitySections.push({ label: 'finance.statements.current_period_profit', labelAr: 'أرباح الفترة الحالية', amount: np, indent: true });
      totalEquity += np;
    }

    const totalLiabEquity = totalLiab + totalEquity;

    liabSections.push({ label: 'finance.statements.total_liabilities', labelAr: 'إجمالي الخصوم', amount: totalLiab, isSubtotal: true });
    equitySections.push({ label: 'finance.statements.total_equity', labelAr: 'إجمالي حقوق الملكية', amount: totalEquity, isSubtotal: true });
    liabSections.push({ label: 'finance.statements.total_liab_equity', labelAr: 'إجمالي الخصوم وحقوق الملكية', amount: totalLiabEquity, isTotal: true });

    return { assetSections, liabSections, equitySections, totalAssets, totalLiabEquity };
  });

  readonly bsIsBalanced = computed(() => {
    const bs = this.balanceSheet();
    return Math.abs(bs.totalAssets - bs.totalLiabEquity) < 1;
  });

  // ─── ACTIONS ─────────────────────────────────────────────────────────
  printStatement() {
    window.print();
  }

  setTab(tab: StatementTab) {
    this.activeTab.set(tab);
  }

  getTabLabel(tab: StatementTab): string {
    const keys: Record<StatementTab, string> = {
      trial_balance: 'finance.statements.tab_trial_balance',
      income_statement: 'finance.statements.tab_income',
      balance_sheet: 'finance.statements.tab_balance_sheet'
    };
    return keys[tab];
  }

  isHeader(row: any): boolean {
    return !!row.isHeader;
  }
}
