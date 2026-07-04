export interface EmployeeDocument {
  id: string;
  name: string;
  category: 'National ID' | 'Passport' | 'Employment Contract' | 'CV' | 'Certificates' | 'Military Certificate' | 'Police Clearance' | 'Medical Report' | 'Insurance Documents' | 'Other Documents';
  fileUrl: string;
  fileSize: string;
  uploadDate: string;
  expirationDate?: string;
  status: 'Active' | 'Expiring' | 'Expired';
}

export interface EmployeeAsset {
  id: string;
  name: 'Laptop' | 'Desktop' | 'Phone' | 'SIM' | 'Vehicle' | 'Access Card' | 'Office Keys' | 'Uniform' | 'Safety Equipment';
  assetCode: string;
  assignedDate: string;
  returnedDate?: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  status: 'Assigned' | 'Returned';
}

export interface EmploymentHistoryEntry {
  id: string;
  date: string;
  type: 'Hiring' | 'Promotion' | 'Transfer' | 'Salary Increase' | 'Department Change' | 'Manager Change' | 'Suspension' | 'Termination' | 'Resignation' | 'Retirement';
  details: string;
  performedBy: string;
}

export interface Employee {
  id: string;
  employeeCode: string;
  fullName: string;
  arabicName?: string;
  email: string;
  phone: string;
  jobTitle: string;
  departmentId: string;
  status: 'Active' | 'On Leave' | 'Probation' | 'Suspended' | 'Resigned';
  joiningDate: string;
  salary: number;
  
  // Personal Info
  nationalId?: string;
  passportNumber?: string;
  firstName?: string;
  secondName?: string;
  thirdName?: string;
  fourthName?: string;
  gender?: 'Male' | 'Female';
  religion?: string;
  nationality?: string;
  birthDate?: string;
  age?: number;
  maritalStatus?: 'Single' | 'Married' | 'Divorced' | 'Widowed';
  
  // Contact Info
  address?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  linkedInUrl?: string;
  profilePhoto?: string;
  
  // Employment Info
  manager?: string;
  employmentType?: 'Full-time' | 'Part-time' | 'Contractor' | 'Temporary';
  contractType?: 'Limited' | 'Unlimited';
  probationEndDate?: string;
  costCenter?: string;
  workLocation?: string;
  shift?: string;
  insuranceNumber?: string;

  // Education & Experience
  education?: string;
  experience?: string;
  skills?: string[];
  languages?: string[];
  certificates?: string[];
  
  // Lists
  documents?: EmployeeDocument[];
  assets?: EmployeeAsset[];
  history?: EmploymentHistoryEntry[];
}
