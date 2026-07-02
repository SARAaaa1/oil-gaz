// Finance V2 — AP Interfaces (Phase 4)
// Path: src/app/features/finance-v2/shared/ap.interfaces.ts

export type SupplierStatus       = 'Active' | 'Inactive' | 'Blacklisted' | 'On Hold';
export type PaymentTerms         = 'Net 30' | 'Net 45' | 'Net 60' | 'Net 90' | 'Immediate' | 'COD';
export type InvoiceStatus        = 'Draft' | 'Under Review' | 'Approved' | 'Ready For Payment' | 'Paid' | 'Closed' | 'Rejected';
export type PaymentStatus        = 'Draft' | 'Approved' | 'Posted' | 'Cancelled';
export type PaymentMethod        = 'Bank Transfer' | 'Cheque' | 'Cash' | 'Online';
export type InvoiceSource        = 'PO' | 'Goods Receipt' | 'Manual';
export type AgingBucket          = 'Current' | '1-30' | '31-60' | '61-90' | '90+';
export type VendorRating         = 1 | 2 | 3 | 4 | 5;

// ─── Supplier ──────────────────────────────────────────────────────────────
export interface ApSupplier {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
  taxNumber: string;
  vatNumber: string;
  commercialReg: string;
  address: string;
  city: string;
  country: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  paymentTerms: PaymentTerms;
  currency: string;
  creditLimit: number;
  openBalance: number;
  outstandingInvoices: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  status: SupplierStatus;
  rating: VendorRating;
  bankName: string;
  iban: string;
  category: string;
  notes: string;
}

// ─── Invoice Validation Flags ──────────────────────────────────────────────
export interface InvoiceValidation {
  missingPO: boolean;
  missingGRN: boolean;
  amountExceedsPO: boolean;
  qtyExceedsReceived: boolean;
  duplicateNumber: boolean;
  vatMismatch: boolean;
}

// ─── Vendor Invoice ────────────────────────────────────────────────────────
export interface ApInvoiceLine {
  id: string;
  description: string;
  qty: number;
  unitPrice: number;
  uom: string;
  vatPct: number;
  vatAmount: number;
  total: number;
  poLineRef: string;
  grnLineRef: string;
}

export interface ApInvoice {
  id: string;
  invoiceNumber: string;
  supplierInvoiceNumber: string;   // original supplier ref
  supplierId: string;
  supplierName: string;
  supplierNameAr: string;

  // Procurement Chain Traceability
  prNumber: string;
  rfqNumber: string;
  quotationNumber: string;
  poNumber: string;
  grnNumber: string;               // Goods Receipt Number (MRV)

  // Dimensions
  projectCode: string;
  projectName: string;
  warehouseCode: string;
  warehouseName: string;
  costCenterCode: string;

  // Financials
  currency: string;
  invoiceDate: string;
  dueDate: string;
  paymentTerms: PaymentTerms;
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  vatPct: number;
  vatAmount: number;
  withholdingTaxPct: number;
  withholdingTaxAmount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  aging: AgingBucket;

  // Status & Workflow
  status: InvoiceStatus;
  source: InvoiceSource;
  remarks: string;
  financeRemarks: string;
  rejectionReason: string;

  // Attachments
  invoicePdfAttached: boolean;
  deliveryNoteAttached: boolean;
  attachments: string[];

  // Audit
  createdBy: string;
  createdDate: string;
  reviewedBy: string;
  approvedBy: string;
  approvalDate: string;

  lines: ApInvoiceLine[];
  validation: InvoiceValidation;
}

// ─── Payment Voucher ───────────────────────────────────────────────────────
export interface PaymentAllocation {
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  dueAmount: number;
  allocatedAmount: number;
  discount: number;
}

export interface ApPayment {
  id: string;
  voucherNumber: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  bankName: string;
  chequeNumber: string;
  referenceNumber: string;
  currency: string;
  totalAmount: number;
  status: PaymentStatus;
  remarks: string;
  createdBy: string;
  createdDate: string;
  approvedBy: string;
  approvalDate: string;
  allocations: PaymentAllocation[];
  attachments: string[];
}

// ─── AP Dashboard KPIs ─────────────────────────────────────────────────────
export interface ApDashboardKpi {
  totalOutstanding: number;
  waitingApproval: number;
  readyForPayment: number;
  paidThisMonth: number;
  overdueInvoices: number;
  avgPaymentDays: number;
}
