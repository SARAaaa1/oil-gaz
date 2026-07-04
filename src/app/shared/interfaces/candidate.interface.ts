export interface CandidateLanguage {
  language: string;
  proficiency: 'Basic' | 'Intermediate' | 'Fluent' | 'Native';
}

export interface CandidateCertificate {
  name: string;
  issuer: string;
  date: string;
}

export interface CandidateTimelineEvent {
  date: string;
  action: string;
  user: string;
}

export interface CandidateAttachment {
  name: string;
  url: string;
  size: string;
  type: string;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  skills: string[];
  status: 'New' | 'Under Review' | 'Shortlisted' | 'Interviewing' | 'Offered' | 'Hired' | 'Rejected' | 'Archived';
  appliedDate: string;
  position: string;
  department: string;
  experienceYears: number;
  education: string;
  expectedSalary: number;
  availability: string;
  
  // Tab details
  bio?: string;
  languages?: CandidateLanguage[];
  certificates?: CandidateCertificate[];
  linkedInUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  notes?: string[];
  timeline?: CandidateTimelineEvent[];
  attachments?: CandidateAttachment[];
}
