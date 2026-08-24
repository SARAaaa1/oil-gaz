export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string | null;
  description?: string | null;
  balance?: number;
  isActive: boolean;
  isReconciliation: boolean;
  costCenterCode?: string | null;
  _id?: string;
  children?: ChartOfAccount[];
  createdAt?: string;
}

export interface JournalLine {
  id?: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  projectCode?: string;
  costCenterCode?: string;
  type?: 'Debit' | 'Credit';
  amount?: number;
  notes?: string;
}

export type JournalStatus = 'Draft' | 'Posted' | 'Voided';

export interface JournalEntry {
  id: string;
  journalNumber: string;
  date: string;
  reference?: string;
  description: string;
  status: JournalStatus;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  createdDate?: string;
  createdBy?: string;
  postedDate?: string;
  postedBy?: string;
  _id?: string;
  sourceType?: string;
  createdAt?: string;
}
