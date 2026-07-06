// ═══════════════════════════════════════════════════════
//  Finance V2 — VAT Tax Management Interfaces
// ═══════════════════════════════════════════════════════

export type VatType = 'Input' | 'Output';

export type VatReturnStatus = 
  | 'Draft' 
  | 'Calculated' 
  | 'Reviewed' 
  | 'Approved' 
  | 'Submitted' 
  | 'Settled' 
  | 'Closed';

// ── VAT Transaction Record ───────────────────────────
export interface VatTransaction {
  id:              string;
  transactionDate: string;
  documentNumber:  string;
  module:          'AP' | 'AR' | 'GL' | 'Cash' | 'Bank';
  partyName:       string; // Supplier / Customer name
  projectCode:     string;
  projectName:     string;
  taxableAmount:   number;
  vatPct:          number;
  vatAmount:       number; // Calculated: Taxable × VAT %
  type:            VatType; // Input (purchases) / Output (sales)
  status:          'Pending' | 'Settled';
  notes:           string;

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── VAT Return Sheet ─────────────────────────────────
export interface VatReturn {
  id:              string;
  vatReturnNumber: string;
  taxPeriod:       string; // e.g., 'Q1 2025', 'Q2 2025'
  company:         string;
  branch:          string;
  currency:        string;
  status:          VatReturnStatus;
  preparedBy:      string;
  reviewedBy:      string;
  approvedBy:      string;
  submissionDate:  string;
  settlementDate:  string;
  totalSales:      number;
  totalPurchases:  number;
  vatOutput:       number;
  vatInput:        number;
  netVat:          number; // Output - Input (positive = Payable, negative = Refund)
  transactions:    VatTransaction[];

  branchId?: string;
  branchCode?: string;
  branchName?: string;
}

// ── Dashboard Metrics ────────────────────────────────
export interface VatDashboardKpi {
  totalSales:      number;
  totalPurchases:  number;
  vatOutput:       number;
  vatInput:        number;
  netVat:          number;
  isPayable:       boolean; // True if Net > 0, False if Net < 0 (Refund)
  pendingCount:    number;
}
