export interface PMSchedule {
  id: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  pmCode: string;
  taskDescription: string;
  frequencyDays: number;
  lastDoneDate?: string;
  nextDueDate: string;
  status: 'Active' | 'Paused';
}

export interface WorkOrder {
  id: string;
  woNumber: string;
  assetId: string;
  assetNumber: string;
  equipmentName: string;
  type: 'Preventive' | 'Breakdown' | 'Calibration';
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  issueDescription: string;
  assignedToTechnician?: string;
  createdDate: string;
  startDate?: string;
  completedDate?: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled';
  sparePartsUsed?: { itemCode: string; itemName: string; quantity: number; unitPrice: number; }[];
  laborHoursCost?: number;
}
