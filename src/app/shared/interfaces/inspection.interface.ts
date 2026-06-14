export interface InspectionRequest {
  id: string;
  requestNumber: string;
  poId: string;
  poNumber: string;
  vendorId: string;
  vendorName: string;
  requestDate: string;
  inspectorName?: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Conditional';
  items: InspectionRequestItem[];
  inspectionDate?: string;
  notes?: string;
  ncrId?: string; // NCR ID if any NCR was raised
}

export interface InspectionRequestItem {
  itemCode: string;
  itemName: string;
  uom?: string;
  quantityOrdered: number;
  quantityReceived: number;
  quantityAccepted: number;
  quantityRejected: number;
  status: 'Pending' | 'Passed' | 'Failed';
  remarks?: string;
}

export interface NCR {
  id: string;
  ncrNumber: string;
  inspectionRequestId: string;
  poNumber: string;
  vendorName: string;
  issueDate: string;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  rootCause?: string;
  correctiveAction?: string;
  status: 'Open' | 'Resolved' | 'Closed';
  resolvedDate?: string;
  resolvedBy?: string;
}
