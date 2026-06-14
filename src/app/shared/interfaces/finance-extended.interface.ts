export interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  poId?: string;
  poNumber?: string;
  vendorId: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string;
  subTotal: number;
  taxAmount: number;
  totalAmount: number;
  status: 'Unpaid' | 'Partially Paid' | 'Paid' | 'Cancelled';
  paymentTerms: string;
}

export interface APAgingEntry {
  vendorId: string;
  vendorName: string;
  totalDue: number;
  current: number; // 0-30 days
  thirtyToSixty: number; // 31-60 days
  sixtyToNinety: number; // 61-90 days
  overNinety: number; // >90 days
}

export interface PaymentVoucher {
  id: string;
  voucherNumber: string;
  paymentDate: string;
  vendorId: string;
  vendorName: string;
  bankAccountId: string;
  bankAccountName: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled';
  invoicesPaid: { invoiceId: string; invoiceNumber: string; amountPaid: number; }[];
}

export interface ARAgingEntry {
  customerId: string;
  customerName: string;
  totalDue: number;
  current: number;
  thirtyToSixty: number;
  sixtyToNinety: number;
  overNinety: number;
}

export interface CollectionVoucher {
  id: string;
  voucherNumber: string;
  collectionDate: string;
  customerName: string;
  bankAccountId: string;
  bankAccountName: string;
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash';
  referenceNumber: string;
  amount: number;
  status: 'Draft' | 'Posted' | 'Cancelled';
  invoicesCollected: { invoiceId: string; invoiceNumber: string; amountCollected: number; }[];
}

export interface BankAccountDetails {
  id: string;
  bankName: string;
  accountNumber: string;
  iban: string;
  currency: string;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface CashAccountDetails {
  id: string;
  officeLocation: string;
  custodianName: string;
  currency: string;
  balance: number;
  status: 'Active' | 'Inactive';
}

export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  statementPeriod: string; // e.g. "June 2026"
  statementEndDate: string;
  bookBalance: number;
  statementBalance: number;
  difference: number;
  status: 'Unreconciled' | 'Reconciled';
  reconciledDate?: string;
  reconciledBy?: string;
}
