export type JobTitleStatus = 'Active' | 'Inactive' | 'Draft';
export type GradeStatus = 'Active' | 'Inactive';

export interface JobGrade {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  minSalary: number;
  maxSalary: number;
  promotionLevel: number;
  status: GradeStatus;
}

export interface JobTitle {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  departmentId: string;
  departmentName?: string;
  gradeId?: string;
  gradeName?: string;
  defaultSalary?: number;
  employmentType?: string;
  status: JobTitleStatus;
  description?: string;
  responsibilities?: string;
  requiredSkills?: string[];
  minExperienceYears?: number;
  minQualification?: string;
  filledCount?: number;
  vacantCount?: number;
}
