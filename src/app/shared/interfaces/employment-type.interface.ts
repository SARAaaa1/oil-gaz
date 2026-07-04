export type EmpTypeStatus = 'Active' | 'Inactive';
export type HrContractTypeStatus = 'Active' | 'Inactive';

export interface EmploymentType {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  description?: string;
  status: EmpTypeStatus;
}

export interface HrContractType {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  noticePeriodDays: number;
  probationDays: number;
  renewable: boolean;
  maxDurationMonths?: number;
  description?: string;
  status: HrContractTypeStatus;
}
