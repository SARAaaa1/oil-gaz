// ═══════════════════════════════════════════════════════
//  Finance V2 — Accounts Receivable Interfaces
// ═══════════════════════════════════════════════════════

export type CustomerStatus     = 'Active' | 'Inactive' | 'Suspended' | 'Blacklisted';
export type ArInvoiceStatus    = 'Draft' | 'Under Review' | 'Approved' | 'Sent To Customer' | 'Partially Collected' | 'Collected' | 'Closed' | 'Rejected';
export type CollectionStatus   = 'Draft' | 'Posted' | 'Cancelled';
export type CollectionMethod   = 'Bank Transfer' | 'Cheque' | 'Cash' | 'Online';
export type ArInvoiceSource    = 'Project Completion' | 'Service Completion' | 'Contract Billing' | 'Progress Billing' | 'Manual Invoice';
export type ArPaymentTerms     = 'Net 30' | 'Net 45' | 'Net 60' | 'Net 90' | 'Immediate' | 'COD';
export type AgingBucket        = 'Current' | '1-30' | '31-60' | '61-90' | '90+';
export type CustomerRating     = 1 | 2 | 3 | 4 | 5;

// ── Customer ──────────────────────────────────────────
export interface ArCustomer {
  id:                   string;
  code:                 string;
  nameEn:               string;
  nameAr:               string;
  taxNumber:            string;
  vatNumber:            string;
  commercialReg:        string;
  industry:             string;
  contactPerson:        string;
  contactEmail:         string;
  contactPhone:         string;
  address:              string;
  city:                 string;
  country:              string;
  currency:             string;
  creditLimit:          number;
  paymentTerms:         ArPaymentTerms;
  openBalance:          number;
  outstandingInvoices:  number;
  totalInvoiced:        number;
  totalCollected:       number;
  lastInvoiceDate:      string;
  lastCollectionDate:   string;
  lastCollectionAmount: number;
  avgCollectionDays:    number;
  status:               CustomerStatus;
  rating:               CustomerRating;
  bankName:             string;
  iban:                 string;
  notes:                string;
}

// ── Invoice Validation ────────────────────────────────
export interface ArInvoiceValidation {
  missingProject:     boolean;
  missingContract:    boolean;
  missingCompletion:  boolean;
  duplicateNumber:    boolean;
  vatMismatch:        boolean;
  negativeAmount:     boolean;
  dueDateBeforeInv:   boolean;
}

// ── Invoice Line ──────────────────────────────────────
export interface ArInvoiceLine {
  id:           string;
  description:  string;
  qty:          number;
  unitPrice:    number;
  uom:          string;
  vatPct:       number;
  vatAmount:    number;
  total:        number;
  milestoneRef: string;
  progressPct:  number;
}

// ── Customer Invoice ──────────────────────────────────
export interface ArInvoice {
  id:                   string;
  invoiceNumber:        string;
  customerId:           string;
  customerName:         string;
  customerNameAr:       string;
  // Traceability chain
  projectCode:          string;
  projectName:          string;
  contractNumber:       string;
  contractValue:        number;
  serviceOrderNumber:   string;
  completionCertNumber: string;
  milestoneRef:         string;
  // Billing
  source:               ArInvoiceSource;
  invoiceDate:          string;
  dueDate:              string;
  paymentTerms:         ArPaymentTerms;
  currency:             string;
  // Amounts
  subtotal:             number;
  discountPct:          number;
  discountAmount:       number;
  vatPct:               number;
  vatAmount:            number;
  retentionPct:         number;
  retentionAmount:      number;
  grandTotal:           number;
  collectedAmount:      number;
  outstandingAmount:    number;
  // Status & Workflow
  status:               ArInvoiceStatus;
  aging:                AgingBucket;
  // Audit
  remarks:              string;
  financeRemarks:       string;
  rejectionReason:      string;
  createdBy:            string;
  createdDate:          string;
  reviewedBy:           string;
  approvedBy:           string;
  approvalDate:         string;
  sentDate:             string;
  // Attachments & Docs
  invoicePdfAttached:   boolean;
  completionAttached:   boolean;
  attachments:          string[];
  // Line items
  lines:                ArInvoiceLine[];
  // Validation
  validation:           ArInvoiceValidation;
}

// ── Collection Allocation ─────────────────────────────
export interface CollectionAllocation {
  invoiceId:       string;
  invoiceNumber:   string;
  customerId:      string;
  customerName:    string;
  outstandingAmt:  number;
  allocatedAmount: number;
  discount:        number;
}

// ── Collection Voucher ────────────────────────────────
export interface ArCollection {
  id:               string;
  voucherNumber:    string;
  collectionDate:   string;
  customerId:       string;
  customerName:     string;
  collectionMethod: CollectionMethod;
  bankName:         string;
  chequeNumber:     string;
  referenceNumber:  string;
  currency:         string;
  totalAmount:      number;
  status:           CollectionStatus;
  remarks:          string;
  createdBy:        string;
  createdDate:      string;
  approvedBy:       string;
  approvalDate:     string;
  allocations:      CollectionAllocation[];
  attachments:      string[];
}

// ── AR Dashboard KPIs ─────────────────────────────────
export interface ArDashboardKpi {
  totalReceivables:     number;
  outstanding:          number;
  overdue:              number;
  collectedThisMonth:   number;
  collectionRate:       number;
  avgCollectionDays:    number;
}
