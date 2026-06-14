export interface InventoryItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  minQuantity: number;
  category: string;
  uom: string;
  location: string;
  unitPrice: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  status: 'Active' | 'Inactive';
}

export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  zone: string;
  shelf: string;
  bin: string;
}

export interface UOM {
  code: string;
  name: string;
}

export interface MaterialCategory {
  code: string;
  name: string;
}

export interface MRVItem {
  itemCode: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
  uom: string;
}

export interface MRV {
  id: string;
  voucherNumber: string;
  poId?: string;
  poNumber?: string;
  warehouseId: string;
  receivedDate: string;
  receivedBy: string;
  supplierName: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Cancelled';
  items: MRVItem[];
  totalAmount: number;
}

export interface MIVItem {
  itemCode: string;
  itemName: string;
  quantityRequested: number;
  quantityIssued: number;
  unitPrice: number;
  totalPrice: number;
  uom: string;
  inventoryCreditAcc: string;
  consumptionDebitAcc: string;
}

export interface MIV {
  id: string;
  voucherNumber: string;
  issueTo: 'Project' | 'Cost Center' | 'Rig' | 'Workshop' | 'Vehicle' | 'Camp';
  destinationId: string; // ProjectCode, CostCenter, RigCode, etc.
  referenceNumber: string;
  requestedBy: string;
  approvedBy?: string;
  issueDate: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Cancelled';
  items: MIVItem[];
  totalAmount: number;
}

export interface InternalTransferItem {
  itemCode: string;
  itemName: string;
  quantity: number;
  uom: string;
}

export interface InternalTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: string;
  requestedBy: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Cancelled';
  items: InternalTransferItem[];
}

export interface StockAdjustmentItem {
  itemCode: string;
  itemName: string;
  systemQuantity: number;
  adjustedQuantity: number;
  adjustmentType: 'Addition' | 'Deduction';
  unitPrice: number;
  reason: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  adjustmentDate: string;
  requestedBy: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Posted' | 'Cancelled';
  items: StockAdjustmentItem[];
  totalValue: number;
}

export interface StockCountItem {
  itemCode: string;
  itemName: string;
  systemQuantity: number;
  countedQuantity: number;
  variance: number;
}

export interface StockCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  countDate: string;
  countedBy: string;
  status: 'Draft' | 'Completed';
  items: StockCountItem[];
}

export interface InventoryReservationItem {
  itemCode: string;
  itemName: string;
  uom: string;
  requestedQuantity: number;
  reservedQuantity: number;
  unitPrice: number;
}

export interface InventoryReservation {
  id: string;
  reservationNumber: string;
  projectCode: string;
  projectName: string;
  requestedBy: string;
  requestDate: string;
  requiredDate: string;
  status: 'Pending' | 'Approved' | 'Partially Reserved' | 'Released' | 'Cancelled';
  items: InventoryReservationItem[];
  totalValue: number;
  notes?: string;
}
