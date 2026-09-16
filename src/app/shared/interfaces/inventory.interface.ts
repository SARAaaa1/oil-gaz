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
  warehouseId?: string;
  warehouseCode?: string;
  warehouseName?: string;
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
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Inspected' | 'Posted' | 'Cancelled';
  items: MRVItem[];
  totalAmount: number;

  // Cost Allocation Dimensions
  chargeType?: string;
  projectId?: string;
  projectName?: string;
  assetId?: string;
  assetName?: string;
  costCenter?: string;
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
  warehouseId?: string;
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

// ── Opening Stock Interfaces (v3.1 Auto-Posting & Reversal) ──────────────────

export interface OpeningStockItem {
  id: string;
  openingNumber: string;
  itemCode: string;
  itemName?: string;
  warehouseCode: string;
  warehouseName?: string;
  warehouseId?: string;
  openingQuantity: number;
  unitOfMeasure: string;
  location?: string;
  batchNumber?: string;
  serialNumber?: string;
  condition?: string;
  notes?: string;
  openingDate?: string;
  status: 'Draft' | 'Posted' | 'POSTED' | 'Cancelled' | 'CANCELLED';
  unitCost?: number;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOpeningStockDto {
  itemCode: string;
  warehouseCode: string;
  openingQuantity: number;
  unitOfMeasure: string;
  location?: string;
  batchNumber?: string;
  serialNumber?: string;
  condition?: string;
  notes?: string;
  openingDate?: string;
  unitCost?: number;
  category?: string;
}

export interface OpeningStockImportError {
  row: number;
  itemCode?: string;
  warehouseCode?: string;
  status?: string;
  message?: string;
  reason?: string;
}

export interface OpeningStockImportResponse {
  success: boolean;
  message: string;
  totalRows?: number;
  successCount?: number;
  failedCount?: number;
  data?: {
    openingStockId?: string;
    status?: string;
    totalItems?: number;
    createdMaterials?: number;
    existingMaterials?: number;
  };
  errors?: OpeningStockImportError[];
}

// ── Advanced Reports Interfaces ─────────────────────────────────────────────

export interface ItemLedgerReportResponse {
  item: {
    _id: string;
    itemCode: string;
    name: string;
    unit: string;
    unitCost: number;
  };
  period: {
    startDate?: string;
    endDate?: string;
  };
  openingBalance: number;
  openingValue: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  closingValue: number;
  transactions: Array<{
    transactionId: string;
    date: string;
    type: string;
    reference: string;
    warehouse?: {
      _id: string;
      name: string;
    };
    partner?: string;
    qtyIn: number;
    qtyOut: number;
    runningBalance: number;
    unitPrice: number;
    totalPrice: number;
    runningValue: number;
    remarks?: string;
  }>;
}

export interface StockSummaryReportResponse {
  kpis: {
    totalItemsCount: number;
    totalStockQty: number;
    totalValuationUSD: number;
    lowStockCount: number;
  };
  items: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    category?: string;
    uom: string;
    openingBalance: number;
    purchases: number;
    opsIn: number;
    transfersIn: number;
    consumption: number;
    opsOut: number;
    transfersOut: number;
    contractors: number;
    currentBalance: number;
    closingBalance: number;
    unitPrice: number;
    totalValue: number;
    minQuantity: number;
    status: string;
  }>;
}

export interface ValuationReportResponse {
  asOfDate: string;
  valuationMethod: 'WAVG' | 'FIFO';
  summary: {
    totalSKUs: number;
    totalPhysicalUnits: number;
    totalInventoryAssetValue: number;
  };
  byCategory: Array<{
    category: string;
    skuCount: number;
    totalQty: number;
    totalValuation: number;
  }>;
  items: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    uom: string;
    warehouseId?: string;
    warehouseName?: string;
    onHandQty: number;
    averageUnitCost: number;
    totalAssetValue: number;
    lastReceivedDate?: string;
  }>;
}

export interface ReorderAlertItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  warehouseName?: string;
  currentStock: number;
  minQuantity: number;
  maxQuantity: number;
  reorderQuantity: number;
  urgency: 'CRITICAL' | 'WARNING';
  openPurchaseOrderQty: number;
}

export interface ReorderAlertsReportResponse {
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
  alerts: ReorderAlertItem[];
}

export interface StockAgingReportResponse {
  agingDistribution: {
    tier_0_30: { qty: number; value: number };
    tier_31_60: { qty: number; value: number };
    tier_61_90: { qty: number; value: number };
    tier_91_180: { qty: number; value: number };
    tier_over_180: { qty: number; value: number };
  };
  deadStockItems: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    onHandQty: number;
    unitCost: number;
    totalValuation: number;
    lastMovementDate?: string;
    daysDormant: number;
  }>;
}

export interface ConsumptionByProjectReportResponse {
  totalConsumptionValue: number;
  projects: Array<{
    projectId: string;
    projectName: string;
    totalItemsIssued: number;
    totalCost: number;
    topMaterials: Array<{
      itemCode: string;
      name: string;
      quantity: number;
      cost: number;
    }>;
  }>;
}

export interface StockCountVarianceReportResponse {
  summary: {
    totalCounts: number;
    totalItemsAudited: number;
    discrepanciesCount: number;
    netVarianceQty: number;
    netVarianceValue: number;
  };
  variances: Array<{
    countNumber: string;
    countDate: string;
    warehouseName: string;
    itemCode: string;
    itemName: string;
    systemQuantity: number;
    countedQuantity: number;
    variance: number;
    unitPrice: number;
    varianceValue: number;
  }>;
}

