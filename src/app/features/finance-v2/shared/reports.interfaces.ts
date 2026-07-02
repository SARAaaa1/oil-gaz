// ═══════════════════════════════════════════════════════
//  Finance V2 — Financial Reporting & Statements Interfaces
// ═══════════════════════════════════════════════════════

export type ReportType =
  | 'Trial Balance'
  | 'Income Statement'
  | 'Balance Sheet'
  | 'Cash Flow'
  | 'Budget vs Actual'
  | 'AP Aging'
  | 'AR Aging'
  | 'Asset Register'
  | 'VAT Summary'
  | 'Cost Center'
  | 'Project Financial';

export interface ReportFilter {
  company:          string;
  branch:           string;
  project:          string;
  costCenter:       string;
  fiscalYear:       string;
  accountingPeriod: string;
  currency:         string;
}

export interface ReportMetadata {
  companyName:    string;
  reportName:     string;
  fiscalYear:     string;
  period:         string;
  generatedBy:    string;
  generatedDate:  string;
  filtersApplied: string;
}

export interface TrialBalanceRow {
  accountCode:   string;
  accountName:   string;
  openingDebit:  number;
  openingCredit: number;
  periodDebit:   number;
  periodCredit:  number;
  closingDebit:  number;
  closingCredit: number;
}

export interface IncomeStatementRow {
  category:   string;
  amount:     number;
  isSubtotal: boolean;
}

export interface BalanceSheetRow {
  section:    'Assets' | 'Liabilities' | 'Equity';
  category:   string;
  amount:     number;
  isSubtotal: boolean;
}

export interface CashFlowRow {
  section:    'Operating' | 'Investing' | 'Financing' | 'Summary';
  activity:   string;
  amount:     number;
  isSubtotal: boolean;
}

export interface BudgetVsActualRow {
  item:        string;
  budget:      number;
  actual:      number;
  committed:   number;
  remaining:   number;
  variance:    number;
  variancePct: number;
}

export interface AgingRow {
  partyName:   string;
  current:     number;
  age30:       number;
  age60:       number;
  age90:       number;
  age120Plus:  number;
  total:       number;
}

export interface AssetRegisterRow {
  assetName: string;
  cost:      number;
  accDep:    number;
  nbv:       number;
  status:    string;
}

export interface VatSummaryRow {
  period:    string;
  inputVat:  number;
  outputVat: number;
  netVat:    number;
  status:    string;
}

export interface CostCenterRow {
  costCenterName: string;
  budget:         number;
  actual:         number;
  variance:       number;
}

export interface ProjectFinancialRow {
  projectName: string;
  revenue:     number;
  cost:        number;
  profit:      number;
  marginPct:   number;
  budget:      number;
  forecast:    number;
}

export interface ReportDashboardKpi {
  totalAssets:       number;
  totalLiabilities:  number;
  totalEquity:       number;
  revenue:           number;
  expenses:          number;
  netProfit:         number;
  cashBalance:       number;
  bankBalance:       number;
  arBalance:         number;
  apBalance:         number;
  budgetUtilization: number;
  workingCapital:    number;
}
