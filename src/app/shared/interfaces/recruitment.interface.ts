export interface HiringRecord {
  id: string;
  candidateId: string;
  candidateName: string;
  position: string;
  department: string;
  status: 'Waiting Documents' | 'Waiting Offer' | 'Offer Sent' | 'Offer Accepted' | 'Ready For Onboarding' | 'Completed';
  employeeNumber?: string;
  offerDate?: string;
  offerSalary?: number;
  checklist: {
    contractSigned: boolean;
    iqamaSubmitted: boolean;
    medicalInsuranceCode: boolean;
    backgroundChecked: boolean;
  };
}

export interface OnboardingTask {
  id: string;
  candidateId: string;
  candidateName: string;
  taskName: 'Laptop' | 'Email Account' | 'ERP Account' | 'Mobile' | 'SIM Card' | 'Access Card' | 'Office' | 'Uniform' | 'Car' | 'Safety Equipment' | 'Medical Check' | 'Employment Contract';
  assignedDepartment: string;
  assignedTo: string;
  dueDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
  completedBy?: string;
  completedDate?: string;
  completionNotes?: string;
}
