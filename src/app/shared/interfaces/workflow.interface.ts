// ============================================================
// OIL & GAS CORE WORKFLOW INTERFACES
// Contract → DAR → WCC → Invoice → Collection
// ============================================================

// --- SHARED TYPES ---
export type ApprovalStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ApprovalStep {
  role: string;
  approverName: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  actionDate?: string;
  comments?: string;
}

// --- 1. CONTRACTS ---
export type ContractStatus = 'Draft' | 'Active' | 'Completed' | 'Suspended' | 'Terminated';
export type ContractType = 'Daily Rate' | 'Lump Sum' | 'Unit Rate' | 'Time & Material';

export interface RateSheetItem {
  id: string;
  description: string;
  unit: string;
  rate: number;
  currency: string;
}

export interface ContractMilestone {
  id: string;
  title: string;
  dueDate: string;
  completedDate?: string;
  amount: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  clientName: string;
  clientContact: string;
  clientEmail: string;
  type: ContractType;
  status: ContractStatus;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  scope: string;
  rigId?: string;
  rigName?: string;
  projectManager: string;
  rateSheet: RateSheetItem[];
  milestones: ContractMilestone[];
  retentionPercent: number;
  paymentTerms: string;
  createdDate: string;
}

// --- 2. DAILY ACTIVITY REPORTS ---
export type DARStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected';

export interface DARMaterialUsed {
  id: string;
  itemName: string;
  quantity: number;
  uom: string;
  remarks?: string;
}

export interface DAR {
  id: string;
  darNumber: string;
  contractId: string;
  contractNumber: string;
  rigId: string;
  rigName: string;
  reportDate: string;
  shift: 'Day' | 'Night';
  status: DARStatus;
  preparedBy: string;
  // Hours breakdown
  operatingHours: number;
  standbyHours: number;
  repairHours: number;
  downtimeHours: number;
  totalHours: number;
  // Additional data
  fuelConsumption: number;        // liters
  fuelUnit: string;
  materialsUsed: DARMaterialUsed[];
  activitiesPerformed: string;
  hseIncidents: string;
  weatherConditions: string;
  remarks: string;
  attachments: string[];
  approvalWorkflow: ApprovalStep[];
  submittedDate?: string;
}

// --- 3. WORK COMPLETION CERTIFICATES ---
export type WCCStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Invoiced';

export interface WCCLineItem {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface WCC {
  id: string;
  wccNumber: string;
  contractId: string;
  contractNumber: string;
  clientName: string;
  rigName: string;
  periodFrom: string;
  periodTo: string;
  darIds: string[];
  darNumbers: string[];
  status: WCCStatus;
  lineItems: WCCLineItem[];
  subtotal: number;
  totalOperatingHours: number;
  totalStandbyHours: number;
  preparedBy: string;
  approvalWorkflow: ApprovalStep[];
  createdDate: string;
  notes?: string;
}

// --- 4. INVOICES ---
export type InvoiceStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Sent' | 'Partially Paid' | 'Paid' | 'Overdue';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  contractId: string;
  contractNumber: string;
  wccId: string;
  wccNumber: string;
  clientName: string;
  clientContact: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  // Amounts
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  retentionPercent: number;
  retentionAmount: number;
  withholdingTaxPercent: number;
  withholdingTaxAmount: number;
  totalAmount: number;
  netPayable: number;
  currency: string;
  // Tracking
  paidAmount: number;
  balanceDue: number;
  paymentTerms: string;
  approvalWorkflow: ApprovalStep[];
  createdDate: string;
  notes?: string;
}

// --- 5. COLLECTIONS ---
export type CollectionStatus = 'Pending' | 'Partially Collected' | 'Fully Collected' | 'Overdue' | 'Written Off';

export interface CollectionPayment {
  id: string;
  date: string;
  amount: number;
  method: 'Bank Transfer' | 'Check' | 'Cash' | 'Wire Transfer';
  reference: string;
  remarks?: string;
}

export interface Collection {
  id: string;
  collectionNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  contractId: string;
  contractNumber: string;
  clientName: string;
  invoiceAmount: number;
  totalCollected: number;
  outstandingBalance: number;
  currency: string;
  status: CollectionStatus;
  dueDate: string;
  payments: CollectionPayment[];
  agingDays: number;
  createdDate: string;
  notes?: string;
}
