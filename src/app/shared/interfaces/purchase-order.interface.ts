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
  poNumber: string;              // PO-2026-0001 (4-digit)
  chainId: string;               // PC-2026-0001
  parentDocumentId?: string;     // source RFQ id
  parentDocumentNumber?: string; // source RFQ number

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

  // Cost Allocation Dimensions (propagated from RFQ/PR)
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
}
