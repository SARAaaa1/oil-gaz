// Finance V2 — Shared Interfaces
// Path: src/app/features/finance-v2/shared/finance-v2.interfaces.ts

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
export type AccountLevel = 1 | 2 | 3 | 4 | 5;
export type CostCenterStatus = 'Active' | 'Inactive' | 'Suspended';
export type AccountStatus = 'Active' | 'Inactive';

// ─── Chart of Accounts ───────────────────────────────────────────
export interface CoaAccount {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: AccountType;
  parentCode: string | null;
  level: AccountLevel;
  currency: string;
  status: AccountStatus;
  allowManualEntries: boolean;
  requiresCostCenter: boolean;
  isReconciliation: boolean;
  isConfidential: boolean;
  balance: number;
  children?: CoaAccount[];
  isExpanded?: boolean;
}

// ─── Cost Centers ─────────────────────────────────────────────────
export interface CostCenter {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  type: 'Project' | 'Department' | 'Overhead' | 'Administrative';
  parentCode: string | null;
  level: number;
  manager: string;
  status: CostCenterStatus;
  budget: number;
  spent: number;
  childrenCount: number;
  children?: CostCenter[];
  isExpanded?: boolean;
}

// ─── Dashboard / KPIs ─────────────────────────────────────────────
export interface FinanceDashboardKpi {
  totalAssets: number;
  totalLiabilities: number;
  equity: number;
  cash: number;
  bankBalance: number;
  accountsReceivable: number;
  accountsPayable: number;
  monthRevenue: number;
  monthExpenses: number;
  netProfit: number;
}

export interface RecentJournalEntry {
  id: string;
  number: string;
  date: string;
  description: string;
  amount: number;
  status: 'Draft' | 'Posted';
}

export interface RecentVendorInvoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  date: string;
  amount: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

export interface RecentCollection {
  id: string;
  receiptNumber: string;
  customer: string;
  date: string;
  amount: number;
}

// ─── Chart data points ─────────────────────────────────────────────
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface MonthlyChartData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
  cashInflow: number;
  cashOutflow: number;
}

export interface AgingBucket {
  label: string;
  amount: number;
  count: number;
  color: string;
}

// ─── Journal Entries (Phase 3) ────────────────────────────────────
export type JournalStatus = 'Draft' | 'Posted' | 'Reversed';

export interface JournalLine {
  id: string;
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  costCenterCode: string;
  projectCode: string;
  description: string;
  debit: number;
  credit: number;
  notes: string;
}

export interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  reference: string;
  description: string;
  currency: string;
  projectCode: string;
  costCenterCode: string;
  remarks: string;
  status: JournalStatus;
  createdBy: string;
  approvedBy: string;
  createdDate: string;
  postedDate: string;
  reversedDate: string;
  reversedJournalNumber: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
}

// ─── General Ledger (Phase 3) ─────────────────────────────────────
export type BalanceType = 'Dr' | 'Cr' | 'Zero';
export type SourceModule = 'Journal' | 'AP' | 'AR' | 'Payroll' | 'Asset' | 'Inventory';

export interface LedgerTransaction {
  id: string;
  date: string;
  journalNumber: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  balanceType: BalanceType;
  sourceModule: SourceModule;
  sourceDocument: string;
  costCenterCode: string;
  projectCode: string;
  createdBy: string;
}

export interface LedgerAccount {
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  openingBalance: number;
  openingBalanceType: BalanceType;
  transactions: LedgerTransaction[];
}

// ─── Trial Balance (Phase 3) ──────────────────────────────────────
export interface TrialBalanceLine {
  id: string;
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  accountType: AccountType;
  level: number;
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
}

export interface TrialBalanceTotals {
  openingDebit: number;
  openingCredit: number;
  periodDebit: number;
  periodCredit: number;
  closingDebit: number;
  closingCredit: number;
  isBalanced: boolean;
  difference: number;
}

