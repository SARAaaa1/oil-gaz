export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  evaluatorName: string;
  period: string;
  score: number;
  status: 'Draft' | 'Submitted' | 'Approved';
  comments?: string;
}
