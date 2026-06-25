export type PurchaseOrderStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Issued' | 'Rejected' | 'Completed';

export interface POItem {
  id: string;
  itemName: string;
  itemCode: string;
  quantity: number;
  unitPrice: number;
  uom: string;
  totalPrice: number;
}

export interface POApprovalStep {
  role: string;
  approverName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  actionDate?: string;
  comments?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;              // legacy, same as documentNumber
  documentNumber: string;        // PO-2026-0001-0001-0002-0001 — hierarchical
  procurementChain: string;      // "0001-0001-0002-0001"
  rootProcurementNumber: string; // "PR-2026-0001"
  quotationNumber?: string;      // "QTN-2026-0001-0001-0002" — winning quotation
  chainId: string;               // PC-2026-0001 (backward compat)
  parentDocumentId?: string;     // source RFQ id
  parentDocumentNumber?: string; // source RFQ number

  rfqId?: string;
  rfqNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorTaxNumber: string;
  vendorAddress: string;
  vendorContact?: string;        // Supplier Contact Name/Email/Phone
  date: string;                  // PO Date
  deliveryDate: string;
  deliveryAddress?: string;      // Delivery Address
  costCenter: string;
  paymentTerms: string;
  status: PurchaseOrderStatus;
  items: POItem[];
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  withholdingTaxPercent: number;
  withholdingTaxAmount: number;
  totalAmount: number;

  // Commercial Terms
  advancePayment?: number;       // e.g. 10% or absolute value
  deliveryPayment?: number;      // e.g. 70% or absolute value
  retentionAmount?: number;      // e.g. 10%
  otherPaymentConditions?: string;

  // Representatives Signatures
  companyRepresentative?: string;
  supplierRepresentative?: string;

  // Contract Attachment
  contractNumber?: string;       // e.g. CNT-2026-0001
  contractTitle?: string;
  contractDate?: string;
  contractExpiryDate?: string;
  contractFileUrl?: string;      // URL / blob path for download
  contractFileName?: string;     // display filename, e.g. Contract_PO-2026-0001.pdf
  contractFileSizeKb?: number;

  approvalWorkflow: POApprovalStep[];

  // Cost Allocation Dimensions (propagated from RFQ/PR)
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
}

