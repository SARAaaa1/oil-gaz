export interface CostCenter {
  code: string;
  name: string;
  type: 'Project' | 'Department' | 'Operational' | 'Warehouse';
  parentCode?: string;
  status: 'Active' | 'Inactive';
  description?: string;
}

export interface Project {
  code: string; // Auto Generated, e.g. PROJ-CON-2026-001
  name: string;
  contractId: string;
  contractNumber: string;
  customer: string;
  contractValue: number;
  consumedValue: number;
  remainingValue: number;
  progressPercent: number;
  status: 'Active' | 'Completed' | 'Delayed' | 'Suspended';
  startDate: string;
  endDate: string;

  // Location Info
  country: string;
  region: string;
  siteName: string;
  gpsCoordinates: string;

  // Cost Center Info
  costCenterCode: string;

  // Logistics Info
  preferredWarehouse: string;
  nearestWarehouse: string;
  distanceKm: number;
  estimatedTransportationCost: number;

  // Currency Snapshot
  contractValueUSD?: number;      // same as contractValue, explicit USD
  contractValueEGP?: number;      // EGP equivalent at time of creation
  exchangeRateUSDtoEGP?: number;  // Rate captured at contract creation
  rateSnapshotDate?: string;      // ISO date of the rate snapshot
}

export interface EquipmentAssignment {
  id: string;
  equipmentId: string;
  equipmentName: string;
  serialNumber: string;
  projectCode: string;
  siteName: string;
  assignedDate: string;
  returnedDate?: string;
  status: 'Assigned' | 'Returned' | 'In Transit' | 'Under Maintenance';
  hoursUsed: number;
  daysUsed: number;
  costCenterCode: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  assetName: string;
  serialNumber: string;
  projectCode: string;
  assignedDate: string;
  assignedTo: string;
  location: string;
  costCenterCode: string;
  status: 'Active' | 'Returned' | 'Transferred' | 'Lost' | 'Damaged';
}

export interface MaterialConsumption {
  id: string;
  projectCode: string;
  materialCode: string;
  materialName: string;
  warehouse: string;
  issuedQuantity: number;
  consumedQuantity: number;
  remainingQuantity: number;
  costCenterCode: string;
  issueDate: string;
  docRef: string;
  unitPrice: number;
}

export interface EquipmentTransfer {
  transferNumber: string;
  equipmentId: string;
  equipmentName: string;
  fromLocation: string;
  toLocation: string;
  projectCode: string;
  costCenterCode: string;
  startDate: string;
  arrivalDate?: string;
  transportationHours: number;
  transportationCost: number;
  reason: string;
  status: 'Requested' | 'Approved' | 'Completed';
}

export interface LaborRecord {
  id: string;
  projectCode: string;
  employeeName: string;
  role: string;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  overtimeRate: number;
  totalCost: number;
  date: string;
}
