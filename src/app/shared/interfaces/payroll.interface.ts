export interface PayrollRun {
  id: string;
  period: string;
  runDate: string;
  status: 'Draft' | 'Processed' | 'Paid';
  totalEmployees: number;
  totalGrossSalary: number;
}
