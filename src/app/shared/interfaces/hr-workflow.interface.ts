export type WorkflowStatus = 'Pending' | 'Approved' | 'Rejected' | 'In Progress';
export type WorkflowType = 'Leave Request' | 'Overtime Request' | 'Payroll Approval' | 'New Hire' | 'Transfer' | 'Promotion' | 'Resignation' | 'Termination';
export type PriorityLevel = 'Urgent' | 'High' | 'Medium' | 'Low';

export interface WorkflowInstance {
  id: string;
  type: WorkflowType;
  employeeId?: string;
  employeeName?: string;
  submittedBy: string;
  submittedAt: string;
  priority: PriorityLevel;
  status: WorkflowStatus;
  currentStep: number;
  totalSteps: number;
  description: string;
  steps: HrApprovalStep[];
}

export interface HrApprovalStep {

  stepNumber: number;
  role: string;
  assigneeName?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  actionedAt?: string;
  comments?: string;
}

export interface HrNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: 'Info' | 'Warning' | 'Approval' | 'Task';
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  action: string;
  active: boolean;
}
