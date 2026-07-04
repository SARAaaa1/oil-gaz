// ==============================
// Payroll Module Interfaces
// PetroFlow ERP — HR Module
// ==============================

export type PayrollStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Paid' | 'Cancelled';
export type DeductionRule = 'Per Hour' | 'Per Day' | 'Fixed Amount' | 'None';
export type PayrollPeriod = 'Monthly' | 'Biweekly' | 'Weekly';

// ─── Salary Structure (per employee) ─────────────────────────────────────────

export interface SalaryStructure {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;

  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportationAllowance: number;
  foodAllowance: number;
  mobileAllowance: number;
  otherAllowances: number;

  // Deductions
  socialInsurance: number;        // Fixed monthly amount
  incomeTax: number;              // Fixed monthly amount
  loanDeduction: number;          // Monthly loan installment
  penaltyAmount: number;          // Fixed monthly penalty

  // Bonus
  bonusAmount: number;            // Monthly bonus

  // Rules
  overtimeRateMultiplier: number; // e.g., 1.5 = 150% of hourly rate
  lateDeductionRule: DeductionRule;
  lateDeductionAmount: number;    // Per hour or fixed
  absenceDeductionRule: DeductionRule;
  absenceDeductionAmount: number; // Per day or fixed

  // Computed
  grossSalary?: number;           // basicSalary + all allowances + bonus
  totalDeductions?: number;       // insurance + tax + loan + penalty

  status: 'Active' | 'Inactive' | 'Suspended';
  effectiveFrom: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── Payroll Run (one record per employee per month) ─────────────────────────

export interface PayrollRecord {
  id: string;
  payrollRunId: string;
  payrollNumber: string;           // e.g., PAY-2026-07-001

  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;

  // Period
  month: number;                   // 1-12
  year: number;
  periodLabel: string;             // e.g., "July 2026"

  // Attendance Summary
  workingDays: number;
  presentDays: number;
  absentDays: number;
  lateHours: number;
  earlyLeaveHours: number;
  overtimeHours: number;
  leaveDays: number;

  // Earnings
  basicSalary: number;
  housingAllowance: number;
  transportationAllowance: number;
  foodAllowance: number;
  mobileAllowance: number;
  otherAllowances: number;
  overtimePay: number;
  bonusAmount: number;
  grossSalary: number;

  // Deductions
  lateDeduction: number;
  absenceDeduction: number;
  socialInsurance: number;
  incomeTax: number;
  loanDeduction: number;
  penaltyAmount: number;
  totalDeductions: number;

  // Net
  netSalary: number;

  // Workflow
  status: PayrollStatus;
  generatedAt?: string;
  generatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  paidAt?: string;
  cancellationReason?: string;
  notes?: string;
}

// ─── Payroll Run (batch) ─────────────────────────────────────────────────────

export interface PayrollRunBatch {
  id: string;
  runNumber: string;               // e.g., RUN-2026-07
  month: number;
  year: number;
  periodLabel: string;
  departmentId?: string;
  departmentName?: string;

  totalEmployees: number;
  processedEmployees: number;
  totalGrossSalary: number;
  totalDeductions: number;
  totalNetSalary: number;

  status: PayrollStatus;
  generatedAt?: string;
  generatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  notes?: string;
}

// ─── Payroll Summary (Dashboard) ─────────────────────────────────────────────

export interface PayrollSummary {
  month: number;
  year: number;
  periodLabel: string;
  totalCost: number;
  employeesPaid: number;
  pendingCount: number;
  averageSalary: number;
  totalOvertime: number;
  totalDeductions: number;
}
