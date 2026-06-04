export interface PurchaseRequestItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  notes?: string;
}

export type PurchaseRequestStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'RFQ Created';

export interface PurchaseRequest {
  id: string;
  requestNumber: string;
  department: string;
  costCenter: string;
  requestDate: string;
  requiredDate: string;
  status: PurchaseRequestStatus;
  description: string;
  items: PurchaseRequestItem[];
  requestedBy: string;
}
