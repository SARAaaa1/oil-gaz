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

export interface RigDetails {
  id: string;
  rigCode: string;
  rigName: string;
  location: string;
  status: 'Active' | 'Maintenance' | 'Standby' | 'Retired';
  drillDepthFt: number;
  crewCount: number;
  managerName: string;
  assignedAssets: string[]; // Equipment codes/IDs
  assignedCrew: string[]; // Crew names
  maintenanceReadiness: number; // percentage
}

export interface Caravan {
  id: string;
  caravanNumber: string;
  capacityBeds: number;
  assignedCampId: string;
  status: 'Available' | 'Full' | 'Maintenance';
  assets: {
    generators: number;
    airConditioners: number;
    furnitureCount: number;
    waterTanks: number;
    kitchenEquipCount: number;
  };
}

export interface Camp {
  id: string;
  campCode: string;
  campName: string;
  location: string;
  totalBeds: number;
  occupiedBeds: number;
  caravansCount: number;
  status: 'Active' | 'Maintenance' | 'Closed';
}

export interface CampAllocation {
  id: string;
  campId: string;
  caravanId: string;
  allocatedToUser: string;
  allocationDate: string;
  releaseDate?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  model: string;
  make: string;
  year: number;
  assignedTo: string;
  fuelType: 'Diesel' | 'Petrol';
  status: 'Available' | 'Assigned' | 'Maintenance' | 'Out Of Service';
  currentOdometer: number;
}

export interface TripLog {
  id: string;
  vehicleId: string;
  driverName: string;
  purpose: string;
  startOdometer: number;
  endOdometer: number;
  fuelAddedLiters?: number;
  fuelCost?: number;
  tripDate: string;
}

export interface AssetAssignment {
  id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  assignedToType: 'Project' | 'Rig' | 'Camp' | 'Driver';
  assignedToId: string; // e.g. rigCode, projectCode, etc.
  assignedToName: string;
  assignmentDate: string;
  releaseDate?: string;
  conditionOnAssign: 'New' | 'Good' | 'Fair' | 'Poor';
  notes?: string;
}

export interface AssetTransfer {
  id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  fromLocation: string;
  toLocation: string;
  transferDate: string;
  authorizedBy: string;
  status: 'Pending' | 'Completed' | 'Rejected';
  notes?: string;
}

export interface AssetDisposal {
  id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  disposalDate: string;
  disposalMethod: 'Sale' | 'Scrap' | 'Write-off' | 'Donation';
  disposalCost: number;
  revenueReceived?: number;
  reason: string;
  authorizedBy: string;
  status: 'Pending' | 'Approved';
}


