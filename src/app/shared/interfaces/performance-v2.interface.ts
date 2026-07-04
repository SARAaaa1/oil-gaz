// ======================================================
// Performance Management Interfaces
// PetroFlow ERP — HR Module
// ======================================================

export type PerformanceStatus = 'Draft' | 'In Progress' | 'Pending Approval' | 'Approved' | 'Rejected' | 'Archived';
export type PerformanceRating = 'Outstanding' | 'Excellent' | 'Very Good' | 'Good' | 'Acceptable' | 'Needs Improvement' | 'Unsatisfactory';
export type GoalStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Cancelled' | 'On Hold';
export type GoalPriority = 'Critical' | 'High' | 'Medium' | 'Low';
export type CompetencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
export type CompetencyGap = 'No Gap' | 'Minor' | 'Moderate' | 'Critical';
export type EvalPeriod = 'Q1 2026' | 'Q2 2026' | 'Q3 2026' | 'Q4 2026' | 'Annual 2025' | 'Annual 2026';

// ─── Evaluation Criterion ───────────────────────────────────────────────────
export interface EvalCriterion {
  id: string;
  name: string;
  nameAr?: string;
  weight: number;        // percentage 0-100
  minScore: number;
  maxScore: number;
  allowComments: boolean;
  score?: number;        // filled during evaluation
  comments?: string;
}

// ─── Evaluation Template ────────────────────────────────────────────────────
export interface EvalTemplate {
  id: string;
  name: string;
  description?: string;
  period: EvalPeriod;
  departmentId?: string;
  departmentName?: string;
  jobLevel?: string;
  criteria: EvalCriterion[];
  allowSelfEvaluation: boolean;
  approvalRequired: boolean;
  status: 'Active' | 'Archived' | 'Draft';
  createdAt?: string;
  createdBy?: string;
}

// ─── Performance Evaluation ─────────────────────────────────────────────────
export interface PerformanceEval {
  id: string;
  evalNumber: string;          // e.g. EVAL-2026-Q2-001
  templateId?: string;

  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentId?: string;
  departmentName?: string;
  jobTitle?: string;
  managerId?: string;
  managerName?: string;
  hireDate?: string;

  period: EvalPeriod;
  evalDate?: string;

  // Criteria scores (section keys mapped to scores)
  technicalScore: number;
  qualityScore: number;
  productivityScore: number;
  communicationScore: number;
  leadershipScore: number;
  problemSolvingScore: number;
  disciplineScore: number;
  attendanceScore: number;
  teamworkScore: number;
  innovationScore: number;
  safetyScore: number;

  // Calculated
  overallScore: number;        // weighted average 0-100
  finalRating: PerformanceRating;

  // Comments
  finalComments?: string;
  employeeComments?: string;
  managerRecommendation?: string;

  // Workflow
  status: PerformanceStatus;
  managerApprovedAt?: string;
  hrApprovedAt?: string;
  hrApprovedBy?: string;
  rejectionReason?: string;
  createdAt?: string;
}

// ─── Performance Goal ────────────────────────────────────────────────────────
export interface PerformanceGoal {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;

  title: string;
  description?: string;
  category: 'Operational' | 'Development' | 'Strategic' | 'Financial' | 'Safety' | 'Quality';
  priority: GoalPriority;
  weight: number;

  startDate: string;
  endDate: string;
  period: EvalPeriod;

  targetValue: number;
  currentProgress: number;
  completionPct: number;

  status: GoalStatus;
  comments?: string;
  updatedAt?: string;
}

// ─── Competency Record ───────────────────────────────────────────────────────
export interface CompetencyRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName?: string;
  jobTitle?: string;

  competencyType: 'Technical' | 'Management' | 'Leadership' | 'Communication' | 'Planning' | 'Safety' | 'Customer Service' | 'Languages' | 'Software Skills' | 'Certification';
  competencyName: string;

  requiredLevel: CompetencyLevel;
  currentLevel: CompetencyLevel;
  gap: CompetencyGap;
  trainingNeeded: boolean;
  trainingCourse?: string;
  assessedAt?: string;
}

// ─── Performance Summary (for Results page) ──────────────────────────────────
export interface PerformanceSummary {
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  jobTitle?: string;

  // 3-year history
  history: { year: number; period: string; score: number; rating: PerformanceRating }[];

  // Current stats
  latestScore: number;
  latestRating: PerformanceRating;
  deptAverage: number;
  companyAverage: number;
  deptRank: number;

  // Radar scores (latest)
  radarScores: {
    technical: number;
    quality: number;
    productivity: number;
    communication: number;
    leadership: number;
    problemSolving: number;
    discipline: number;
    attendance: number;
    teamwork: number;
    innovation: number;
    safety: number;
  };

  strengths: string[];
  weaknesses: string[];
  recommendedTraining: string[];
  promotionRecommended: boolean;
  salaryIncreaseRecommended: boolean;
  bonusRecommended: boolean;
  pipRequired: boolean;
}
