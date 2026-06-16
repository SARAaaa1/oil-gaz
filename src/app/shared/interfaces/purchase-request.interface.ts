export type PurchaseRequestStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'RFQ Created' | 'Cancelled';

export type ItemType = 'Inventory Item' | 'New Item' | 'Service';
export type ChargeType = 'Project Cost' | 'Asset Cost' | 'General Overhead';

export interface PurchaseRequestItem {
  id: string;
  itemType: ItemType;

  // Inventory Item fields
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
  notes?: string;

  // New Item additional fields
  itemDescription?: string;
  category?: string;
  estimatedUnitCost?: number;

  // Service fields
  serviceDescription?: string;
  scopeOfWork?: string;
  estimatedCost?: number;

  // Availability snapshot (Inventory Items only — computed at save time)
  currentStock?: number;
  reservedQty?: number;
  availableQty?: number;
  shortageQty?: number;

  // Partial fulfillment
  allowPartialIssue?: boolean;
  fulfillFromStock?: number;
  fulfillByPurchase?: number;
}

export interface PurchaseRequest {
  id: string;
  requestNumber: string;         // PR-2026-0001 (4-digit)
  chainId: string;               // PC-2026-0001
  parentDocumentId?: string;
  parentDocumentNumber?: string;

  department: string;
  costCenter: string;

  // Cost Allocation Dimensions
  chargeType: ChargeType;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;

  requestDate: string;
  requiredDate: string;
  status: PurchaseRequestStatus;
  description: string;
  items: PurchaseRequestItem[];
  requestedBy: string;

  // Reservation tracking
  reservationCreated?: boolean;
}
