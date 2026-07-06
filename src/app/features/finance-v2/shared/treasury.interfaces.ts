// ═══════════════════════════════════════════════════════
//  Finance V2 — Treasury Management Interfaces
// ═══════════════════════════════════════════════════════

export type CashBoxStatus        = 'Open' | 'Closed';
export type BankAccountStatus    = 'Active' | 'Inactive';
export type TransferStatus       = 'Draft' | 'Approved' | 'Executed' | 'Cancelled';
export type AccountType          = 'Cash' | 'Bank';
export type ReconciliationStatus = 'Draft' | 'Approved';
export type MovementType         = 'Deposit' | 'Withdrawal' | 'Receipt' | 'Payment' | 'Transfer In' | 'Transfer Out';

// ── Cash Box ──────────────────────────────────────────
export interface CashBox {
  id:                  string;
  code:                string;
  name:                string;
  currency:            string;
  currentBalance:      number;
  responsibleEmployee: string;
  status:              CashBoxStatus;
  openingBalance:      number;
  todayReceipts:       number;
  todayPayments:       number;
  closingBalance:      number;

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── Bank Account ──────────────────────────────────────
export interface BankAccount {
  id:             string;
  bankName:       string;
  branch:         string;
  iban:           string;
  accountNumber:  string;
  swiftCode:      string;
  currency:       string;
  openingBalance: number;
  currentBalance: number;
  availableBalance: number;
  status:         BankAccountStatus;

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── Treasury Transfer ──────────────────────────────────
export interface TreasuryTransfer {
  id:              string;
  transferNumber:  string;
  date:            string;
  fromAccountType: AccountType;
  fromAccountId:   string;
  fromAccountName: string;
  toAccountType:   AccountType;
  toAccountId:     string;
  toAccountName:   string;
  amount:          number;
  currency:        string;
  exchangeRate:    number;
  reference:       string;
  reason:          string;
  remarks:         string;
  status:          TransferStatus;
  attachments:     string[];

  branchId?: string;
  branchCode?: string;
  branchName?: string;
  isCrossBranch?: boolean;
}

// ── Treasury Movement ──────────────────────────────────
export interface TreasuryMovement {
  id:          string;
  accountType: AccountType;
  accountId:   string;
  accountName: string;
  type:        MovementType;
  date:        string;
  amount:      number;
  currency:    string;
  reference:   string;
  description: string;
  matched:     boolean;

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── Reconciliation Transactions ─────────────────────────
export interface StatementTransaction {
  id:          string;
  date:        string;
  description: string;
  reference:   string;
  amount:      number;
  type:        'Debit' | 'Credit'; // Debit = Outgoing, Credit = Incoming (from bank perspective)
  matched:     boolean;
}

export interface SystemTransaction {
  id:          string;
  date:        string;
  description: string;
  reference:   string;
  amount:      number;
  type:        'Debit' | 'Credit'; // Debit = Outgoing, Credit = Incoming
  matched:     boolean;
}

// ── Reconciliation Session ─────────────────────────────
export interface ReconciliationSession {
  id:                   string;
  bankAccountId:        string;
  bankAccountName:      string;
  statementDate:        string;
  statementBalance:     number;
  bookBalance:          number;
  difference:           number;
  status:               ReconciliationStatus;
  matchedCount:         number;
  unmatchedCount:       number;
  statementTransactions: StatementTransaction[];
  systemTransactions:   SystemTransaction[];

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── Dashboard KPIs ─────────────────────────────────────
export interface TreasuryDashboardKpi {
  totalCash:             number;
  totalBankBalance:      number;
  incomingToday:         number;
  outgoingToday:         number;
  pendingTransfers:      number;
  pendingReconciliation: number;
  cashFlowToday:         number;
}
