export type RFQStatus = 'Draft' | 'Sent' | 'Partially Responded' | 'Fully Responded' | 'Closed' | 'Awarded';

export type VendorResponseStatus = 'Pending' | 'Submitted' | 'Under Review' | 'Accepted' | 'Rejected' | 'Revision Requested';

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
  uom: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  totalPrice: number;
}

export interface QuotationAttachment {
  name: string;
  size: string;
  type: string;
  url: string;
}

export interface RFQQuotation {
  id: string;
  vendorId: string;
  vendorName: string;
  price: number;
  deliveryWeeks: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  isBestPrice?: boolean;
  isRecommended?: boolean;
  notes?: string;
  submissionDate?: string;
  status: VendorResponseStatus;
  paymentTerms?: string;
  discountPercent?: number;
  discountAmount?: number;
  attachments?: QuotationAttachment[];
  items?: QuotationItem[];
}

export interface RFQ {
  id: string;
  rfqNumber: string;             // RFQ-2026-0001 (4-digit)
  chainId: string;               // PC-2026-0001
  parentDocumentId: string;      // source PR id
  parentDocumentNumber: string;  // source PR number

  purchaseRequestId: string;
  purchaseRequestNumber: string;
  title: string;
  createdDate: string;
  deadlineDate: string;
  status: RFQStatus;
  vendors: RFQVendor[];
  quotations: RFQQuotation[];

  // Cost Allocation Dimensions (propagated from PR)
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
  costCenter?: string;
}
