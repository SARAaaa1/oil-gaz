export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
  description?: string;
  balance?: number;
  isActive: boolean;
  isReconciliation: boolean;
  costCenterCode?: string;
}

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  projectCode?: string;
  costCenterCode?: string;
}

export type JournalStatus = 'Draft' | 'Posted' | 'Voided';

export interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  reference: string;
  description: string;
  status: JournalStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdDate: string;
  createdBy: string;
  postedDate?: string;
  postedBy?: string;
}
