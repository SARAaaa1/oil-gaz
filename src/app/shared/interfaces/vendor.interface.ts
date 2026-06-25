export interface BankAccount {
  bankName: string;
  accountNumber: string;
  iban: string;
  currency: string;
}

export interface ContactPerson {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export type VendorCategory = 'Drilling Services' | 'Chemicals' | 'Tubulars' | 'HSE' | 'Logistics' | 'General';
export type VendorApprovalStatus = 'Approved' | 'Pending' | 'Blacklisted';

export interface Vendor {
  id: string;
  vendorCode: string;
  vendorName: string;
  arabicName: string;
  taxNumber: string;
  vatNumber: string;
  commercialRegistration: string;
  address: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  paymentTerms: string;
  currency: string;
  rating: number;                    // legacy 0-5 star
  status: 'Active' | 'Inactive';
  category: VendorCategory;
  approvalStatus: VendorApprovalStatus;
  bankAccounts?: BankAccount[];
  contactPersons?: ContactPerson[];

  // Transaction summary
  totalOrders: number;
  totalSpend: number;
  lastTransactionDate?: string;

  // Performance raw data (used to compute scores)
  totalRFQs: number;
  awardedRFQs: number;
  participatedRFQs: number;
  totalDeliveries: number;
  onTimeDeliveries: number;
  totalDeliveredQty: number;
  acceptedQty: number;
  lateDeliveries: number;
  rejectedDeliveries: number;
  openInvoices: number;
  paidInvoices: number;
}

// ── Vendor Timeline ──────────────────────────────────────────────────────────

export type VendorEventType =
  | 'Created'
  | 'RFQ Sent'
  | 'RFQ Email Sent'
  | 'Quotation Received'
  | 'Quotation Submitted'
  | 'PO Issued'
  | 'PO Sent'
  | 'Goods Received'
  | 'Invoice Submitted'
  | 'Payment Released'
  | 'Evaluation Completed'
  | 'Status Changed'
  | 'Document Uploaded'
  | 'Clarification'
  | 'Negotiation'
  | 'Delivery Update';

export interface VendorTimelineEvent {
  id: string;
  vendorId: string;
  date: string;
  eventType: VendorEventType;
  title: string;
  description: string;
  referenceNumber?: string;
  amount?: number;
  performedBy: string;
}

// ── Vendor Ledger ────────────────────────────────────────────────────────────

export type VendorLedgerType =
  | 'Purchase Order'
  | 'Supplier Invoice'
  | 'Payment Voucher'
  | 'Credit Note'
  | 'Debit Note'
  | 'Advance Payment';

export interface VendorLedgerEntry {
  id: string;
  vendorId: string;
  date: string;
  reference: string;
  transactionType: VendorLedgerType;
  description: string;
  debit: number;      // Amount owed to vendor (PO / Invoice)
  credit: number;     // Amount paid / credited
  balance: number;    // Running balance (positive = payable)
}

// ── Vendor Documents ─────────────────────────────────────────────────────────

export type VendorDocumentType =
  | 'Contract'
  | 'Quotation'
  | 'Certification'
  | 'Tax Document'
  | 'Bank Info'
  | 'Other';

export type VendorDocumentStatus = 'Valid' | 'Expiring Soon' | 'Expired';

export interface VendorDocument {
  id: string;
  vendorId: string;
  documentType: VendorDocumentType;
  fileName: string;
  fileSize: string;
  uploadedDate: string;
  uploadedBy: string;
  expiryDate?: string;
  status: VendorDocumentStatus;
  notes?: string;
}
