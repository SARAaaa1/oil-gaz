export interface DashboardStatisticsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DashboardData;
}

export interface DashboardData {
  kpis: DashboardKPIs;
  procurementPipeline: ProcurementPipeline;
  inventoryHealth: InventoryHealth;
  myTasks: DashboardMyTasks;
  criticalStockAlerts: CriticalStockAlertItem[];
}

export interface DashboardKPIs {
  inventoryValue: number;
  openPurchaseOrdersCount: number;
  criticalStockCount: number;
}

export interface ProcurementPipeline {
  purchaseRequestsCount: number;
  rfqsCount: number;
  purchaseOrdersCount: number;
  inspectionsCount: number;
  goodsReceiptsCount: number;
  stageSummary: {
    openPRs: number;
    activeRFQs: number;
    pendingPOs: number;
    queueInspections: number;
    pendingMRVs: number;
  };
}

export interface InventoryHealth {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inStockPercentage: number;
  lowStockPercentage: number;
  outOfStockPercentage: number;
}

export interface DashboardPendingPR {
  id: string;
  prNumber: string;
  department: string;
  requestedBy: string;
  createdAt: string;
  totalEstimatedCost: number;
  status: string;
}

export interface DashboardPendingInspection {
  id: string;
  inspectionNumber: string;
  poNumber: string;
  vendorName: string;
  deliveryDate: string;
  status: string;
}

export interface DashboardMyTasks {
  pendingPRs: DashboardPendingPR[];
  pendingInspections: DashboardPendingInspection[];
}

export interface CriticalStockAlertItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  minQuantity: number;
  uom: string;
  warehouseName: string;
  status: 'Low Stock' | 'Out of Stock';
}
