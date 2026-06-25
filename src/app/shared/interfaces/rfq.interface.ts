export type RFQStatus = 'Draft' | 'Sent' | 'Partially Responded' | 'Fully Responded' | 'Closed' | 'Awarded' | 'Cancelled';

export type VendorResponseStatus =
  | 'Pending'
  | 'Submitted'
  | 'Declined'
  | 'Expired'
  | 'Under Review'
  | 'Accepted'
  | 'Rejected'
  | 'Revision Requested';

export interface RFQVendor {
  vendorId: string;
  vendorName: string;
  contactEmail: string;
  status: VendorResponseStatus;
  invitationSentDate?: string;
  quotationSubmittedDate?: string;
}

export interface QuotationItem {
  itemCode: string;
  itemName: string;
  itemDescription?: string;
  uom: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  taxAmount?: number;
  totalPrice: number; // Line Total (quantity * unitPrice * (1 - discount/100) + tax)
}

export interface QuotationAttachment {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface RFQQuotation {
  id: string;
  quotationNumber: string;       // QT-2026-0001-0001-0002 — hierarchical
  quotationSequence: number;     // sequential index within the RFQ
  procurementChain: string;      // "0001-0001-0002"
  vendorId: string;
  vendorName: string;
  vendorContactPerson?: string;
  vendorPhone?: string;
  vendorEmail?: string;
  quotationDate?: string;
  validityDate?: string;
  currency?: string;
  deliveryLeadTime?: string;     // e.g. "2 Weeks"
  deliveryLocation?: string;
  taxIncluded?: boolean;
  paymentTerms?: string;
  warrantyPeriod?: string;       // e.g. "12 Months"
  remarks?: string;              // supplier notes
  notes?: string;                // backward compat
  price: number;                 // Subtotal
  deliveryWeeks: number;         // Lead time in weeks (legacy/compat)
  submissionDate?: string;       // Date vendor submitted this quotation

  // Calculations
  subtotal?: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;           // Grand Total

  isBestPrice?: boolean;
  isRecommended?: boolean;
  status: VendorResponseStatus;
  attachments?: QuotationAttachment[];
  items?: QuotationItem[];

  // Cost Allocation Dimensions
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
  costCenter?: string;
}

export interface RFQ {
  id: string;
  rfqNumber: string;             // legacy, same as documentNumber
  documentNumber: string;        // RFQ-2026-0001-0001 — hierarchical
  procurementChain: string;      // "0001-0001"
  rootProcurementNumber: string; // "PR-2026-0001"
  chainId: string;               // PC-2026-0001
  parentDocumentId: string;      // source PR id
  parentDocumentNumber: string;  // source PR number

  purchaseRequestId: string;
  purchaseRequestNumber: string;
  title: string;
  createdDate: string;
  deadlineDate: string;
  requiredDeliveryDate?: string;
  requester?: string;
  status: RFQStatus;
  vendors: RFQVendor[];
  quotations: RFQQuotation[];

  // Award Details
  awardedVendorId?: string;
  awardedVendorName?: string;
  awardedQuotationId?: string;
  awardedQuotationNumber?: string;

  // Cost Allocation Dimensions
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
  costCenter?: string;
}

