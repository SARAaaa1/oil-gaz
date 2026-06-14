export interface FuelTank {
  id: string;
  tankCode: string;
  tankName: string;
  location: string;
  fuelType: 'Diesel' | 'Petrol' | 'Gas';
  capacityLiters: number;
  currentLevelLiters: number;
  status: 'Active' | 'Maintenance' | 'Inactive';
}

export interface FuelReceipt {
  id: string;
  receiptNumber: string;
  tankId: string;
  tankName: string;
  fuelType: 'Diesel' | 'Petrol' | 'Gas';
  quantityLiters: number;
  unitCost: number;
  totalCost: number;
  supplierName: string;
  deliveryDate: string;
  receivedBy: string;
  invoiceNumber?: string;
  status: 'Draft' | 'Posted';
}

export interface FuelIssue {
  id: string;
  issueNumber: string;
  tankId: string;
  tankName: string;
  fuelType: 'Diesel' | 'Petrol' | 'Gas';
  quantityLiters: number;
  unitCost: number;
  totalCost: number;
  issuedTo: 'Vehicle' | 'Generator' | 'Rig' | 'Camp';
  issuedToId: string;
  issuedToName: string;
  costCenterCode: string;
  issueDate: string;
  issuedBy: string;
  odometerReading?: number;
  runningHours?: number;
  status: 'Draft' | 'Posted';
}
