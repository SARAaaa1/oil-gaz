export type DeptStatus = 'Active' | 'Inactive' | 'Archived';

export interface Department {
  id: string;
  code: string;
  name: string;
  arabicName?: string;
  managerId?: string;
  managerName?: string;
  parentDepartmentId?: string;
  // Phase 4 additions
  description?: string;
  status: DeptStatus;
  costCenter?: string;
  location?: string;
  phone?: string;
  email?: string;
  notes?: string;
  employeeCount?: number;
  isBudgetCenter?: boolean;
}
