export interface Interview {
  id: string;
  candidateId: string;
  candidateName: string;
  interviewers: string[];
  scheduledDate: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  rating?: number;
  notes?: string;
  
  // Recruitment Phase 2 additions
  stage: number; // 1 to 5
  type: 'Technical' | 'HR' | 'Panel' | 'Management' | 'External';
  recruiter: string;
  interviewer: string;
  startTime: string;
  endTime: string;
  location: string;
  meetingLink?: string;
  evaluation: 'Accepted' | 'Rejected' | 'Pending' | 'Above Expectations' | 'Below Expectations' | 'Other';
}
