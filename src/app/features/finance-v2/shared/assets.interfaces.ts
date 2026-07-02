// ═══════════════════════════════════════════════════════
//  Finance V2 — Fixed Assets & Depreciation Interfaces
// ═══════════════════════════════════════════════════════

export type AssetCategory =
  | 'Rig Equipment'
  | 'Generators'
  | 'Vehicles'
  | 'Forklifts'
  | 'Cranes'
  | 'Heavy Equipment'
  | 'Office Equipment'
  | 'IT Equipment'
  | 'Furniture'
  | 'Buildings'
  | 'Land'
  | 'Tools'
  | 'Other Assets';

export type AssetStatus =
  | 'Draft'
  | 'Purchased'
  | 'Capitalized'
  | 'Active'
  | 'Under Maintenance'
  | 'Transferred'
  | 'Disposed'
  | 'Sold'
  | 'Retired';

export type DepreciationMethod = 'Straight Line' | 'Declining Balance' | 'Units of Production';

// ── Asset History Timeline Event ─────────────────────
export interface AssetHistoryEvent {
  id:          string;
  eventDate:   string;
  type:        'Purchase' | 'Capitalization' | 'Transfer' | 'Maintenance' | 'Depreciation' | 'Disposal' | 'Status Change';
  description: string;
  user:        string;
}

// ── Fixed Asset Record ────────────────────────────────
export interface FixedAsset {
  id:                      string;
  assetCode:               string;
  assetName:               string;
  serialNumber:            string;
  category:                AssetCategory;
  projectCode:             string;
  projectName:             string;
  costCenterCode:          string;
  costCenterName:          string;
  warehouseCode:           string;
  supplierName:            string;
  purchaseOrderNumber:     string;
  purchaseInvoiceNumber:   string;
  purchaseDate:            string;
  capitalizationDate:      string;
  usefulLifeYears:         number;
  usefulLifeMonths:        number;
  depreciationMethod:      DepreciationMethod;
  originalCost:            number;
  residualValue:           number;
  currentBookValue:        number; // Original Cost - Accumulated Depreciation
  accumulatedDepreciation: number;
  status:                  AssetStatus;
  location:                string;
  assignedEmployee:        string;
  department:              string;
  warrantyExpiry:          string;
  insuranceExpiry:         string;
  qrCodeUrl:               string;
  notes:                   string;
  lastDepreciationDate:    string;
  history:                 AssetHistoryEvent[];
}

// ── Dashboard Metrics ────────────────────────────────
export interface AssetsDashboardKpi {
  totalAssets:             number;
  totalAssetValue:         number;
  accumulatedDepreciation: number;
  netBookValue:            number;
  assetsInService:         number;
  assetsConstruction:      number; // Draft / Purchased status
  disposedAssets:          number;
  maintenanceDue:          number;
}
