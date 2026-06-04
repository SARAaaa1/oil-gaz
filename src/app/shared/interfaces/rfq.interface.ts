export type RFQStatus = 'Draft' | 'Sent' | 'Quotations Received' | 'Compared' | 'PO Created' | 'Closed';

export interface RFQVendor {
  vendorId: string;
  vendorName: string;
  contactEmail: string;
  status: 'Invited' | 'Submitted' | 'Declined';
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
}

export interface RFQ {
  id: string;
  rfqNumber: string;
  purchaseRequestId: string;
  purchaseRequestNumber: string;
  title: string;
  createdDate: string;
  deadlineDate: string;
  status: RFQStatus;
  vendors: RFQVendor[];
  quotations: RFQQuotation[];
}
