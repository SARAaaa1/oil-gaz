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
  poNumber: string;
  rfqId?: string;
  rfqNumber?: string;
  vendorId: string;
  vendorName: string;
  vendorTaxNumber: string;
  vendorAddress: string;
  date: string;
  deliveryDate: string;
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
  approvalWorkflow: POApprovalStep[];
}
