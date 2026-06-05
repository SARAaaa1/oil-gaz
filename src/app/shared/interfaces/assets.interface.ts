export type AssetStatus = 'Active' | 'Standby' | 'Maintenance' | 'Out Of Service';

export type AssetCategory =
  | 'Rig'
  | 'Generator'
  | 'Crane'
  | 'Truck'
  | 'Pump'
  | 'Compressor'
  | 'Heavy Equipment'
  | 'Safety Equipment';

export interface Equipment {
  id: string;
  assetNumber: string; // Asset Tag Number
  equipmentCode: string;
  equipmentName: string;
  category: AssetCategory;
  manufacturer: string;
  model: string;
  serialNumber: string;
  
  // Financial
  purchaseDate: string;
  purchaseCost: number;
  currentValue: number;
  depreciationMethod: string;

  // Operational
  location: string;
  projectAssignment: string; // Project
  costCenter: string;
  department: string;

  // Tracking
  status: AssetStatus;
  operatingHours: number;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
}

export interface AssetHistory {
  id: string;
  assetId: string;
  equipmentCode: string;
  changeType: 'Location Change' | 'Status Change' | 'Project Assignment' | 'Maintenance';
  oldValue: string;
  newValue: string;
  changedBy: string;
  date: string;
  notes?: string;
}

export interface BulkImportRecord {
  id: string;
  importedBy: string;
  date: string;
  numberOfRecords: number;
  status: 'Success' | 'Failed';
  module: 'Inventory' | 'Assets';
}
