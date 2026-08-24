import { Injectable, signal, computed, inject } from '@angular/core';
import { 
  Employee, Candidate, Interview, Department, AttendanceRecord, AttendanceException,
  LeaveRequest, PayrollRun, PerformanceEvaluation, HrRole, HrPermission,
  HiringRecord, OnboardingTask, EmployeeDocument, EmployeeAsset,
  JobTitle, JobGrade, WorkLocation, EmploymentType, HrContractType,
  Shift, WorkSchedule, OvertimeRequest, PermissionRequest, BusinessTrip, AttendanceImportResult,
  SalaryStructure, PayrollRecord,
  EvalTemplate, PerformanceEval, PerformanceGoal, CompetencyRecord, PerformanceRating
} from '../../../shared/interfaces';
import { NotificationService } from '../../../core/services/notification.service';
import { AuditService } from '../../../core/services/audit.service';

@Injectable({
  providedIn: 'root'
})
export class HrMockService {
  public readonly notify = inject(NotificationService);
  private readonly audit = inject(AuditService);

  // --- Core Signals ---
  readonly employees = signal<Employee[]>([
    {
      id: 'emp1',
      employeeCode: 'EMP-2026-001',
      fullName: 'Ahmad Al-Dosari',
      arabicName: 'أحمد الدوسري',
      email: 'a.dosari@petroflow.com',
      phone: '+966-50-1122334',
      jobTitle: 'Senior Drilling Engineer',
      departmentId: 'dept2',
      status: 'Active',
      joiningDate: '2020-03-15',
      salary: 18500,
      
      nationalId: '1099223344',
      passportNumber: 'N1234567',
      firstName: 'Ahmad',
      secondName: 'Saleh',
      thirdName: 'Ali',
      fourthName: 'Al-Dosari',
      gender: 'Male',
      religion: 'Islam',
      nationality: 'Saudi Arabia',
      birthDate: '1988-05-12',
      age: 38,
      maritalStatus: 'Married',
      address: 'King Khalid Road',
      city: 'Khobar',
      country: 'Saudi Arabia',
      emergencyContactName: 'Saleh Al-Dosari',
      emergencyContactPhone: '+966-50-9988776',
      linkedInUrl: 'https://linkedin.com/in/ahmad-dosari',
      
      manager: 'Operations Manager',
      employmentType: 'Full-time',
      contractType: 'Unlimited',
      probationEndDate: '2020-06-15',
      costCenter: 'CC-OPS-DRILL',
      workLocation: 'Offshore Rig Alpha',
      shift: '12 Hours Rotary Shift',
      insuranceNumber: 'INS-88772',
      
      education: 'B.Sc. Petroleum Engineering (KFUPM)',
      experience: '12 Years at Aramco & Nabors',
      skills: ['Drilling Operations', 'BOP Safety', 'Rotary Rigs', 'Team Leadership'],
      languages: ['Arabic', 'English'],
      certificates: ['IWCF Level 4', 'NEBOSH Safety Certificate'],
      
      documents: [
        {
          id: 'doc1_1',
          name: 'National ID Card',
          category: 'National ID',
          fileUrl: '/assets/docs/national_id.pdf',
          fileSize: '180 KB',
          uploadDate: '2020-03-15',
          expirationDate: '2028-12-31',
          status: 'Active'
        },
        {
          id: 'doc1_2',
          name: 'Employment Contract',
          category: 'Employment Contract',
          fileUrl: '/assets/docs/contract.pdf',
          fileSize: '1.2 MB',
          uploadDate: '2020-03-15',
          status: 'Active'
        }
      ],
      assets: [
        {
          id: 'ast1_1',
          name: 'Laptop',
          assetCode: 'ASSET-LP-012',
          assignedDate: '2020-03-15',
          condition: 'Excellent',
          status: 'Assigned'
        },
        {
          id: 'ast1_2',
          name: 'Access Card',
          assetCode: 'ASSET-AC-088',
          assignedDate: '2020-03-15',
          condition: 'Excellent',
          status: 'Assigned'
        }
      ],
      history: [
        {
          id: 'h1_1',
          date: '2020-03-15',
          type: 'Hiring',
          details: 'Hired as Drilling Engineer with Basic Salary 15,000 SAR.',
          performedBy: 'Layla Al-Otaibi'
        },
        {
          id: 'h1_2',
          date: '2023-01-01',
          type: 'Promotion',
          details: 'Promoted to Senior Drilling Engineer with Salary increase to 18,500 SAR.',
          performedBy: 'HR Committee'
        }
      ]
    },
    {
      id: 'emp2',
      employeeCode: 'EMP-2026-002',
      fullName: 'Layla Al-Otaibi',
      arabicName: 'ليلى العتيبي',
      email: 'l.otaibi@petroflow.com',
      phone: '+966-55-2233445',
      jobTitle: 'HR Specialist',
      departmentId: 'dept1',
      status: 'Active',
      joiningDate: '2022-06-01',
      salary: 10500,
      
      nationalId: '1088443322',
      passportNumber: 'N7766554',
      firstName: 'Layla',
      secondName: 'Mohammed',
      thirdName: 'Saeed',
      fourthName: 'Al-Otaibi',
      gender: 'Female',
      religion: 'Islam',
      nationality: 'Saudi Arabia',
      birthDate: '1992-09-24',
      age: 34,
      maritalStatus: 'Single',
      address: 'Olaya District',
      city: 'Riyadh',
      country: 'Saudi Arabia',
      emergencyContactName: 'Mohammed Al-Otaibi',
      emergencyContactPhone: '+966-55-1122998',
      
      manager: 'HR Director',
      employmentType: 'Full-time',
      contractType: 'Unlimited',
      probationEndDate: '2022-09-01',
      costCenter: 'CC-ADMIN-HR',
      workLocation: 'Riyadh HQ Office',
      shift: '8 Hours Normal Shift',
      insuranceNumber: 'INS-11223',
      
      education: 'B.Sc. Human Resource Management',
      experience: '6 Years in Talent Acquisition',
      skills: ['Recruitment', 'SAP SuccessFactors', 'Conflict Resolution'],
      languages: ['Arabic', 'English'],
      certificates: ['CIPD Level 5'],
      
      documents: [
        {
          id: 'doc2_1',
          name: 'Passport Copy',
          category: 'Passport',
          fileUrl: '/assets/docs/passport.pdf',
          fileSize: '320 KB',
          uploadDate: '2022-06-01',
          expirationDate: '2026-07-28', // Expiring in 25 days!
          status: 'Expiring'
        }
      ],
      assets: [
        {
          id: 'ast2_1',
          name: 'Phone',
          assetCode: 'ASSET-PH-090',
          assignedDate: '2022-06-01',
          condition: 'Good',
          status: 'Assigned'
        }
      ],
      history: [
        {
          id: 'h2_1',
          date: '2022-06-01',
          type: 'Hiring',
          details: 'Hired as HR Specialist with Basic Salary 10,500 SAR.',
          performedBy: 'HR Director'
        }
      ]
    },
    {
      id: 'emp3',
      employeeCode: 'EMP-2026-003',
      fullName: 'John Smith',
      arabicName: 'جون سميث',
      email: 'j.smith@petroflow.com',
      phone: '+966-59-9988776',
      jobTitle: 'HSE Safety Inspector',
      departmentId: 'dept3',
      status: 'On Leave',
      joiningDate: '2024-01-10',
      salary: 14000,
      
      nationalId: '2233445566',
      passportNumber: 'U9988223',
      firstName: 'John',
      secondName: 'Edward',
      thirdName: 'Robert',
      fourthName: 'Smith',
      gender: 'Male',
      religion: 'Christianity',
      nationality: 'United States',
      birthDate: '1985-11-30',
      age: 41,
      maritalStatus: 'Married',
      address: 'Aramco Camp',
      city: 'Dhahran',
      country: 'Saudi Arabia',
      emergencyContactName: 'Jane Smith',
      emergencyContactPhone: '+1-555-0199',
      
      manager: 'HSE Manager',
      employmentType: 'Full-time',
      contractType: 'Limited',
      probationEndDate: '2024-04-10',
      costCenter: 'CC-HSE-SAFETY',
      workLocation: 'Dammam Branch Office',
      shift: '8 Hours Normal Shift',
      insuranceNumber: 'INS-99001',
      
      education: 'B.Sc. Safety Management (OSHA)',
      experience: '15 Years in Oil & Gas Safety Inspections',
      skills: ['Incident Investigation', 'OSHA Compliance', 'HSE Auditing'],
      languages: ['English'],
      certificates: ['OSHA 30-Hour Card', 'ASP (Associate Safety Professional)'],
      
      documents: [
        {
          id: 'doc3_1',
          name: 'Medical Report',
          category: 'Medical Report',
          fileUrl: '/assets/docs/medical.pdf',
          fileSize: '410 KB',
          uploadDate: '2024-01-10',
          expirationDate: '2025-01-10', // Expired!
          status: 'Expired'
        }
      ],
      assets: [
        {
          id: 'ast3_1',
          name: 'Safety Equipment',
          assetCode: 'ASSET-SE-552',
          assignedDate: '2024-01-10',
          condition: 'Good',
          status: 'Assigned'
        }
      ],
      history: [
        {
          id: 'h3_1',
          date: '2024-01-10',
          type: 'Hiring',
          details: 'Hired as HSE Safety Inspector with Salary 14,000 SAR.',
          performedBy: 'Layla Al-Otaibi'
        }
      ]
    }
  ]);

  private readonly DEFAULT_CANDIDATES: Candidate[] = [
    {
      id: 'cand1',
      fullName: 'Yousef Al-Harbi',
      email: 'y.harbi@gmail.com',
      phone: '+966-54-5566778',
      skills: ['Drilling', 'Rig Control', 'Safety Auditing'],
      status: 'Interviewing',
      appliedDate: '2026-06-12',
      position: 'Drilling Lead Supervisor',
      department: 'Engineering',
      experienceYears: 6,
      education: 'B.Sc. Petroleum Engineering',
      expectedSalary: 16000,
      availability: 'Immediate',
      bio: 'Energetic drilling professional with 6 years experience in offshore operations.',
      languages: [
        { language: 'Arabic', proficiency: 'Native' },
        { language: 'English', proficiency: 'Fluent' }
      ],
      certificates: [
        { name: 'IWCF Level 4', issuer: 'IWCF', date: '2025-04-10' }
      ],
      linkedInUrl: 'https://linkedin.com/in/yousef-harbi',
      portfolioUrl: 'https://portfolio.petroflow.com/yousef',
      cvUrl: '/assets/docs/cv-sample.pdf',
      notes: ['Candidate has solid field answers, very knowledgeable on safety.'],
      timeline: [
        { date: '2026-06-12', action: 'Application Created', user: 'System Website' },
        { date: '2026-06-14', action: 'Candidate Reviewed', user: 'Layla Al-Otaibi' }
      ],
      attachments: [
        { name: 'cv-sample.pdf', url: '/assets/docs/cv-sample.pdf', size: '245 KB', type: 'PDF' }
      ]
    },
    {
      id: 'cand2',
      fullName: 'Mariam Al-Ghamdi',
      email: 'm.ghamdi@outlook.com',
      phone: '+966-56-1122998',
      skills: ['Corporate Finance', 'Excel', 'Taxes', 'VAT compliance'],
      status: 'Offered',
      appliedDate: '2026-06-18',
      position: 'Senior Finance Accountant',
      department: 'Finance',
      experienceYears: 8,
      education: 'M.Sc. Accounting & Audit',
      expectedSalary: 13500,
      availability: '1 Month',
      bio: 'Detail-oriented VAT specialist and senior accountant.',
      languages: [
        { language: 'Arabic', proficiency: 'Native' },
        { language: 'English', proficiency: 'Fluent' }
      ],
      certificates: [
        { name: 'SOCPA', issuer: 'SOCPA Org', date: '2023-09-15' }
      ],
      linkedInUrl: 'https://linkedin.com/in/mariam-ghamdi',
      cvUrl: '/assets/docs/cv-sample.pdf',
      notes: ['Strong technical accountant, SOCPA holder.'],
      timeline: [
        { date: '2026-06-18', action: 'Application Created', user: 'System Website' },
        { date: '2026-06-20', action: 'Candidate Reviewed', user: 'Layla Al-Otaibi' },
        { date: '2026-06-25', action: 'HR Override - Pushed to Hiring', user: 'HR Director' }
      ],
      attachments: [
        { name: 'cv-sample.pdf', url: '/assets/docs/cv-sample.pdf', size: '190 KB', type: 'PDF' }
      ]
    },
    {
      id: 'cand3',
      fullName: 'Fahad Al-Malki',
      email: 'f.malki@gmail.com',
      phone: '+966-53-4455667',
      skills: ['Safety Inspections', 'OSHA standards', 'First Aid'],
      status: 'New',
      appliedDate: '2026-07-02',
      position: 'HSE Safety Inspector',
      department: 'HSE',
      experienceYears: 3,
      education: 'B.Sc. Occupational Health',
      expectedSalary: 9500,
      availability: 'Immediate',
      bio: 'Dedicated junior HSE specialist.',
      timeline: [
        { date: '2026-07-02', action: 'Application Created', user: 'System Website' }
      ]
    }
  ];

  private loadSavedCandidates(): Candidate[] {
    try {
      const saved = localStorage.getItem('petroflow_candidates');
      return saved ? JSON.parse(saved) : this.DEFAULT_CANDIDATES;
    } catch {
      return this.DEFAULT_CANDIDATES;
    }
  }

  readonly candidates = signal<Candidate[]>(this.loadSavedCandidates());

  readonly interviews = signal<Interview[]>([
    {
      id: 'int1',
      candidateId: 'cand1',
      candidateName: 'Yousef Al-Harbi',
      interviewers: ['Ahmad Al-Dosari'],
      scheduledDate: '2026-06-20',
      status: 'Completed',
      rating: 4,
      notes: 'Passed technical basics with high scores.',
      stage: 1,
      type: 'Technical',
      recruiter: 'Layla Al-Otaibi',
      interviewer: 'Ahmad Al-Dosari',
      startTime: '10:00',
      endTime: '11:00',
      location: 'Dammam Branch Office',
      evaluation: 'Accepted'
    }
  ]);

  readonly hiringRecords = signal<HiringRecord[]>([
    {
      id: 'hir1',
      candidateId: 'cand2',
      candidateName: 'Mariam Al-Ghamdi',
      position: 'Senior Finance Accountant',
      department: 'Finance',
      status: 'Offer Sent',
      offerDate: '2026-06-26',
      offerSalary: 13500,
      checklist: {
        contractSigned: false,
        iqamaSubmitted: true,
        medicalInsuranceCode: true,
        backgroundChecked: true
      }
    }
  ]);

  readonly onboardingTasks = signal<OnboardingTask[]>([
    {
      id: 'onb1',
      candidateId: 'cand2',
      candidateName: 'Mariam Al-Ghamdi',
      taskName: 'Employment Contract',
      assignedDepartment: 'HR',
      assignedTo: 'Layla Al-Otaibi',
      dueDate: '2026-07-05',
      status: 'In Progress'
    },
    {
      id: 'onb2',
      candidateId: 'cand2',
      candidateName: 'Mariam Al-Ghamdi',
      taskName: 'ERP Account',
      assignedDepartment: 'IT Support',
      assignedTo: 'Faisal Al-Qahtani',
      dueDate: '2026-07-05',
      status: 'Not Started'
    }
  ]);

  readonly departments = signal<Department[]>([
    { id: 'dept1', code: 'HR', name: 'Human Resources', arabicName: 'الموارد البشرية', managerName: 'Layla Al-Otaibi', status: 'Active', costCenter: 'CC-ADMIN-HR', location: 'Riyadh HQ', phone: '+966-11-5551001', email: 'hr@petroflow.com', employeeCount: 4, isBudgetCenter: true, description: 'Manages all HR operations, recruitment, payroll and employee welfare.' },
    { id: 'dept2', code: 'ENG', name: 'Engineering', arabicName: 'الهندسة', managerName: 'Ahmad Al-Dosari', status: 'Active', costCenter: 'CC-OPS-ENG', location: 'Dammam Branch', phone: '+966-13-5552002', email: 'eng@petroflow.com', employeeCount: 12, isBudgetCenter: true, description: 'Responsible for all engineering design, drilling and project execution.' },
    { id: 'dept3', code: 'HSE', name: 'Health, Safety & Environment', arabicName: 'السلامة والصحة والبيئة', managerName: 'John Smith', status: 'Active', costCenter: 'CC-OPS-HSE', location: 'Offshore Rig Alpha', phone: '+966-13-5553003', email: 'hse@petroflow.com', employeeCount: 6, isBudgetCenter: false, description: 'Ensures compliance with all health, safety, and environmental regulations.' },
    { id: 'dept4', code: 'FIN', name: 'Finance', arabicName: 'المالية', managerName: 'Mariam Al-Ghamdi', status: 'Active', costCenter: 'CC-ADMIN-FIN', location: 'Riyadh HQ', phone: '+966-11-5554004', email: 'finance@petroflow.com', employeeCount: 7, isBudgetCenter: true, description: 'Manages all financial transactions, accounting, reporting and budgets.' },
    { id: 'dept5', code: 'OPS', name: 'Operations', arabicName: 'العمليات', managerName: 'Tariq Al-Mutairi', status: 'Active', costCenter: 'CC-OPS-MAIN', location: 'Khobar Office', phone: '+966-13-5555005', email: 'ops@petroflow.com', employeeCount: 18, isBudgetCenter: true, description: 'Manages field operations, logistics and daily production activities.' },
    { id: 'dept6', code: 'IT', name: 'Information Technology', arabicName: 'تقنية المعلومات', managerName: 'Faisal Al-Qahtani', status: 'Active', costCenter: 'CC-ADMIN-IT', location: 'Riyadh HQ', phone: '+966-11-5556006', email: 'it@petroflow.com', employeeCount: 5, isBudgetCenter: false, description: 'Provides technology infrastructure, ERP systems and IT support.' },
    { id: 'dept7', code: 'PROC', name: 'Procurement', arabicName: 'المشتريات', managerName: 'Sami Al-Zahrani', status: 'Active', costCenter: 'CC-ADMIN-PROC', location: 'Riyadh HQ', phone: '+966-11-5557007', email: 'procurement@petroflow.com', employeeCount: 4, isBudgetCenter: true, description: 'Handles all vendor sourcing, purchasing and supply chain management.' },
    { id: 'dept8', code: 'LOG', name: 'Logistics', arabicName: 'اللوجستيات', parentDepartmentId: 'dept5', managerName: 'Omar Al-Rashidi', status: 'Inactive', costCenter: 'CC-OPS-LOG', location: 'Dammam Branch', phone: '+966-13-5558008', email: 'logistics@petroflow.com', employeeCount: 3, isBudgetCenter: false, description: 'Coordinates transportation, warehousing and materials distribution.' }
  ]);

  readonly attendanceRecords = signal<AttendanceRecord[]>([
    // Today — 2026-07-03
    { id: 'att001', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentId: 'dept2', departmentName: 'Engineering', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-03', clockIn: '07:58', clockOut: '17:03', workingHours: 8.9, lateMinutes: 0, earlyLeaveMinutes: 0, overtimeHours: 0.9, status: 'Present', source: 'ZKTeco' },
    { id: 'att002', employeeId: 'emp2', employeeName: 'Layla Al-Otaibi', employeeNumber: 'EMP-002', departmentId: 'dept1', departmentName: 'Human Resources', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-03', clockIn: '08:22', clockOut: '17:00', workingHours: 8.0, lateMinutes: 22, earlyLeaveMinutes: 0, overtimeHours: 0, status: 'Late', source: 'ZKTeco' },
    { id: 'att003', employeeId: 'emp3', employeeName: 'John Smith', employeeNumber: 'EMP-003', departmentId: 'dept3', departmentName: 'HSE', shiftId: 'sh2', shiftName: '12Hr Rotary', date: '2026-07-03', status: 'Leave', source: 'System' },
    { id: 'att004', employeeId: 'emp4', employeeName: 'Mariam Al-Ghamdi', employeeNumber: 'EMP-004', departmentId: 'dept4', departmentName: 'Finance', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-03', clockIn: '08:00', clockOut: '17:00', workingHours: 8.0, lateMinutes: 0, earlyLeaveMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att005', employeeId: 'emp5', employeeName: 'Tariq Al-Mutairi', employeeNumber: 'EMP-005', departmentId: 'dept5', departmentName: 'Operations', shiftId: 'sh3', shiftName: 'Night 12Hr', date: '2026-07-03', clockIn: '20:05', clockOut: '08:00', workingHours: 11.9, lateMinutes: 5, earlyLeaveMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att006', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', employeeNumber: 'EMP-006', departmentId: 'dept6', departmentName: 'IT', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-03', status: 'Absent', source: 'System' },
    { id: 'att007', employeeId: 'emp7', employeeName: 'Sami Al-Zahrani', employeeNumber: 'EMP-007', departmentId: 'dept7', departmentName: 'Procurement', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-03', clockIn: '08:01', clockOut: '14:30', workingHours: 6.5, lateMinutes: 0, earlyLeaveMinutes: 30, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att008', employeeId: 'emp8', employeeName: 'Omar Al-Rashidi', employeeNumber: 'EMP-008', departmentId: 'dept5', departmentName: 'Operations', shiftId: 'sh4', shiftName: 'Flexible', date: '2026-07-03', clockIn: '09:15', clockOut: '18:20', workingHours: 8.1, lateMinutes: 0, earlyLeaveMinutes: 0, overtimeHours: 0.3, status: 'Remote', source: 'Manual' },
    // Yesterday — 2026-07-02
    { id: 'att009', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentId: 'dept2', departmentName: 'Engineering', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-02', clockIn: '08:00', clockOut: '17:30', workingHours: 9.0, lateMinutes: 0, overtimeHours: 1.0, status: 'Present', source: 'ZKTeco' },
    { id: 'att010', employeeId: 'emp2', employeeName: 'Layla Al-Otaibi', employeeNumber: 'EMP-002', departmentId: 'dept1', departmentName: 'Human Resources', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-02', clockIn: '07:55', clockOut: '17:00', workingHours: 8.1, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att011', employeeId: 'emp3', employeeName: 'John Smith', employeeNumber: 'EMP-003', departmentId: 'dept3', departmentName: 'HSE', shiftId: 'sh2', shiftName: '12Hr Rotary', date: '2026-07-02', clockIn: '06:00', clockOut: '18:00', workingHours: 12.0, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att012', employeeId: 'emp4', employeeName: 'Mariam Al-Ghamdi', employeeNumber: 'EMP-004', departmentId: 'dept4', departmentName: 'Finance', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-02', clockIn: '08:35', clockOut: '17:05', workingHours: 7.5, lateMinutes: 35, overtimeHours: 0, status: 'Late', source: 'ZKTeco' },
    { id: 'att013', employeeId: 'emp5', employeeName: 'Tariq Al-Mutairi', employeeNumber: 'EMP-005', departmentId: 'dept5', departmentName: 'Operations', shiftId: 'sh3', shiftName: 'Night 12Hr', date: '2026-07-02', clockIn: '20:00', clockOut: '08:05', workingHours: 12.1, lateMinutes: 0, overtimeHours: 0.1, status: 'Present', source: 'ZKTeco' },
    { id: 'att014', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', employeeNumber: 'EMP-006', departmentId: 'dept6', departmentName: 'IT', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-02', clockIn: '08:00', clockOut: '17:00', workingHours: 8.0, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att015', employeeId: 'emp7', employeeName: 'Sami Al-Zahrani', employeeNumber: 'EMP-007', departmentId: 'dept7', departmentName: 'Procurement', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-02', status: 'Business Trip', source: 'System' },
    { id: 'att016', employeeId: 'emp8', employeeName: 'Omar Al-Rashidi', employeeNumber: 'EMP-008', departmentId: 'dept5', departmentName: 'Operations', shiftId: 'sh4', shiftName: 'Flexible', date: '2026-07-02', clockIn: '08:50', clockOut: '17:00', workingHours: 8.2, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    // 2026-07-01
    { id: 'att017', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentId: 'dept2', departmentName: 'Engineering', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-01', clockIn: '08:05', clockOut: '17:00', workingHours: 7.9, lateMinutes: 5, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att018', employeeId: 'emp2', employeeName: 'Layla Al-Otaibi', employeeNumber: 'EMP-002', departmentId: 'dept1', departmentName: 'Human Resources', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-01', status: 'Absent', source: 'System' },
    { id: 'att019', employeeId: 'emp3', employeeName: 'John Smith', employeeNumber: 'EMP-003', departmentId: 'dept3', departmentName: 'HSE', shiftId: 'sh2', shiftName: '12Hr Rotary', date: '2026-07-01', clockIn: '06:00', clockOut: '18:00', workingHours: 12.0, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
    { id: 'att020', employeeId: 'emp4', employeeName: 'Mariam Al-Ghamdi', employeeNumber: 'EMP-004', departmentId: 'dept4', departmentName: 'Finance', shiftId: 'sh1', shiftName: '8Hr Normal', date: '2026-07-01', clockIn: '08:00', clockOut: '17:00', workingHours: 8.0, lateMinutes: 0, overtimeHours: 0, status: 'Present', source: 'ZKTeco' },
  ]);


  readonly leaveRequests = signal<LeaveRequest[]>([
    {
      id: 'lv1',
      employeeId: 'emp3',
      employeeName: 'John Smith',
      leaveType: 'Annual',
      startDate: '2026-07-10',
      endDate: '2026-07-24',
      status: 'Pending',
      reason: 'Annual family vacation'
    }
  ]);

  readonly payrollRuns = signal<PayrollRun[]>([
    {
      id: 'pay1',
      period: 'June 2026',
      runDate: '2026-06-25',
      status: 'Processed',
      totalEmployees: 3,
      totalGrossSalary: 43000
    }
  ]);

  readonly evaluations = signal<PerformanceEvaluation[]>([
    {
      id: 'eval1',
      employeeId: 'emp2',
      employeeName: 'Layla Al-Otaibi',
      evaluatorName: 'Financial Director',
      period: 'H1 2026',
      score: 92,
      status: 'Approved',
      comments: 'Excellent performance in managing recruits.'
    }
  ]);

  readonly roles = signal<HrRole[]>([
    { id: 'role1', name: 'HR Manager', description: 'Full access to employee and payroll administration' },
    { id: 'role2', name: 'HR Officer', description: 'Access to recruitment, employees and attendance tracking' }
  ]);

  readonly permissions = signal<HrPermission[]>([
    { id: 'perm1', code: 'hr:write_employees', description: 'Can add and modify employee records' },
    { id: 'perm2', code: 'hr:process_payroll', description: 'Can compute and approve payslips' }
  ]);

  // --- Business Logic Methods (Zero Backend, Signal State Mutations) ---

  private saveCandidates(list: Candidate[]) {
    try {
      localStorage.setItem('petroflow_candidates', JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save candidates to localStorage', e);
    }
  }

  submitApplication(candidateData: Partial<Candidate>): boolean {
    const email = candidateData.email;
    const position = candidateData.position;

    // Check duplicate: Same email cannot apply twice for same position
    const duplicate = this.candidates().find(
      c => c.email.toLowerCase() === email?.toLowerCase() && c.position.toLowerCase() === position?.toLowerCase()
    );

    if (duplicate) {
      this.notify.danger('hr.common.msg_duplicate_err', 'Duplicate application detected for this position.');
      return false;
    }

    const newId = `cand-${Math.random().toString(36).substring(2, 9)}`;
    const newCand: Candidate = {
      id: newId,
      fullName: candidateData.fullName || 'Candidate Name',
      email: email || '',
      phone: candidateData.phone || '',
      skills: candidateData.skills || [],
      status: 'New',
      appliedDate: new Date().toISOString().split('T')[0],
      position: position || 'Drilling Specialist',
      department: candidateData.department || 'Operations',
      experienceYears: candidateData.experienceYears || 0,
      education: candidateData.education || 'High School',
      expectedSalary: candidateData.expectedSalary || 5000,
      availability: candidateData.availability || 'Immediate',
      timeline: [{ date: new Date().toISOString().split('T')[0], action: 'Application Created', user: 'System Website' }],
      notes: [],
      attachments: candidateData.attachments || []
    };

    this.candidates.update(list => {
      const next = [...list, newCand];
      this.saveCandidates(next);
      return next;
    });
    this.notify.success('hr.common.msg_app_submitted', 'Application submitted successfully.');
    this.audit.log('Create', 'HR', 'Candidate', newId, 'Draft', 'New', 'Job Application registered');
    return true;
  }

  moveToCandidates(candidateId: string) {
    this.candidates.update(list => {
      const next: Candidate[] = list.map(c => {
        if (c.id === candidateId) {
          const updatedTimeline = [...(c.timeline || []), { date: new Date().toISOString().split('T')[0], action: 'Candidate Reviewed', user: 'Layla Al-Otaibi' }];
          return { ...c, status: 'Under Review' as Candidate['status'], timeline: updatedTimeline };
        }
        return c;
      });
      this.saveCandidates(next);
      return next;
    });
    this.notify.info('hr.common.msg_moved_to_candidates', 'Moved candidate to Under Review status.');
  }

  rejectCandidate(candidateId: string) {
    this.candidates.update(list => {
      const next: Candidate[] = list.map(c => {
        if (c.id === candidateId) {
          const updatedTimeline = [...(c.timeline || []), { date: new Date().toISOString().split('T')[0], action: 'Candidate Rejected', user: 'Layla Al-Otaibi' }];
          return { ...c, status: 'Rejected' as Candidate['status'], timeline: updatedTimeline };
        }
        return c;
      });
      this.saveCandidates(next);
      return next;
    });
    this.notify.warning('hr.common.msg_candidate_rejected', 'Candidate status updated to Rejected.');
  }

  scheduleInterview(candId: string, stage: number, type: Interview['type'], interviewer: string, date: string, start: string, end: string, loc: string, link?: string): boolean {
    // Sequence constraint: Stage N requires Stage N-1 completed and Accepted
    if (stage > 1) {
      const prevStage = this.interviews().find(i => i.candidateId === candId && i.stage === (stage - 1));
      if (!prevStage || prevStage.status !== 'Completed' || (prevStage.evaluation !== 'Accepted' && prevStage.evaluation !== 'Above Expectations')) {
        this.notify.danger('hr.common.msg_interview_lock_err', 'Cannot schedule this stage until the previous stage is Completed and Approved.');
        return false;
      }
    }

    const candName = this.candidates().find(c => c.id === candId)?.fullName || 'Candidate';
    const newId = `int-${Math.random().toString(36).substring(2, 9)}`;
    const newInt: Interview = {
      id: newId,
      candidateId: candId,
      candidateName: candName,
      interviewers: [interviewer],
      scheduledDate: date,
      status: 'Scheduled',
      stage,
      type,
      recruiter: 'Layla Al-Otaibi',
      interviewer,
      startTime: start,
      endTime: end,
      location: loc,
      meetingLink: link,
      evaluation: 'Pending'
    };

    this.interviews.update(list => [...list, newInt]);
    this.candidates.update(list => 
      list.map(c => {
        if (c.id === candId) {
          const updatedTimeline = [...(c.timeline || []), { date: new Date().toISOString().split('T')[0], action: `Interview Stage ${stage} Scheduled`, user: 'Layla Al-Otaibi' }];
          return { ...c, status: 'Interviewing', timeline: updatedTimeline };
        }
        return c;
      })
    );

    this.notify.addNotification('hr.common.notif_interview_title', 'Scheduled interview stage ' + stage + ' for ' + candName, 'info');
    return true;
  }

  evaluateInterview(intId: string, evaluation: Interview['evaluation'], score: number, note: string) {
    let candId = '';
    let stage = 1;

    this.interviews.update(list => 
      list.map(i => {
        if (i.id === intId) {
          candId = i.candidateId;
          stage = i.stage;
          return { ...i, status: 'Completed', evaluation, rating: score, notes: note };
        }
        return i;
      })
    );

    // Update candidate timeline
    this.candidates.update(list => 
      list.map(c => {
        if (c.id === candId) {
          const updatedTimeline = [...(c.timeline || []), { date: new Date().toISOString().split('T')[0], action: `Interview Stage ${stage} Completed - ${evaluation}`, user: 'Layla Al-Otaibi' }];
          const newStatus = evaluation === 'Rejected' ? 'Rejected' : c.status;
          return { ...c, status: newStatus, timeline: updatedTimeline };
        }
        return c;
      })
    );

    // Automation rule: If Stage 5 Approved -> Automatically move to Hiring
    if (stage === 5 && (evaluation === 'Accepted' || evaluation === 'Above Expectations')) {
      this.triggerHiring(candId);
    }
  }

  overrideHiring(candId: string) {
    this.candidates.update(list => 
      list.map(c => {
        if (c.id === candId) {
          const updatedTimeline = [...(c.timeline || []), { date: new Date().toISOString().split('T')[0], action: 'HR Override - Pushed to Hiring', user: 'HR Director' }];
          return { ...c, status: 'Offered', timeline: updatedTimeline };
        }
        return c;
      })
    );
    this.triggerHiring(candId);
  }

  private triggerHiring(candId: string) {
    const cand = this.candidates().find(c => c.id === candId);
    if (!cand) return;

    // Check if hiring record already exists
    const exists = this.hiringRecords().find(h => h.candidateId === candId);
    if (exists) return;

    const newHiring: HiringRecord = {
      id: `hir-${Math.random().toString(36).substring(2, 9)}`,
      candidateId: candId,
      candidateName: cand.fullName,
      position: cand.position,
      department: cand.department,
      status: 'Waiting Documents',
      checklist: {
        contractSigned: false,
        iqamaSubmitted: false,
        medicalInsuranceCode: false,
        backgroundChecked: true
      }
    };

    this.hiringRecords.update(list => [...list, newHiring]);
    this.notify.success('hr.common.msg_hiring_initiated', 'Hiring process initiated. Checklist generated.');
  }

  generateOfferLetter(hirId: string, salary: number) {
    this.hiringRecords.update(list => 
      list.map(h => {
        if (h.id === hirId) {
          return { ...h, status: 'Offer Sent', offerDate: new Date().toISOString().split('T')[0], offerSalary: salary };
        }
        return h;
      })
    );
    this.notify.success('hr.common.msg_offer_sent', 'Employment offer letter generated and sent.');
  }

  acceptOffer(hirId: string) {
    let candId = '';
    let candName = '';
    this.hiringRecords.update(list => 
      list.map(h => {
        if (h.id === hirId) {
          candId = h.candidateId;
          candName = h.candidateName;
          const updatedChecklist = { ...h.checklist, contractSigned: true };
          return { ...h, status: 'Offer Accepted', checklist: updatedChecklist };
        }
        return h;
      })
    );

    // Auto update status to Ready For Onboarding and generate onboarding tasks
    this.hiringRecords.update(list => 
      list.map(h => {
        if (h.id === hirId) {
          return { ...h, status: 'Ready For Onboarding' };
        }
        return h;
      })
    );

    // Generate onboarding tasks
    const taskNames: OnboardingTask['taskName'][] = [
      'Laptop', 'Email Account', 'ERP Account', 'Access Card', 'Uniform', 'Safety Equipment', 'Medical Check', 'Employment Contract'
    ];

    const newTasks = taskNames.map((name, index) => ({
      id: `onb-${Math.random().toString(36).substring(2, 9)}-${index}`,
      candidateId: candId,
      candidateName: candName,
      taskName: name,
      assignedDepartment: name === 'Laptop' || name === 'Email Account' || name === 'ERP Account' ? 'IT' : 'Operations',
      assignedTo: name === 'Laptop' || name === 'Email Account' || name === 'ERP Account' ? 'Faisal Al-Qahtani' : 'Tariq Al-Mutairi',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Not Started' as const
    }));

    this.onboardingTasks.update(list => [...list, ...newTasks]);
    this.notify.addNotification('hr.common.notif_offer_accepted_title', 'Offer accepted by ' + candName, 'success');
  }

  cancelHiring(hirId: string) {
    this.hiringRecords.update(list => list.filter(h => h.id !== hirId));
    this.notify.warning('hr.common.msg_hiring_cancelled', 'Hiring process cancelled.');
  }

  convertToEmployee(candId: string) {
    const cand = this.candidates().find(c => c.id === candId);
    if (!cand) return;

    const newEmpCode = `EMP-2026-00${this.employees().length + 1}`;
    
    // Automation: create folder, default leave balance (30 days), create payroll record & alerts
    const newEmp: Employee = {
      id: `emp-${Math.random().toString(36).substring(2, 9)}`,
      employeeCode: newEmpCode,
      fullName: cand.fullName,
      email: cand.email,
      phone: cand.phone,
      jobTitle: cand.position,
      departmentId: 'dept1', // Default HR
      status: 'Active',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: cand.expectedSalary,
      
      // Default Leave Balance allocation
      probationEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      costCenter: 'CC-ADMIN-HR',
      workLocation: 'HQ Office',
      shift: 'Normal 8 Hrs Shift',
      
      documents: [
        {
          id: `doc-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Employment Contract Draft',
          category: 'Employment Contract',
          fileUrl: '/assets/docs/cv-sample.pdf',
          fileSize: '240 KB',
          uploadDate: new Date().toISOString().split('T')[0],
          status: 'Active'
        }
      ],
      assets: [
        {
          id: `ast-${Math.random().toString(36).substring(2, 5)}`,
          name: 'Access Card',
          assetCode: `ASSET-AC-${Math.floor(100 + Math.random() * 900)}`,
          assignedDate: new Date().toISOString().split('T')[0],
          condition: 'Excellent',
          status: 'Assigned'
        }
      ],
      history: [
        {
          id: `h-${Math.random().toString(36).substring(2, 5)}`,
          date: new Date().toISOString().split('T')[0],
          type: 'Hiring',
          details: `Hiring complete. Profile generated with employee code ${newEmpCode}.`,
          performedBy: 'HR Auto-Orchestrator'
        }
      ]
    };

    // Add to employees, remove from hiring & onboarding
    this.employees.update(list => [...list, newEmp]);
    this.hiringRecords.update(list => list.map(h => h.candidateId === candId ? { ...h, status: 'Completed', employeeNumber: newEmpCode } : h));
    this.candidates.update(list => list.map(c => c.id === candId ? { ...c, status: 'Hired' } : c));

    // Remove onboarding tasks for this candidate since they are finished
    this.onboardingTasks.update(list => list.filter(t => t.candidateId !== candId));

    // Automation alerts
    this.notify.success('hr.common.msg_employee_created', 'Candidate converted to active employee ' + newEmpCode);
    this.notify.addNotification('hr.common.notif_emp_created_title', `Employee profile ${newEmpCode} registered. HR, IT, and Admin departments notified.`, 'success');
    this.audit.log('Create', 'HR', 'Employee', newEmp.id, 'HiringRecord', 'Employee', `Employee profile ${newEmpCode} generated.`);
  }

  updateOnboardingTask(taskId: string, status: OnboardingTask['status'], notes: string) {
    this.onboardingTasks.update(list => 
      list.map(t => {
        if (t.id === taskId) {
          return { 
            ...t, 
            status, 
            completedBy: status === 'Completed' ? 'Layla Al-Otaibi' : undefined,
            completedDate: status === 'Completed' ? new Date().toISOString().split('T')[0] : undefined,
            completionNotes: notes 
          };
        }
        return t;
      })
    );
  }

  // --- Phase 3 Employee lifecycle mutations ---
  promoteEmployee(empId: string, title: string, salary: number) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const oldTitle = e.jobTitle;
          const oldSal = e.salary;
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-promo-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Promotion' as const,
              details: `Promoted from ${oldTitle} to ${title}.`,
              performedBy: 'Layla Al-Otaibi'
            },
            {
              id: `h-sal-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Salary Increase' as const,
              details: `Basic salary adjusted from ${oldSal} SAR to ${salary} SAR.`,
              performedBy: 'HR Committee'
            }
          ];
          return { ...e, jobTitle: title, salary, history: updatedHist };
        }
        return e;
      })
    );
    this.notify.success('hr.common.msg_emp_promoted', 'Employee promotion logged successfully.');
  }

  transferEmployee(empId: string, deptId: string, manager: string) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const targetDept = this.departments().find(d => d.id === deptId)?.name || 'New Department';
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-trans-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Transfer' as const,
              details: `Transferred to department ${targetDept} under manager ${manager}.`,
              performedBy: 'Layla Al-Otaibi'
            }
          ];
          return { ...e, departmentId: deptId, manager, history: updatedHist };
        }
        return e;
      })
    );
    this.notify.success('hr.common.msg_emp_transferred', 'Employee transfer logged successfully.');
  }

  suspendEmployee(empId: string) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-susp-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Suspension' as const,
              details: `Employee suspended from active service.`,
              performedBy: 'HR Director'
            }
          ];
          return { ...e, status: 'Suspended', history: updatedHist };
        }
        return e;
      })
    );
    this.notify.warning('hr.common.msg_emp_suspended', 'Employee suspended.');
  }

  terminateEmployee(empId: string) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-term-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Termination' as const,
              details: `Contract terminated. Profile set to Resigned.`,
              performedBy: 'HR Director'
            }
          ];
          return { ...e, status: 'Resigned', history: updatedHist };
        }
        return e;
      })
    );
    this.notify.danger('hr.common.msg_emp_terminated', 'Employee contract terminated.');
  }

  uploadDocument(empId: string, doc: Partial<EmployeeDocument>) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const newDoc: EmployeeDocument = {
            id: `doc-${Math.random().toString(36).substring(2, 5)}`,
            name: doc.name || 'Document Copy',
            category: doc.category || 'Other Documents',
            fileUrl: doc.fileUrl || '/assets/docs/cv-sample.pdf',
            fileSize: doc.fileSize || '150 KB',
            uploadDate: new Date().toISOString().split('T')[0],
            expirationDate: doc.expirationDate,
            status: doc.status || 'Active'
          };
          const updatedDocs = [...(e.documents || []), newDoc];
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-doc-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Hiring' as const, // Placeholder type for timeline
              details: `Uploaded document: ${newDoc.name} in category ${newDoc.category}.`,
              performedBy: 'Layla Al-Otaibi'
            }
          ];
          return { ...e, documents: updatedDocs, history: updatedHist };
        }
        return e;
      })
    );
    this.notify.success('hr.common.msg_doc_uploaded', 'Document uploaded successfully.');
  }

  assignAsset(empId: string, name: EmployeeAsset['name'], code: string) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const newAsset: EmployeeAsset = {
            id: `ast-${Math.random().toString(36).substring(2, 5)}`,
            name,
            assetCode: code,
            assignedDate: new Date().toISOString().split('T')[0],
            condition: 'Excellent',
            status: 'Assigned'
          };
          const updatedAssets = [...(e.assets || []), newAsset];
          const updatedHist = [
            ...(e.history || []),
            {
              id: `h-ast-${Math.random().toString(36).substring(2, 5)}`,
              date: new Date().toISOString().split('T')[0],
              type: 'Hiring' as const,
              details: `Assigned company asset: ${name} (Code: ${code}).`,
              performedBy: 'Layla Al-Otaibi'
            }
          ];
          return { ...e, assets: updatedAssets, history: updatedHist };
        }
        return e;
      })
    );
    this.notify.success('hr.common.msg_asset_assigned', 'Asset assigned successfully.');
  }

  returnAsset(empId: string, assetId: string) {
    this.employees.update(list => 
      list.map(e => {
        if (e.id === empId) {
          const updatedAssets = (e.assets || []).map(a => 
            a.id === assetId ? { ...a, status: 'Returned' as const, returnedDate: new Date().toISOString().split('T')[0] } : a
          );
          return { ...e, assets: updatedAssets };
        }
        return e;
      })
    );
    this.notify.info('hr.common.msg_asset_returned', 'Asset returned to company storage.');
  }

  // ─────────────────────────────────────────────
  // PHASE 4 — ORGANIZATION MASTER DATA SIGNALS
  // ─────────────────────────────────────────────

  readonly jobGrades = signal<JobGrade[]>([
    { id: 'gr1', code: 'GR-01', name: 'Grade 1 — Junior', arabicName: 'الدرجة 1 — مبتدئ', minSalary: 4000, maxSalary: 7000, promotionLevel: 1, status: 'Active' },
    { id: 'gr2', code: 'GR-02', name: 'Grade 2 — Associate', arabicName: 'الدرجة 2 — مساعد', minSalary: 7001, maxSalary: 11000, promotionLevel: 2, status: 'Active' },
    { id: 'gr3', code: 'GR-03', name: 'Grade 3 — Mid-Level', arabicName: 'الدرجة 3 — متوسط', minSalary: 11001, maxSalary: 16000, promotionLevel: 3, status: 'Active' },
    { id: 'gr4', code: 'GR-04', name: 'Senior', arabicName: 'كبير', minSalary: 16001, maxSalary: 22000, promotionLevel: 4, status: 'Active' },
    { id: 'gr5', code: 'GR-05', name: 'Lead', arabicName: 'قائد', minSalary: 22001, maxSalary: 30000, promotionLevel: 5, status: 'Active' },
    { id: 'gr6', code: 'GR-06', name: 'Manager', arabicName: 'مدير', minSalary: 30001, maxSalary: 45000, promotionLevel: 6, status: 'Active' },
    { id: 'gr7', code: 'GR-07', name: 'Director', arabicName: 'مدير عام', minSalary: 45001, maxSalary: 80000, promotionLevel: 7, status: 'Active' },
    { id: 'gr8', code: 'GR-08', name: 'VP / C-Level', arabicName: 'نائب رئيس / إدارة عليا', minSalary: 80001, maxSalary: 150000, promotionLevel: 8, status: 'Active' }
  ]);

  readonly jobTitles = signal<JobTitle[]>([
    { id: 'jt1', code: 'JT-HR-001', name: 'HR Specialist', arabicName: 'أخصائي موارد بشرية', departmentId: 'dept1', departmentName: 'Human Resources', gradeId: 'gr2', gradeName: 'Grade 2 — Associate', defaultSalary: 9500, employmentType: 'Full Time', status: 'Active', minExperienceYears: 2, minQualification: "Bachelor's in HRM", requiredSkills: ['Recruitment', 'Payroll', 'HRMS'], filledCount: 2, vacantCount: 1 },
    { id: 'jt2', code: 'JT-HR-002', name: 'HR Manager', arabicName: 'مدير الموارد البشرية', departmentId: 'dept1', departmentName: 'Human Resources', gradeId: 'gr6', gradeName: 'Manager', defaultSalary: 18000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 8, minQualification: "Master's in HRM or equivalent", requiredSkills: ['Leadership', 'Strategic HR', 'Labor Law'], filledCount: 1, vacantCount: 0 },
    { id: 'jt3', code: 'JT-ENG-001', name: 'Drilling Engineer', arabicName: 'مهندس حفر', departmentId: 'dept2', departmentName: 'Engineering', gradeId: 'gr3', gradeName: 'Grade 3 — Mid-Level', defaultSalary: 14000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 4, minQualification: "B.Sc. Petroleum Engineering", requiredSkills: ['Drilling Operations', 'BOP', 'Well Planning'], filledCount: 5, vacantCount: 2 },
    { id: 'jt4', code: 'JT-ENG-002', name: 'Senior Drilling Engineer', arabicName: 'مهندس حفر أول', departmentId: 'dept2', departmentName: 'Engineering', gradeId: 'gr4', gradeName: 'Senior', defaultSalary: 20000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 8, minQualification: "B.Sc. Petroleum Engineering + IWCF", requiredSkills: ['Senior Drilling', 'IWCF Level 4', 'Team Management'], filledCount: 2, vacantCount: 1 },
    { id: 'jt5', code: 'JT-FIN-001', name: 'Finance Accountant', arabicName: 'محاسب مالي', departmentId: 'dept4', departmentName: 'Finance', gradeId: 'gr2', gradeName: 'Grade 2 — Associate', defaultSalary: 10000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 2, minQualification: "B.Sc. Accounting / Finance", requiredSkills: ['Accounting', 'SAP', 'IFRS'], filledCount: 3, vacantCount: 1 },
    { id: 'jt6', code: 'JT-HSE-001', name: 'HSE Safety Inspector', arabicName: 'مفتش سلامة بيئية', departmentId: 'dept3', departmentName: 'HSE', gradeId: 'gr2', gradeName: 'Grade 2 — Associate', defaultSalary: 9000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 3, minQualification: "B.Sc. Occupational Health", requiredSkills: ['OSHA', 'First Aid', 'Risk Assessment'], filledCount: 2, vacantCount: 2 },
    { id: 'jt7', code: 'JT-IT-001', name: 'ERP Systems Administrator', arabicName: 'مدير أنظمة ERP', departmentId: 'dept6', departmentName: 'Information Technology', gradeId: 'gr3', gradeName: 'Grade 3 — Mid-Level', defaultSalary: 13000, employmentType: 'Full Time', status: 'Active', minExperienceYears: 4, minQualification: "B.Sc. IT / Computer Science", requiredSkills: ['Angular', 'SQL', 'ERP Administration'], filledCount: 1, vacantCount: 1 },
    { id: 'jt8', code: 'JT-OPS-001', name: 'Operations Supervisor', arabicName: 'مشرف عمليات', departmentId: 'dept5', departmentName: 'Operations', gradeId: 'gr5', gradeName: 'Lead', defaultSalary: 25000, employmentType: 'Full Time', status: 'Draft', minExperienceYears: 10, minQualification: "B.Sc. Engineering or equivalent", requiredSkills: ['Operations Management', 'HSE Compliance', 'Reporting'], filledCount: 0, vacantCount: 3 }
  ]);

  readonly workLocations = signal<WorkLocation[]>([
    { id: 'loc1', code: 'LOC-HQ-RUH', name: 'Riyadh Headquarters', arabicName: 'المقر الرئيسي — الرياض', type: 'Company', address: 'King Fahad Road, Olaya District', city: 'Riyadh', country: 'Saudi Arabia', phone: '+966-11-5550000', managerName: 'CEO Office', status: 'Active' },
    { id: 'loc2', code: 'LOC-BR-DMM', name: 'Dammam Branch Office', arabicName: 'فرع الدمام', type: 'Branch', address: 'King Abdullah Road, Al-Khobar', city: 'Dammam', country: 'Saudi Arabia', phone: '+966-13-5551111', managerName: 'Ahmad Al-Dosari', status: 'Active' },
    { id: 'loc3', code: 'LOC-RIG-A01', name: 'Offshore Rig Alpha', arabicName: 'منصة ألفا البحرية', type: 'Project Site', address: 'Arabian Gulf — Block 22', city: 'Offshore', country: 'Saudi Arabia', phone: '+966-54-9990001', managerName: 'Tariq Al-Mutairi', status: 'Active' },
    { id: 'loc4', code: 'LOC-RIG-B02', name: 'Onshore Rig Beta', arabicName: 'منصة بيتا البرية', type: 'Project Site', address: 'Shaybah Field, Empty Quarter', city: 'Shaybah', country: 'Saudi Arabia', phone: '+966-54-9990002', managerName: 'Omar Al-Rashidi', status: 'Active' },
    { id: 'loc5', code: 'LOC-CAMP-01', name: 'Operations Camp Site', arabicName: 'المخيم الميداني', type: 'Camp', address: 'Jubail Industrial City', city: 'Jubail', country: 'Saudi Arabia', phone: '+966-13-5553333', managerName: 'Sami Al-Zahrani', status: 'Active' },
    { id: 'loc6', code: 'LOC-WH-KHB', name: 'Khobar Warehouse', arabicName: 'مستودع الخبر', type: 'Warehouse', address: 'Khobar Industrial Zone, Area 3', city: 'Khobar', country: 'Saudi Arabia', phone: '+966-13-5554444', managerName: 'Faisal Al-Qahtani', status: 'Active' },
    { id: 'loc7', code: 'LOC-OFF-JED', name: 'Jeddah Sales Office', arabicName: 'مكتب جدة للمبيعات', type: 'Office', address: 'Tahlia Street, Al-Rawdah', city: 'Jeddah', country: 'Saudi Arabia', phone: '+966-12-5555555', managerName: 'Layla Al-Otaibi', status: 'Inactive' }
  ]);

  readonly employmentTypes = signal<EmploymentType[]>([
    { id: 'et1', code: 'FT', name: 'Full Time', arabicName: 'دوام كامل', description: 'Standard 8-hour workday, 5 days a week with full benefits package.', status: 'Active' },
    { id: 'et2', code: 'PT', name: 'Part Time', arabicName: 'دوام جزئي', description: 'Less than 30 hours per week. Partial benefits apply.', status: 'Active' },
    { id: 'et3', code: 'CON', name: 'Contract', arabicName: 'عقد محدد المدة', description: 'Fixed-term contract for a specified project or duration.', status: 'Active' },
    { id: 'et4', code: 'TEMP', name: 'Temporary', arabicName: 'مؤقت', description: 'Short-term employment to cover peaks or absences.', status: 'Active' },
    { id: 'et5', code: 'INT', name: 'Internship', arabicName: 'تدريب', description: 'Structured training program for fresh graduates.', status: 'Active' },
    { id: 'et6', code: 'REM', name: 'Remote', arabicName: 'عمل عن بعد', description: 'Full-time remote work arrangement from home or another location.', status: 'Active' },
    { id: 'et7', code: 'HYB', name: 'Hybrid', arabicName: 'هجين', description: 'Mix of in-office and remote work, typically 3 days office / 2 days remote.', status: 'Active' }
  ]);

  readonly contractTypes = signal<HrContractType[]>([
    { id: 'ct1', code: 'PERM', name: 'Permanent', arabicName: 'دائم / غير محدد المدة', noticePeriodDays: 60, probationDays: 90, renewable: false, description: 'Unlimited-term contract with full employment rights.', status: 'Active' },
    { id: 'ct2', code: 'TEMP-1Y', name: 'Temporary — 1 Year', arabicName: 'مؤقت — سنة', noticePeriodDays: 30, probationDays: 90, renewable: true, maxDurationMonths: 12, description: 'One year fixed-term contract, renewable based on performance.', status: 'Active' },
    { id: 'ct3', code: 'PROJ', name: 'Project Based', arabicName: 'مرتبط بمشروع', noticePeriodDays: 30, probationDays: 60, renewable: false, description: 'Contract valid for the duration of a specific project.', status: 'Active' },
    { id: 'ct4', code: 'CONS', name: 'Consultant', arabicName: 'استشاري', noticePeriodDays: 14, probationDays: 0, renewable: true, maxDurationMonths: 6, description: 'Independent consultant agreement, no employment benefits.', status: 'Active' },
    { id: 'ct5', code: 'PROB', name: 'Probation', arabicName: 'تجريبي', noticePeriodDays: 7, probationDays: 90, renewable: false, maxDurationMonths: 3, description: 'Initial 90-day trial period before permanent contract offer.', status: 'Active' },
    { id: 'ct6', code: 'INTERN', name: 'Internship', arabicName: 'تدريب', noticePeriodDays: 7, probationDays: 0, renewable: false, maxDurationMonths: 6, description: 'Structured internship agreement for students or fresh graduates.', status: 'Active' }
  ]);

  // ─── Department CRUD ───
  addDepartment(dept: Partial<Department>): boolean {
    const code = dept.code?.trim().toUpperCase() || '';
    if (this.departments().some(d => d.code === code)) {
      this.notify.danger('hr.org.dept.err_dup_code', 'Department code already exists.');
      return false;
    }
    const newDept: Department = {
      id: `dept-${Math.random().toString(36).substring(2, 7)}`,
      code, name: dept.name || '', arabicName: dept.arabicName || '',
      managerName: dept.managerName, parentDepartmentId: dept.parentDepartmentId,
      status: dept.status || 'Active', costCenter: dept.costCenter, location: dept.location,
      phone: dept.phone, email: dept.email, description: dept.description, notes: dept.notes,
      employeeCount: 0, isBudgetCenter: dept.isBudgetCenter || false
    };
    this.departments.update(list => [...list, newDept]);
    this.notify.success('hr.org.dept.msg_added', 'Department added successfully.');
    return true;
  }

  updateDepartment(id: string, changes: Partial<Department>) {
    const code = changes.code?.trim().toUpperCase();
    if (code && this.departments().some(d => d.code === code && d.id !== id)) {
      this.notify.danger('hr.org.dept.err_dup_code', 'Department code already exists.');
      return;
    }
    this.departments.update(list => list.map(d => d.id === id ? { ...d, ...changes, code: code || d.code } : d));
    this.notify.success('hr.org.dept.msg_updated', 'Department updated successfully.');
  }

  deleteDepartment(id: string): boolean {
    const hasEmployees = this.employees().some(e => e.departmentId === id);
    if (hasEmployees) {
      this.notify.danger('hr.org.dept.err_has_employees', 'Cannot delete: department has linked employees.');
      return false;
    }
    this.departments.update(list => list.filter(d => d.id !== id));
    this.notify.warning('hr.org.dept.msg_deleted', 'Department removed.');
    return true;
  }

  // ─── Job Grade CRUD ───
  addJobGrade(grade: Partial<JobGrade>): boolean {
    const code = grade.code?.trim().toUpperCase() || '';
    if (this.jobGrades().some(g => g.code === code)) {
      this.notify.danger('hr.org.grades.err_dup_code', 'Grade code already exists.');
      return false;
    }
    const newGrade: JobGrade = {
      id: `gr-${Math.random().toString(36).substring(2, 7)}`,
      code, name: grade.name || '', arabicName: grade.arabicName || '',
      minSalary: grade.minSalary || 0, maxSalary: grade.maxSalary || 0,
      promotionLevel: grade.promotionLevel || 1, status: grade.status || 'Active'
    };
    this.jobGrades.update(list => [...list, newGrade]);
    this.notify.success('hr.org.grades.msg_added', 'Grade added successfully.');
    return true;
  }

  updateJobGrade(id: string, changes: Partial<JobGrade>) {
    this.jobGrades.update(list => list.map(g => g.id === id ? { ...g, ...changes } : g));
    this.notify.success('hr.org.grades.msg_updated', 'Grade updated.');
  }

  deleteJobGrade(id: string): boolean {
    if (this.jobTitles().some(j => j.gradeId === id)) {
      this.notify.danger('hr.org.grades.err_in_use', 'Cannot delete: grade is assigned to job titles.');
      return false;
    }
    this.jobGrades.update(list => list.filter(g => g.id !== id));
    this.notify.warning('hr.org.grades.msg_deleted', 'Grade removed.');
    return true;
  }

  // ─── Job Title CRUD ───
  addJobTitle(job: Partial<JobTitle>): boolean {
    const code = job.code?.trim().toUpperCase() || '';
    if (this.jobTitles().some(j => j.code === code)) {
      this.notify.danger('hr.org.jobs.err_dup_code', 'Job code already exists.');
      return false;
    }
    const dept = this.departments().find(d => d.id === job.departmentId);
    const grade = this.jobGrades().find(g => g.id === job.gradeId);
    const newJob: JobTitle = {
      id: `jt-${Math.random().toString(36).substring(2, 7)}`,
      code, name: job.name || '', arabicName: job.arabicName || '',
      departmentId: job.departmentId || '', departmentName: dept?.name,
      gradeId: job.gradeId, gradeName: grade?.name,
      defaultSalary: job.defaultSalary, employmentType: job.employmentType,
      status: job.status || 'Active', description: job.description,
      responsibilities: job.responsibilities, requiredSkills: job.requiredSkills || [],
      minExperienceYears: job.minExperienceYears, minQualification: job.minQualification,
      filledCount: 0, vacantCount: job.vacantCount || 1
    };
    this.jobTitles.update(list => [...list, newJob]);
    this.notify.success('hr.org.jobs.msg_added', 'Job title added.');
    return true;
  }

  updateJobTitle(id: string, changes: Partial<JobTitle>) {
    this.jobTitles.update(list => list.map(j => j.id === id ? { ...j, ...changes } : j));
    this.notify.success('hr.org.jobs.msg_updated', 'Job title updated.');
  }

  deleteJobTitle(id: string): boolean {
    const inUse = this.employees().some(e => e.jobTitle === this.jobTitles().find(j => j.id === id)?.name);
    if (inUse) {
      this.notify.danger('hr.org.jobs.err_in_use', 'Cannot delete: job title is assigned to employees.');
      return false;
    }
    this.jobTitles.update(list => list.filter(j => j.id !== id));
    this.notify.warning('hr.org.jobs.msg_deleted', 'Job title removed.');
    return true;
  }

  // ─── Work Location CRUD ───
  addWorkLocation(loc: Partial<WorkLocation>): boolean {
    const code = loc.code?.trim().toUpperCase() || '';
    if (this.workLocations().some(l => l.code === code)) {
      this.notify.danger('hr.org.locations.err_dup_code', 'Location code already exists.');
      return false;
    }
    const newLoc: WorkLocation = {
      id: `loc-${Math.random().toString(36).substring(2, 7)}`,
      code, name: loc.name || '', arabicName: loc.arabicName || '',
      type: loc.type || 'Office', address: loc.address, city: loc.city,
      country: loc.country || 'Saudi Arabia', phone: loc.phone,
      managerName: loc.managerName, status: loc.status || 'Active'
    };
    this.workLocations.update(list => [...list, newLoc]);
    this.notify.success('hr.org.locations.msg_added', 'Work location added.');
    return true;
  }

  updateWorkLocation(id: string, changes: Partial<WorkLocation>) {
    this.workLocations.update(list => list.map(l => l.id === id ? { ...l, ...changes } : l));
    this.notify.success('hr.org.locations.msg_updated', 'Work location updated.');
  }

  deleteWorkLocation(id: string): boolean {
    this.workLocations.update(list => list.filter(l => l.id !== id));
    this.notify.warning('hr.org.locations.msg_deleted', 'Work location removed.');
    return true;
  }

  // ─── Employment Type CRUD ───
  addEmploymentType(et: Partial<EmploymentType>): boolean {
    const code = et.code?.trim().toUpperCase() || '';
    if (this.employmentTypes().some(e => e.code === code)) {
      this.notify.danger('hr.org.emp_types.err_dup_code', 'Employment type code already exists.');
      return false;
    }
    this.employmentTypes.update(list => [...list, {
      id: `et-${Math.random().toString(36).substring(2, 7)}`,
      code, name: et.name || '', arabicName: et.arabicName || '',
      description: et.description, status: et.status || 'Active'
    }]);
    this.notify.success('hr.org.emp_types.msg_added', 'Employment type added.');
    return true;
  }

  updateEmploymentType(id: string, changes: Partial<EmploymentType>) {
    this.employmentTypes.update(list => list.map(e => e.id === id ? { ...e, ...changes } : e));
    this.notify.success('hr.org.emp_types.msg_updated', 'Employment type updated.');
  }

  deleteEmploymentType(id: string) {
    this.employmentTypes.update(list => list.filter(e => e.id !== id));
    this.notify.warning('hr.org.emp_types.msg_deleted', 'Employment type removed.');
  }

  // ─── Contract Type CRUD ───
  addContractType(ct: Partial<HrContractType>): boolean {
    const code = ct.code?.trim().toUpperCase() || '';
    if (this.contractTypes().some(c => c.code === code)) {
      this.notify.danger('hr.org.contract.err_dup_code', 'Contract type code already exists.');
      return false;
    }
    this.contractTypes.update(list => [...list, {
      id: `ct-${Math.random().toString(36).substring(2, 7)}`,
      code, name: ct.name || '', arabicName: ct.arabicName || '',
      noticePeriodDays: ct.noticePeriodDays || 30, probationDays: ct.probationDays || 90,
      renewable: ct.renewable || false, maxDurationMonths: ct.maxDurationMonths,
      description: ct.description, status: ct.status || 'Active'
    }]);
    this.notify.success('hr.org.contract.msg_added', 'Contract type added.');
    return true;
  }

  updateContractType(id: string, changes: Partial<HrContractType>) {
    this.contractTypes.update(list => list.map(c => c.id === id ? { ...c, ...changes } : c));
    this.notify.success('hr.org.contract.msg_updated', 'Contract type updated.');
  }

  deleteContractType(id: string) {
    this.contractTypes.update(list => list.filter(c => c.id !== id));
    this.notify.warning('hr.org.contract.msg_deleted', 'Contract type removed.');
  }

  // ════════════════════════════════════════════════════════
  // ATTENDANCE MODULE — Signals
  // ════════════════════════════════════════════════════════

  readonly shifts = signal<Shift[]>([
    { id: 'sh1', code: '8N', name: '8 Hours Normal', arabicName: '8 ساعات نظامي', type: 'Fixed', startTime: '08:00', endTime: '17:00', breakMinutes: 60, gracePeriodMinutes: 10, latePolicy: 'Warning', earlyLeavePolicy: 'Deduction', minWorkingHours: 6, maxWorkingHours: 10, isNightShift: false, isFlexible: false, status: 'Active', color: '#3B82F6', description: 'Standard office working hours' },
    { id: 'sh2', code: '12R', name: '12 Hours Rotary Day', arabicName: '12 ساعة دوار نهاري', type: 'Rotary', startTime: '06:00', endTime: '18:00', breakMinutes: 30, gracePeriodMinutes: 15, latePolicy: 'Warning', earlyLeavePolicy: 'Warning', minWorkingHours: 10, maxWorkingHours: 12, isNightShift: false, isFlexible: false, status: 'Active', color: '#10B981', description: '12-hour rotary shift for field operations' },
    { id: 'sh3', code: '12N', name: 'Night 12 Hours', arabicName: '12 ساعة ليلي', type: 'Night', startTime: '20:00', endTime: '08:00', breakMinutes: 30, gracePeriodMinutes: 15, latePolicy: 'Warning', earlyLeavePolicy: 'Warning', minWorkingHours: 10, maxWorkingHours: 12, isNightShift: true, isFlexible: false, status: 'Active', color: '#6366F1', description: 'Night shift for rig operations' },
    { id: 'sh4', code: 'FLEX', name: 'Flexible Hours', arabicName: 'دوام مرن', type: 'Flexible', startTime: '08:00', endTime: '17:00', breakMinutes: 60, gracePeriodMinutes: 60, latePolicy: 'None', earlyLeavePolicy: 'None', minWorkingHours: 8, maxWorkingHours: 12, isNightShift: false, isFlexible: true, status: 'Active', color: '#F59E0B', description: 'Flexible hours for remote and hybrid employees' },
    { id: 'sh5', code: 'SPLIT', name: 'Split Shift', arabicName: 'دوام منقسم', type: 'Split', startTime: '07:00', endTime: '19:00', breakMinutes: 120, gracePeriodMinutes: 10, latePolicy: 'Deduction', earlyLeavePolicy: 'Deduction', minWorkingHours: 8, maxWorkingHours: 10, isNightShift: false, isFlexible: false, status: 'Active', color: '#EC4899', description: 'Split shift with extended break' },
    { id: 'sh6', code: 'WE', name: 'Weekend 8 Hours', arabicName: '8 ساعات عطلة', type: 'Fixed', startTime: '08:00', endTime: '16:00', breakMinutes: 30, gracePeriodMinutes: 15, latePolicy: 'None', earlyLeavePolicy: 'None', minWorkingHours: 6, maxWorkingHours: 8, isNightShift: false, isFlexible: false, status: 'Inactive', color: '#64748B', description: 'Special weekend shift' },
  ]);

  readonly workSchedules = signal<WorkSchedule[]>([
    { id: 'ws1', name: 'Engineering Weekly', arabicName: 'جدول الهندسة الأسبوعي', type: 'Weekly', shiftId: 'sh1', shiftName: '8Hr Normal', assignType: 'Department', assignedToId: 'dept2', assignedToName: 'Engineering', effectiveFrom: '2026-01-01', workDays: ['Sun','Mon','Tue','Wed','Thu'], status: 'Active' },
    { id: 'ws2', name: 'HR Dept Schedule', arabicName: 'جدول الموارد البشرية', type: 'Weekly', shiftId: 'sh1', shiftName: '8Hr Normal', assignType: 'Department', assignedToId: 'dept1', assignedToName: 'Human Resources', effectiveFrom: '2026-01-01', workDays: ['Sun','Mon','Tue','Wed','Thu'], status: 'Active' },
    { id: 'ws3', name: 'Rig Operations Rotation', arabicName: 'دوران عمليات الحفر', type: 'Weekly', shiftId: 'sh2', shiftName: '12Hr Rotary', assignType: 'Department', assignedToId: 'dept5', assignedToName: 'Operations', effectiveFrom: '2026-01-01', workDays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], status: 'Active' },
    { id: 'ws4', name: 'Ahmad Custom Schedule', arabicName: 'جدول أحمد المخصص', type: 'Monthly', shiftId: 'sh4', shiftName: 'Flexible', assignType: 'Employee', assignedToId: 'emp1', assignedToName: 'Ahmad Al-Dosari', effectiveFrom: '2026-06-01', workDays: ['Sun','Mon','Tue','Wed','Thu'], status: 'Active' },
    { id: 'ws5', name: 'HSE Field Schedule', arabicName: 'جدول HSE الميداني', type: 'Weekly', shiftId: 'sh2', shiftName: '12Hr Rotary', assignType: 'Department', assignedToId: 'dept3', assignedToName: 'HSE', effectiveFrom: '2026-01-01', workDays: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], status: 'Active' },
  ]);

  readonly overtimeRequests = signal<OvertimeRequest[]>([
    { id: 'ot1', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentName: 'Engineering', date: '2026-07-02', type: 'Weekday', requestedHours: 2, approvedHours: 2, reason: 'Emergency rig repair work', status: 'Approved', submittedDate: '2026-07-02', approvedBy: 'Ahmed Hassan', approvedDate: '2026-07-02', hourlyRate: 75, totalAmount: 150 },
    { id: 'ot2', employeeId: 'emp5', employeeName: 'Tariq Al-Mutairi', employeeNumber: 'EMP-005', departmentName: 'Operations', date: '2026-07-03', type: 'Night Shift', requestedHours: 4, reason: 'Extended drilling operations', status: 'Pending', submittedDate: '2026-07-03', hourlyRate: 90 },
    { id: 'ot3', employeeId: 'emp4', employeeName: 'Mariam Al-Ghamdi', employeeNumber: 'EMP-004', departmentName: 'Finance', date: '2026-06-30', type: 'Weekday', requestedHours: 3, approvedHours: 2, reason: 'Month-end financial closing', status: 'Approved', submittedDate: '2026-06-30', approvedBy: 'Ahmed Hassan', approvedDate: '2026-06-30', hourlyRate: 65, totalAmount: 130 },
    { id: 'ot4', employeeId: 'emp7', employeeName: 'Sami Al-Zahrani', employeeNumber: 'EMP-007', departmentName: 'Procurement', date: '2026-07-01', type: 'Weekday', requestedHours: 2, reason: 'Urgent purchase order review', status: 'Rejected', submittedDate: '2026-07-01', approvedBy: 'Mohamed Saleh', approvedDate: '2026-07-01', rejectionReason: 'No operational justification provided' },
    { id: 'ot5', employeeId: 'emp8', employeeName: 'Omar Al-Rashidi', employeeNumber: 'EMP-008', departmentName: 'Operations', date: '2026-07-03', type: 'Weekend', requestedHours: 8, reason: 'Emergency maintenance', status: 'Pending', submittedDate: '2026-07-03', hourlyRate: 100 },
    { id: 'ot6', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', employeeNumber: 'EMP-006', departmentName: 'IT', date: '2026-06-28', type: 'Weekend', requestedHours: 6, approvedHours: 6, reason: 'Server migration weekend work', status: 'Paid', submittedDate: '2026-06-28', approvedBy: 'Ahmed Hassan', approvedDate: '2026-06-29', hourlyRate: 80, totalAmount: 480 },
  ]);

  readonly permissionRequests = signal<PermissionRequest[]>([
    { id: 'pm1', employeeId: 'emp2', employeeName: 'Layla Al-Otaibi', employeeNumber: 'EMP-002', departmentName: 'Human Resources', date: '2026-07-03', type: 'Late Arrival', timeFrom: '08:00', timeTo: '08:22', durationMinutes: 22, reason: 'Car breakdown on the way to office', status: 'Approved', submittedDate: '2026-07-03', approvedBy: 'Ahmed Hassan', approvedDate: '2026-07-03' },
    { id: 'pm2', employeeId: 'emp7', employeeName: 'Sami Al-Zahrani', employeeNumber: 'EMP-007', departmentName: 'Procurement', date: '2026-07-03', type: 'Early Leave', timeFrom: '14:30', timeTo: '17:00', durationMinutes: 150, reason: 'Medical appointment', status: 'Approved', submittedDate: '2026-07-02', approvedBy: 'Ahmed Hassan', approvedDate: '2026-07-02' },
    { id: 'pm3', employeeId: 'emp4', employeeName: 'Mariam Al-Ghamdi', employeeNumber: 'EMP-004', departmentName: 'Finance', date: '2026-07-05', type: 'Medical', timeFrom: '08:00', timeTo: '12:00', durationMinutes: 240, reason: 'Medical check-up and lab tests', status: 'Pending', submittedDate: '2026-07-03' },
    { id: 'pm4', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', employeeNumber: 'EMP-006', departmentName: 'IT', date: '2026-07-04', type: 'Official Mission', timeFrom: '09:00', timeTo: '14:00', durationMinutes: 300, reason: 'Government IT compliance meeting', status: 'Pending', submittedDate: '2026-07-03' },
    { id: 'pm5', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentName: 'Engineering', date: '2026-06-29', type: 'Personal', timeFrom: '14:00', timeTo: '17:00', durationMinutes: 180, reason: 'Family matter', status: 'Rejected', submittedDate: '2026-06-28', approvedBy: 'Ahmed Hassan', approvedDate: '2026-06-28', rejectionReason: 'Critical project deadline - cannot be absent' },
  ]);

  readonly businessTrips = signal<BusinessTrip[]>([
    { id: 'bt1', employeeId: 'emp7', employeeName: 'Sami Al-Zahrani', employeeNumber: 'EMP-007', departmentName: 'Procurement', destination: 'Riyadh, KSA', projectName: 'Gas Pipeline Expansion', purpose: 'Vendor contract negotiation and site inspection', startDate: '2026-07-02', endDate: '2026-07-04', durationDays: 3, transportation: 'Air', accommodation: 'Marriott Riyadh', dailyAllowance: 500, totalAllowance: 1500, status: 'In Progress', submittedDate: '2026-06-29', approvedBy: 'Ahmed Hassan', approvedDate: '2026-06-30' },
    { id: 'bt2', employeeId: 'emp3', employeeName: 'John Smith', employeeNumber: 'EMP-003', departmentName: 'HSE', destination: 'Abu Dhabi, UAE', projectName: 'HSE Compliance Audit', purpose: 'Annual HSE audit and training certification', startDate: '2026-07-10', endDate: '2026-07-14', durationDays: 5, transportation: 'Air', accommodation: 'Hilton Abu Dhabi', dailyAllowance: 700, totalAllowance: 3500, status: 'Approved', submittedDate: '2026-07-01', approvedBy: 'Ahmed Hassan', approvedDate: '2026-07-02' },
    { id: 'bt3', employeeId: 'emp8', employeeName: 'Omar Al-Rashidi', employeeNumber: 'EMP-008', departmentName: 'Operations', destination: 'Dammam, KSA', projectName: 'Offshore Rig Alpha', purpose: 'Emergency equipment inspection', startDate: '2026-07-05', endDate: '2026-07-06', durationDays: 2, transportation: 'Company Vehicle', accommodation: 'Company Camp', dailyAllowance: 300, totalAllowance: 600, status: 'Pending', submittedDate: '2026-07-03' },
    { id: 'bt4', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-001', departmentName: 'Engineering', destination: 'Houston, USA', projectName: 'Technology Transfer', purpose: 'Drilling technology conference and training', startDate: '2026-06-15', endDate: '2026-06-22', durationDays: 8, transportation: 'Air', accommodation: 'Hyatt Regency', dailyAllowance: 1200, totalAllowance: 9600, status: 'Completed', submittedDate: '2026-06-01', approvedBy: 'Ahmed Hassan', approvedDate: '2026-06-03' },
    { id: 'bt5', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', employeeNumber: 'EMP-006', departmentName: 'IT', destination: 'Dubai, UAE', projectName: 'ERP Implementation', purpose: 'SAP training and certification', startDate: '2026-07-20', endDate: '2026-07-25', durationDays: 6, transportation: 'Air', dailyAllowance: 800, totalAllowance: 4800, status: 'Draft', submittedDate: '2026-07-03' },
  ]);

  readonly attendanceExceptions = signal<AttendanceException[]>([
    { id: 'ex1', employeeId: 'emp6', employeeName: 'Faisal Al-Qahtani', departmentName: 'IT', date: '2026-07-03', type: 'Missing Check-In', description: 'Employee has no clock-in record for today', status: 'Pending' },
    { id: 'ex2', employeeId: 'emp2', employeeName: 'Layla Al-Otaibi', departmentName: 'Human Resources', date: '2026-07-01', type: 'Missing Check-Out', description: 'No clock-out recorded after 17:00', status: 'Resolved', resolvedBy: 'HR Manager', resolvedDate: '2026-07-02', correctedClockOut: '17:05' },
    { id: 'ex3', employeeId: 'emp5', employeeName: 'Tariq Al-Mutairi', departmentName: 'Operations', date: '2026-07-02', type: 'Duplicate Punch', description: 'Two identical clock-in entries at 19:58 and 20:00', status: 'Resolved', resolvedBy: 'System Auto', resolvedDate: '2026-07-02' },
    { id: 'ex4', employeeId: 'emp3', employeeName: 'John Smith', departmentName: 'HSE', date: '2026-06-30', type: 'Invalid Time', description: 'Clock-out time (05:00) is before clock-in time (06:00) — possible system error', status: 'Rejected', resolvedBy: 'HR Admin', resolvedDate: '2026-07-01' },
    { id: 'ex5', employeeId: 'emp8', employeeName: 'Omar Al-Rashidi', departmentName: 'Operations', date: '2026-07-02', type: 'Missing Check-In', description: 'Remote employee without system check-in confirmation', status: 'Pending' },
  ]);

  readonly importHistory = signal<AttendanceImportResult[]>([
    { fileName: 'ZKTeco_Export_20260703.xlsx', importDate: '2026-07-03', totalRecords: 48, successRecords: 44, failedRecords: 1, duplicateRecords: 2, unknownEmployees: 1, records: [] },
    { fileName: 'ZKTeco_Export_20260702.xlsx', importDate: '2026-07-02', totalRecords: 56, successRecords: 55, failedRecords: 0, duplicateRecords: 1, unknownEmployees: 0, records: [] },
    { fileName: 'ZKTeco_Export_20260630.xlsx', importDate: '2026-06-30', totalRecords: 50, successRecords: 48, failedRecords: 2, duplicateRecords: 0, unknownEmployees: 0, records: [] },
  ]);

  // ─── Computed attendance stats ───
  readonly todayAttendance = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.attendanceRecords().filter(r => r.date === today);
  });

  readonly todayPresent = computed(() => this.todayAttendance().filter(r => r.status === 'Present' || r.status === 'Remote').length);
  readonly todayAbsent = computed(() => this.todayAttendance().filter(r => r.status === 'Absent').length);
  readonly todayLate = computed(() => this.todayAttendance().filter(r => r.status === 'Late').length);
  readonly todayOnLeave = computed(() => this.todayAttendance().filter(r => r.status === 'Leave' || r.status === 'On Leave').length);
  readonly todayOnTrip = computed(() => this.todayAttendance().filter(r => r.status === 'Business Trip').length);
  readonly todayRemote = computed(() => this.todayAttendance().filter(r => r.status === 'Remote').length);
  readonly totalOvertimeToday = computed(() => this.todayAttendance().reduce((s, r) => s + (r.overtimeHours ?? 0), 0));
  readonly attendanceRate = computed(() => {
    const total = this.todayAttendance().length;
    if (!total) return 0;
    const present = this.todayPresent() + this.todayLate() + this.todayOnTrip() + this.todayRemote();
    return Math.round((present / total) * 100);
  });

  // ─── Shift CRUD ───
  addShift(shift: Partial<Shift>): boolean {
    const code = shift.code?.trim().toUpperCase() || '';
    if (this.shifts().some(s => s.code === code)) {
      this.notify.danger('hr.att.shift.err_dup_code', 'Shift code already exists.');
      return false;
    }
    this.shifts.update(list => [...list, {
      id: `sh-${Math.random().toString(36).substring(2, 7)}`, code,
      name: shift.name || '', arabicName: shift.arabicName || '',
      type: shift.type || 'Fixed', startTime: shift.startTime || '08:00',
      endTime: shift.endTime || '17:00', breakMinutes: shift.breakMinutes ?? 60,
      gracePeriodMinutes: shift.gracePeriodMinutes ?? 10,
      latePolicy: shift.latePolicy || 'Warning', earlyLeavePolicy: shift.earlyLeavePolicy || 'Warning',
      minWorkingHours: shift.minWorkingHours ?? 6, maxWorkingHours: shift.maxWorkingHours ?? 10,
      isNightShift: shift.isNightShift || false, isFlexible: shift.isFlexible || false,
      status: shift.status || 'Active', color: shift.color || '#3B82F6', description: shift.description
    }]);
    this.notify.success('hr.att.shift.msg_added', 'Shift added.');
    return true;
  }

  updateShift(id: string, changes: Partial<Shift>) {
    this.shifts.update(list => list.map(s => s.id === id ? { ...s, ...changes } : s));
    this.notify.success('hr.att.shift.msg_updated', 'Shift updated.');
  }

  deleteShift(id: string) {
    if (this.workSchedules().some(ws => ws.shiftId === id)) {
      this.notify.danger('hr.att.shift.err_in_use', 'Shift is used in a work schedule.');
      return false;
    }
    this.shifts.update(list => list.filter(s => s.id !== id));
    this.notify.warning('hr.att.shift.msg_deleted', 'Shift removed.');
    return true;
  }

  // ─── Work Schedule CRUD ───
  addWorkSchedule(ws: Partial<WorkSchedule>) {
    this.workSchedules.update(list => [...list, {
      id: `ws-${Math.random().toString(36).substring(2, 7)}`,
      name: ws.name || '', arabicName: ws.arabicName || '',
      type: ws.type || 'Weekly', shiftId: ws.shiftId || '',
      shiftName: this.shifts().find(s => s.id === ws.shiftId)?.name,
      assignType: ws.assignType || 'Department',
      assignedToId: ws.assignedToId || '', assignedToName: ws.assignedToName,
      effectiveFrom: ws.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: ws.effectiveTo, workDays: ws.workDays || ['Sun','Mon','Tue','Wed','Thu'],
      status: ws.status || 'Active'
    }]);
    this.notify.success('hr.att.schedule.msg_added', 'Work schedule added.');
  }

  updateWorkSchedule(id: string, changes: Partial<WorkSchedule>) {
    this.workSchedules.update(list => list.map(ws => ws.id === id ? { ...ws, ...changes } : ws));
    this.notify.success('hr.att.schedule.msg_updated', 'Work schedule updated.');
  }

  deleteWorkSchedule(id: string) {
    this.workSchedules.update(list => list.filter(ws => ws.id !== id));
    this.notify.warning('hr.att.schedule.msg_deleted', 'Work schedule removed.');
  }

  // ─── Attendance Record CRUD ───
  addAttendanceRecord(rec: Partial<AttendanceRecord>): boolean {
    const exists = this.attendanceRecords().some(r => r.employeeId === rec.employeeId && r.date === rec.date);
    if (exists) {
      this.notify.danger('hr.att.daily.err_duplicate', 'Attendance record already exists for this employee on this date.');
      return false;
    }
    const wh = this.calcWorkingHours(rec.clockIn, rec.clockOut);
    this.attendanceRecords.update(list => [...list, {
      id: `att-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: rec.employeeId || '', employeeName: rec.employeeName || '',
      employeeNumber: rec.employeeNumber, departmentName: rec.departmentName,
      shiftName: rec.shiftName, date: rec.date || new Date().toISOString().split('T')[0],
      clockIn: rec.clockIn, clockOut: rec.clockOut, workingHours: wh,
      lateMinutes: rec.lateMinutes ?? 0, earlyLeaveMinutes: rec.earlyLeaveMinutes ?? 0,
      overtimeHours: rec.overtimeHours ?? 0, status: rec.status || 'Present', source: rec.source || 'Manual'
    }]);
    this.notify.success('hr.att.daily.msg_added', 'Attendance record added.');
    return true;
  }

  updateAttendanceRecord(id: string, changes: Partial<AttendanceRecord>) {
    this.attendanceRecords.update(list => list.map(r => r.id === id ? { ...r, ...changes } : r));
    this.notify.success('hr.att.daily.msg_updated', 'Record updated.');
  }

  deleteAttendanceRecord(id: string) {
    this.attendanceRecords.update(list => list.filter(r => r.id !== id));
    this.notify.warning('hr.att.daily.msg_deleted', 'Record removed.');
  }

  calcWorkingHours(clockIn?: string, clockOut?: string): number {
    if (!clockIn || !clockOut) return 0;
    const [h1, m1] = clockIn.split(':').map(Number);
    const [h2, m2] = clockOut.split(':').map(Number);
    const mins = (h2 * 60 + m2) - (h1 * 60 + m1);
    return Math.max(0, Math.round((mins / 60) * 10) / 10);
  }

  // ─── Overtime CRUD ───
  addOvertimeRequest(ot: Partial<OvertimeRequest>) {
    this.overtimeRequests.update(list => [...list, {
      id: `ot-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: ot.employeeId || '', employeeName: ot.employeeName || '',
      employeeNumber: ot.employeeNumber, departmentName: ot.departmentName,
      date: ot.date || '', type: ot.type || 'Weekday',
      requestedHours: ot.requestedHours || 0, reason: ot.reason || '',
      status: 'Pending', submittedDate: new Date().toISOString().split('T')[0],
      hourlyRate: ot.hourlyRate
    }]);
    this.notify.success('hr.att.overtime.msg_added', 'Overtime request submitted.');
  }

  approveOvertime(id: string, approvedHours: number, approver: string) {
    this.overtimeRequests.update(list => list.map(ot => ot.id === id ? {
      ...ot, status: 'Approved' as const, approvedHours,
      approvedBy: approver, approvedDate: new Date().toISOString().split('T')[0],
      totalAmount: approvedHours * (ot.hourlyRate ?? 0)
    } : ot));
    this.notify.success('hr.att.overtime.msg_approved', 'Overtime approved.');
  }

  rejectOvertime(id: string, reason: string, rejector: string) {
    this.overtimeRequests.update(list => list.map(ot => ot.id === id ? {
      ...ot, status: 'Rejected' as const, rejectionReason: reason,
      approvedBy: rejector, approvedDate: new Date().toISOString().split('T')[0]
    } : ot));
    this.notify.warning('hr.att.overtime.msg_rejected', 'Overtime rejected.');
  }

  // ─── Permission CRUD ───
  addPermissionRequest(pm: Partial<PermissionRequest>) {
    const from = pm.timeFrom || '00:00'; const to = pm.timeTo || '00:00';
    const [h1, m1] = from.split(':').map(Number); const [h2, m2] = to.split(':').map(Number);
    const duration = (h2 * 60 + m2) - (h1 * 60 + m1);
    this.permissionRequests.update(list => [...list, {
      id: `pm-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: pm.employeeId || '', employeeName: pm.employeeName || '',
      employeeNumber: pm.employeeNumber, departmentName: pm.departmentName,
      date: pm.date || '', type: pm.type || 'Personal',
      timeFrom: from, timeTo: to, durationMinutes: Math.max(0, duration),
      reason: pm.reason || '', attachment: pm.attachment,
      status: 'Pending', submittedDate: new Date().toISOString().split('T')[0]
    }]);
    this.notify.success('hr.att.permission.msg_added', 'Permission request submitted.');
  }

  approvePermission(id: string, approver: string) {
    this.permissionRequests.update(list => list.map(pm => pm.id === id ? {
      ...pm, status: 'Approved' as const,
      approvedBy: approver, approvedDate: new Date().toISOString().split('T')[0]
    } : pm));
    this.notify.success('hr.att.permission.msg_approved', 'Permission approved.');
  }

  rejectPermission(id: string, reason: string, rejector: string) {
    this.permissionRequests.update(list => list.map(pm => pm.id === id ? {
      ...pm, status: 'Rejected' as const, rejectionReason: reason,
      approvedBy: rejector, approvedDate: new Date().toISOString().split('T')[0]
    } : pm));
    this.notify.warning('hr.att.permission.msg_rejected', 'Permission rejected.');
  }

  // ─── Business Trip CRUD ───
  addBusinessTrip(trip: Partial<BusinessTrip>) {
    const start = new Date(trip.startDate || ''); const end = new Date(trip.endDate || '');
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    this.businessTrips.update(list => [...list, {
      id: `bt-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: trip.employeeId || '', employeeName: trip.employeeName || '',
      employeeNumber: trip.employeeNumber, departmentName: trip.departmentName,
      destination: trip.destination || '', projectName: trip.projectName,
      purpose: trip.purpose || '', startDate: trip.startDate || '', endDate: trip.endDate || '',
      durationDays: days, transportation: trip.transportation || 'Air',
      accommodation: trip.accommodation, dailyAllowance: trip.dailyAllowance ?? 0,
      totalAllowance: (trip.dailyAllowance ?? 0) * days,
      status: 'Draft', submittedDate: new Date().toISOString().split('T')[0], notes: trip.notes
    }]);
    this.notify.success('hr.att.trip.msg_added', 'Business trip request created.');
  }

  submitTrip(id: string) {
    this.businessTrips.update(list => list.map(t => t.id === id ? { ...t, status: 'Pending' as const } : t));
    this.notify.success('hr.att.trip.msg_submitted', 'Business trip submitted for approval.');
  }

  approveTrip(id: string, approver: string) {
    this.businessTrips.update(list => list.map(t => t.id === id ? {
      ...t, status: 'Approved' as const,
      approvedBy: approver, approvedDate: new Date().toISOString().split('T')[0]
    } : t));
    this.notify.success('hr.att.trip.msg_approved', 'Business trip approved.');
  }

  rejectTrip(id: string, reason: string, rejector: string) {
    this.businessTrips.update(list => list.map(t => t.id === id ? {
      ...t, status: 'Cancelled' as const, rejectionReason: reason,
      approvedBy: rejector, approvedDate: new Date().toISOString().split('T')[0]
    } : t));
    this.notify.warning('hr.att.trip.msg_rejected', 'Business trip cancelled.');
  }

  // ─── Exception CRUD ───
  resolveException(id: string, resolver: string, correctedIn?: string, correctedOut?: string) {
    this.attendanceExceptions.update(list => list.map(ex => ex.id === id ? {
      ...ex, status: 'Resolved' as const, resolvedBy: resolver,
      resolvedDate: new Date().toISOString().split('T')[0],
      correctedClockIn: correctedIn, correctedClockOut: correctedOut
    } : ex));
    this.notify.success('hr.att.exception.msg_resolved', 'Exception resolved.');
  }

  rejectException(id: string) {
    this.attendanceExceptions.update(list => list.map(ex => ex.id === id ? { ...ex, status: 'Rejected' as const } : ex));
    this.notify.warning('hr.att.exception.msg_rejected', 'Exception rejected.');
  }

  // ═══════════════════════════════════════════════════════════════════
  // PAYROLL MODULE
  // ═══════════════════════════════════════════════════════════════════

  // ── Salary Structures ───────────────────────────────────────────────
  readonly salaryStructures = signal<SalaryStructure[]>([
    { id: 'ss1', employeeId: 'emp1', employeeName: 'Ahmad Al-Dosari', employeeNumber: 'EMP-2026-001', departmentId: 'dept2', departmentName: 'Drilling', jobTitle: 'Senior Drilling Engineer', basicSalary: 12000, housingAllowance: 3000, transportationAllowance: 800, foodAllowance: 500, mobileAllowance: 200, otherAllowances: 300, socialInsurance: 450, incomeTax: 0, loanDeduction: 1000, penaltyAmount: 0, bonusAmount: 500, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 75, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 600, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss2', employeeId: 'emp2', employeeName: 'Sarah Al-Qahtani', employeeNumber: 'EMP-2026-002', departmentId: 'dept1', departmentName: 'HR', jobTitle: 'HR Manager', basicSalary: 15000, housingAllowance: 4000, transportationAllowance: 1000, foodAllowance: 600, mobileAllowance: 300, otherAllowances: 0, socialInsurance: 562, incomeTax: 0, loanDeduction: 0, penaltyAmount: 0, bonusAmount: 1000, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 93, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 750, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss3', employeeId: 'emp3', employeeName: 'Mohammed Al-Zahrani', employeeNumber: 'EMP-2026-003', departmentId: 'dept2', departmentName: 'Drilling', jobTitle: 'Drilling Engineer', basicSalary: 10000, housingAllowance: 2500, transportationAllowance: 700, foodAllowance: 400, mobileAllowance: 150, otherAllowances: 0, socialInsurance: 375, incomeTax: 0, loanDeduction: 500, penaltyAmount: 0, bonusAmount: 0, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 62, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 500, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss4', employeeId: 'emp4', employeeName: 'Fatima Al-Otaibi', employeeNumber: 'EMP-2026-004', departmentId: 'dept3', departmentName: 'Finance', jobTitle: 'Financial Controller', basicSalary: 18000, housingAllowance: 4500, transportationAllowance: 1200, foodAllowance: 700, mobileAllowance: 400, otherAllowances: 500, socialInsurance: 675, incomeTax: 0, loanDeduction: 2000, penaltyAmount: 0, bonusAmount: 2000, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 112, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 900, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss5', employeeId: 'emp5', employeeName: 'Khalid Al-Shehri', employeeNumber: 'EMP-2026-005', departmentId: 'dept4', departmentName: 'Operations', jobTitle: 'Operations Manager', basicSalary: 20000, housingAllowance: 5000, transportationAllowance: 1500, foodAllowance: 800, mobileAllowance: 500, otherAllowances: 1000, socialInsurance: 750, incomeTax: 0, loanDeduction: 0, penaltyAmount: 0, bonusAmount: 2500, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 125, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 1000, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss6', employeeId: 'emp6', employeeName: 'Omar Al-Ghamdi', employeeNumber: 'EMP-2026-006', departmentId: 'dept5', departmentName: 'HSE', jobTitle: 'Safety Engineer', basicSalary: 9000, housingAllowance: 2000, transportationAllowance: 600, foodAllowance: 350, mobileAllowance: 150, otherAllowances: 0, socialInsurance: 337, incomeTax: 0, loanDeduction: 750, penaltyAmount: 200, bonusAmount: 0, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 56, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 450, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss7', employeeId: 'emp7', employeeName: 'Nora Al-Rashidi', employeeNumber: 'EMP-2026-007', departmentId: 'dept1', departmentName: 'HR', jobTitle: 'Recruitment Specialist', basicSalary: 8000, housingAllowance: 2000, transportationAllowance: 500, foodAllowance: 300, mobileAllowance: 100, otherAllowances: 0, socialInsurance: 300, incomeTax: 0, loanDeduction: 0, penaltyAmount: 0, bonusAmount: 300, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 50, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 400, status: 'Active', effectiveFrom: '2026-01-01' },
    { id: 'ss8', employeeId: 'emp8', employeeName: 'Abdullah Al-Harbi', employeeNumber: 'EMP-2026-008', departmentId: 'dept6', departmentName: 'Maintenance', jobTitle: 'Maintenance Supervisor', basicSalary: 11000, housingAllowance: 2750, transportationAllowance: 750, foodAllowance: 450, mobileAllowance: 200, otherAllowances: 250, socialInsurance: 412, incomeTax: 0, loanDeduction: 500, penaltyAmount: 0, bonusAmount: 500, overtimeRateMultiplier: 1.5, lateDeductionRule: 'Per Hour', lateDeductionAmount: 68, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 550, status: 'Active', effectiveFrom: '2026-01-01' },
  ]);

  // ── Payroll Records (6 months × 8 employees) ────────────────────────
  readonly payrollRecords = signal<PayrollRecord[]>(this._generateMockPayrollRecords());

  private _generateMockPayrollRecords(): PayrollRecord[] {
    const records: PayrollRecord[] = [];
    const periods = [
      { month: 1, year: 2026, label: 'January 2026' },
      { month: 2, year: 2026, label: 'February 2026' },
      { month: 3, year: 2026, label: 'March 2026' },
      { month: 4, year: 2026, label: 'April 2026' },
      { month: 5, year: 2026, label: 'May 2026' },
      { month: 6, year: 2026, label: 'June 2026' },
    ];
    const structures = [
      { empId: 'emp1', empName: 'Ahmad Al-Dosari', empNum: 'EMP-2026-001', dept: 'Drilling', job: 'Sr. Drilling Engineer', basic: 12000, housing: 3000, transport: 800, food: 500, mobile: 200, other: 300, bonus: 500, insurance: 450, tax: 0, loan: 1000, penalty: 0, otRate: 1.5, lateDedPerHr: 75, absenceDedPerDay: 600 },
      { empId: 'emp2', empName: 'Sarah Al-Qahtani', empNum: 'EMP-2026-002', dept: 'HR', job: 'HR Manager', basic: 15000, housing: 4000, transport: 1000, food: 600, mobile: 300, other: 0, bonus: 1000, insurance: 562, tax: 0, loan: 0, penalty: 0, otRate: 1.5, lateDedPerHr: 93, absenceDedPerDay: 750 },
      { empId: 'emp3', empName: 'Mohammed Al-Zahrani', empNum: 'EMP-2026-003', dept: 'Drilling', job: 'Drilling Engineer', basic: 10000, housing: 2500, transport: 700, food: 400, mobile: 150, other: 0, bonus: 0, insurance: 375, tax: 0, loan: 500, penalty: 0, otRate: 1.5, lateDedPerHr: 62, absenceDedPerDay: 500 },
      { empId: 'emp4', empName: 'Fatima Al-Otaibi', empNum: 'EMP-2026-004', dept: 'Finance', job: 'Financial Controller', basic: 18000, housing: 4500, transport: 1200, food: 700, mobile: 400, other: 500, bonus: 2000, insurance: 675, tax: 0, loan: 2000, penalty: 0, otRate: 1.5, lateDedPerHr: 112, absenceDedPerDay: 900 },
      { empId: 'emp5', empName: 'Khalid Al-Shehri', empNum: 'EMP-2026-005', dept: 'Operations', job: 'Operations Manager', basic: 20000, housing: 5000, transport: 1500, food: 800, mobile: 500, other: 1000, bonus: 2500, insurance: 750, tax: 0, loan: 0, penalty: 0, otRate: 1.5, lateDedPerHr: 125, absenceDedPerDay: 1000 },
      { empId: 'emp6', empName: 'Omar Al-Ghamdi', empNum: 'EMP-2026-006', dept: 'HSE', job: 'Safety Engineer', basic: 9000, housing: 2000, transport: 600, food: 350, mobile: 150, other: 0, bonus: 0, insurance: 337, tax: 0, loan: 750, penalty: 200, otRate: 1.5, lateDedPerHr: 56, absenceDedPerDay: 450 },
      { empId: 'emp7', empName: 'Nora Al-Rashidi', empNum: 'EMP-2026-007', dept: 'HR', job: 'Recruitment Specialist', basic: 8000, housing: 2000, transport: 500, food: 300, mobile: 100, other: 0, bonus: 300, insurance: 300, tax: 0, loan: 0, penalty: 0, otRate: 1.5, lateDedPerHr: 50, absenceDedPerDay: 400 },
      { empId: 'emp8', empName: 'Abdullah Al-Harbi', empNum: 'EMP-2026-008', dept: 'Maintenance', job: 'Maintenance Supervisor', basic: 11000, housing: 2750, transport: 750, food: 450, mobile: 200, other: 250, bonus: 500, insurance: 412, tax: 0, loan: 500, penalty: 0, otRate: 1.5, lateDedPerHr: 68, absenceDedPerDay: 550 },
    ];
    let recNum = 1;
    periods.forEach(period => {
      structures.forEach(st => {
        const workingDays = 22;
        const presentDays = Math.floor(Math.random() * 4) + 19; // 19-22
        const absentDays = workingDays - presentDays;
        const lateHours = Math.random() < 0.4 ? parseFloat((Math.random() * 3).toFixed(1)) : 0;
        const otHours = Math.random() < 0.5 ? parseFloat((Math.random() * 8 + 2).toFixed(1)) : 0;
        const leaveDays = Math.random() < 0.2 ? 1 : 0;

        const hourlyRate = st.basic / 22 / 8;
        const otPay = parseFloat((otHours * hourlyRate * st.otRate).toFixed(2));
        const lateDed = parseFloat((lateHours * st.lateDedPerHr).toFixed(2));
        const absenceDed = parseFloat((absentDays * st.absenceDedPerDay).toFixed(2));

        const grossSalary = st.basic + st.housing + st.transport + st.food + st.mobile + st.other + st.bonus + otPay;
        const totalDeductions = lateDed + absenceDed + st.insurance + st.tax + st.loan + st.penalty;
        const netSalary = parseFloat((grossSalary - totalDeductions).toFixed(2));

        const isOld = period.month < 6;
        const status: PayrollRecord['status'] = isOld ? (Math.random() > 0.1 ? 'Paid' : 'Approved') : (period.month === 6 ? (Math.random() > 0.5 ? 'Approved' : 'Pending Approval') : 'Draft');

        records.push({
          id: `pr-${period.year}-${period.month}-${st.empId}`,
          payrollRunId: `run-${period.year}-${period.month}`,
          payrollNumber: `PAY-${period.year}-${String(period.month).padStart(2,'0')}-${String(recNum).padStart(3,'0')}`,
          employeeId: st.empId, employeeName: st.empName, employeeNumber: st.empNum,
          departmentName: st.dept, jobTitle: st.job,
          month: period.month, year: period.year, periodLabel: period.label,
          workingDays, presentDays, absentDays, lateHours, earlyLeaveHours: 0, overtimeHours: otHours, leaveDays,
          basicSalary: st.basic, housingAllowance: st.housing, transportationAllowance: st.transport,
          foodAllowance: st.food, mobileAllowance: st.mobile, otherAllowances: st.other,
          overtimePay: otPay, bonusAmount: st.bonus, grossSalary: parseFloat(grossSalary.toFixed(2)),
          lateDeduction: lateDed, absenceDeduction: absenceDed, socialInsurance: st.insurance,
          incomeTax: st.tax, loanDeduction: st.loan, penaltyAmount: st.penalty,
          totalDeductions: parseFloat(totalDeductions.toFixed(2)), netSalary,
          status,
          generatedAt: `${period.year}-${String(period.month).padStart(2,'0')}-28`,
          generatedBy: 'System',
          approvedAt: isOld ? `${period.year}-${String(period.month).padStart(2,'0')}-30` : undefined,
          approvedBy: isOld ? 'HR Manager' : undefined,
        });
        recNum++;
      });
    });
    return records;
  }

  // ── Payroll Computed Signals ─────────────────────────────────────────
  readonly currentMonthPayroll = computed(() => {
    const now = new Date();
    return this.payrollRecords().filter(r => r.month === now.getMonth() + 1 && r.year === now.getFullYear());
  });

  readonly totalMonthlyCost = computed(() =>
    this.currentMonthPayroll().reduce((s, r) => s + r.netSalary, 0)
  );

  readonly employeesPaid = computed(() =>
    this.currentMonthPayroll().filter(r => r.status === 'Paid').length
  );

  readonly pendingPayroll = computed(() =>
    this.payrollRecords().filter(r => r.status === 'Draft' || r.status === 'Pending Approval').length
  );

  readonly averageSalary = computed(() => {
    const recs = this.currentMonthPayroll();
    return recs.length ? Math.round(recs.reduce((s, r) => s + r.netSalary, 0) / recs.length) : 0;
  });

  readonly totalOvertimePay = computed(() =>
    this.currentMonthPayroll().reduce((s, r) => s + r.overtimePay, 0)
  );

  readonly totalDeductionsMonth = computed(() =>
    this.currentMonthPayroll().reduce((s, r) => s + r.totalDeductions, 0)
  );

  // ── Payroll CRUD ────────────────────────────────────────────────────
  addSalaryStructure(ss: Partial<SalaryStructure>) {
    const exists = this.salaryStructures().find(s => s.employeeId === ss.employeeId && s.status === 'Active');
    if (exists) { this.notify.warning('hr.payroll.err_duplicate', 'Salary structure exists.'); return false; }
    const newSS: SalaryStructure = {
      id: `ss-${Date.now()}`, status: 'Active', effectiveFrom: new Date().toISOString().split('T')[0],
      basicSalary: 0, housingAllowance: 0, transportationAllowance: 0, foodAllowance: 0,
      mobileAllowance: 0, otherAllowances: 0, socialInsurance: 0, incomeTax: 0,
      loanDeduction: 0, penaltyAmount: 0, bonusAmount: 0, overtimeRateMultiplier: 1.5,
      lateDeductionRule: 'Per Hour', lateDeductionAmount: 0, absenceDeductionRule: 'Per Day', absenceDeductionAmount: 0,
      employeeId: '', employeeName: '', ...ss
    };
    this.salaryStructures.update(list => [...list, newSS]);
    this.notify.success('hr.payroll.msg_saved', 'Salary structure saved.');
    return true;
  }

  updateSalaryStructure(id: string, changes: Partial<SalaryStructure>) {
    this.salaryStructures.update(list => list.map(s => s.id === id ? { ...s, ...changes, updatedAt: new Date().toISOString() } : s));
    this.notify.success('hr.payroll.msg_saved', 'Salary structure updated.');
  }

  deleteSalaryStructure(id: string) {
    this.salaryStructures.update(list => list.filter(s => s.id !== id));
    this.notify.warning('hr.payroll.msg_deleted', 'Salary structure removed.');
  }

  generatePayroll(month: number, year: number, deptId?: string): boolean {
    const structures = deptId ? this.salaryStructures().filter(s => s.departmentId === deptId) : this.salaryStructures();
    const activeStructures = structures.filter(s => s.status === 'Active');
    if (!activeStructures.length) { this.notify.warning('hr.payroll.run_no_active_emp', 'No active employees.'); return false; }

    let added = 0;
    activeStructures.forEach(ss => {
      const exists = this.payrollRecords().find(r => r.employeeId === ss.employeeId && r.month === month && r.year === year);
      if (exists) return;

      const workingDays = 22;
      const presentDays = 21; const absentDays = 1;
      const lateHours = 0.5; const otHours = 4;
      const hourlyRate = ss.basicSalary / 22 / 8;
      const otPay = parseFloat((otHours * hourlyRate * ss.overtimeRateMultiplier).toFixed(2));
      const lateDed = parseFloat((lateHours * ss.lateDeductionAmount).toFixed(2));
      const absenceDed = parseFloat((absentDays * ss.absenceDeductionAmount).toFixed(2));
      const grossSalary = ss.basicSalary + ss.housingAllowance + ss.transportationAllowance + ss.foodAllowance + ss.mobileAllowance + ss.otherAllowances + ss.bonusAmount + otPay;
      const totalDeductions = lateDed + absenceDed + ss.socialInsurance + ss.incomeTax + ss.loanDeduction + ss.penaltyAmount;
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

      this.payrollRecords.update(list => [...list, {
        id: `pr-${year}-${month}-${ss.employeeId}-${Date.now()}`,
        payrollRunId: `run-${year}-${month}`, payrollNumber: `PAY-${year}-${String(month).padStart(2,'0')}-${String(list.length+1).padStart(3,'0')}`,
        employeeId: ss.employeeId, employeeName: ss.employeeName, employeeNumber: ss.employeeNumber,
        departmentId: ss.departmentId, departmentName: ss.departmentName, jobTitle: ss.jobTitle,
        month, year, periodLabel: `${months[month-1]} ${year}`,
        workingDays, presentDays, absentDays, lateHours, earlyLeaveHours: 0, overtimeHours: otHours, leaveDays: 0,
        basicSalary: ss.basicSalary, housingAllowance: ss.housingAllowance, transportationAllowance: ss.transportationAllowance,
        foodAllowance: ss.foodAllowance, mobileAllowance: ss.mobileAllowance, otherAllowances: ss.otherAllowances,
        overtimePay: otPay, bonusAmount: ss.bonusAmount, grossSalary: parseFloat(grossSalary.toFixed(2)),
        lateDeduction: lateDed, absenceDeduction: absenceDed, socialInsurance: ss.socialInsurance,
        incomeTax: ss.incomeTax, loanDeduction: ss.loanDeduction, penaltyAmount: ss.penaltyAmount,
        totalDeductions: parseFloat(totalDeductions.toFixed(2)), netSalary: parseFloat((grossSalary - totalDeductions).toFixed(2)),
        status: 'Draft', generatedAt: new Date().toISOString().split('T')[0], generatedBy: 'HR System',
      }]);
      added++;
    });

    if (added > 0) this.notify.success('hr.payroll.run_generated', `Generated ${added} payroll records.`);
    else this.notify.warning('hr.payroll.run_already_exists', 'Payroll already exists for this period.');
    return added > 0;
  }

  approvePayrollRecord(id: string) {
    this.payrollRecords.update(list => list.map(r =>
      r.id === id && r.status !== 'Approved' && r.status !== 'Paid'
        ? { ...r, status: 'Approved' as const, approvedAt: new Date().toISOString().split('T')[0], approvedBy: 'HR Manager' }
        : r
    ));
    this.notify.success('hr.payroll.msg_approved', 'Payroll approved.');
  }

  approveAllPayroll(month: number, year: number) {
    this.payrollRecords.update(list => list.map(r =>
      r.month === month && r.year === year && r.status === 'Pending Approval'
        ? { ...r, status: 'Approved' as const, approvedAt: new Date().toISOString().split('T')[0], approvedBy: 'HR Manager' }
        : r
    ));
    this.notify.success('hr.payroll.run_approved', 'All payroll records approved.');
  }

  submitPayrollForApproval(month: number, year: number) {
    this.payrollRecords.update(list => list.map(r =>
      r.month === month && r.year === year && r.status === 'Draft'
        ? { ...r, status: 'Pending Approval' as const }
        : r
    ));
  }

  cancelPayrollRun(month: number, year: number) {
    this.payrollRecords.update(list => list.filter(r => !(r.month === month && r.year === year && (r.status === 'Draft' || r.status === 'Pending Approval'))));
    this.notify.warning('hr.payroll.run_cancelled', 'Payroll run cancelled.');
  }

  // ═══════════════════════════════════════════════
  // PERFORMANCE MANAGEMENT MODULE
  // ═══════════════════════════════════════════════

  private _rateScore(s: number): PerformanceRating {
    if (s >= 95) return 'Outstanding';
    if (s >= 85) return 'Excellent';
    if (s >= 75) return 'Very Good';
    if (s >= 65) return 'Good';
    if (s >= 55) return 'Acceptable';
    if (s >= 40) return 'Needs Improvement';
    return 'Unsatisfactory';
  }

  private _calcOverall(e: Partial<PerformanceEval>): number {
    const w = [10,10,10,10,10,10,10,10,10,5,5];
    const s = [e.technicalScore||0,e.qualityScore||0,e.productivityScore||0,e.communicationScore||0,e.leadershipScore||0,e.problemSolvingScore||0,e.disciplineScore||0,e.attendanceScore||0,e.teamworkScore||0,e.innovationScore||0,e.safetyScore||0];
    return parseFloat((s.reduce((acc,v,i) => acc + v * w[i] / 100, 0)).toFixed(1));
  }

  // ── Evaluation Templates ─────────────────────────────────────────
  readonly evalTemplates = signal<EvalTemplate[]>([
    { id: 'et1', name: 'Standard Annual Review', description: 'Comprehensive yearly evaluation', period: 'Annual 2026', departmentName: 'All', jobLevel: 'All', status: 'Active', allowSelfEvaluation: true, approvalRequired: true, createdAt: '2026-01-01', createdBy: 'HR Manager', criteria: [
      { id: 'c1', name: 'Technical Skills', weight: 20, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c2', name: 'Work Quality', weight: 20, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c3', name: 'Productivity', weight: 15, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c4', name: 'Communication', weight: 10, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c5', name: 'Teamwork', weight: 10, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c6', name: 'Leadership', weight: 10, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c7', name: 'Safety Compliance', weight: 10, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c8', name: 'Attendance', weight: 5, minScore: 0, maxScore: 100, allowComments: false },
    ]},
    { id: 'et2', name: 'Engineering Performance', description: 'For engineering roles', period: 'Q2 2026', departmentName: 'Drilling', jobLevel: 'Engineer', status: 'Active', allowSelfEvaluation: false, approvalRequired: true, createdAt: '2026-02-01', createdBy: 'HR Manager', criteria: [
      { id: 'c9', name: 'Technical Expertise', weight: 30, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c10', name: 'Problem Solving', weight: 25, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c11', name: 'Safety Compliance', weight: 25, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c12', name: 'Innovation', weight: 20, minScore: 0, maxScore: 100, allowComments: true },
    ]},
    { id: 'et3', name: 'Management Review', description: 'For managerial positions', period: 'Annual 2026', departmentName: 'All', jobLevel: 'Manager', status: 'Active', allowSelfEvaluation: true, approvalRequired: true, createdAt: '2026-01-15', createdBy: 'HR Manager', criteria: [
      { id: 'c13', name: 'Leadership', weight: 30, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c14', name: 'Team Development', weight: 20, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c15', name: 'Strategic Thinking', weight: 20, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c16', name: 'Communication', weight: 15, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c17', name: 'Results Delivery', weight: 15, minScore: 0, maxScore: 100, allowComments: true },
    ]},
    { id: 'et4', name: 'HSE Evaluation', description: 'Health, Safety & Environment assessment', period: 'Q1 2026', departmentName: 'HSE', jobLevel: 'All', status: 'Active', allowSelfEvaluation: false, approvalRequired: true, createdAt: '2026-01-20', createdBy: 'HR Manager', criteria: [
      { id: 'c18', name: 'Safety Knowledge', weight: 40, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c19', name: 'Incident Prevention', weight: 30, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c20', name: 'Reporting Accuracy', weight: 30, minScore: 0, maxScore: 100, allowComments: true },
    ]},
    { id: 'et5', name: 'Quarterly Quick Check', description: 'Short quarterly pulse review', period: 'Q3 2026', departmentName: 'All', jobLevel: 'All', status: 'Draft', allowSelfEvaluation: true, approvalRequired: false, createdAt: '2026-06-01', createdBy: 'HR Manager', criteria: [
      { id: 'c21', name: 'Goal Achievement', weight: 50, minScore: 0, maxScore: 100, allowComments: true },
      { id: 'c22', name: 'Behavior & Attitude', weight: 50, minScore: 0, maxScore: 100, allowComments: true },
    ]},
  ]);

  // ── Performance Evaluations (120 records) ────────────────────────
  readonly performanceEvals = signal<PerformanceEval[]>(this._generateEvals());

  private _generateEvals(): PerformanceEval[] {
    const employees = [
      { id:'emp1', name:'Ahmad Al-Dosari', num:'EMP-001', dept:'Drilling', mgr:'Khalid Al-Shehri', job:'Sr. Engineer' },
      { id:'emp2', name:'Sarah Al-Qahtani', num:'EMP-002', dept:'HR', mgr:'Omar Al-Ghamdi', job:'HR Manager' },
      { id:'emp3', name:'Mohammed Al-Zahrani', num:'EMP-003', dept:'Drilling', mgr:'Khalid Al-Shehri', job:'Engineer' },
      { id:'emp4', name:'Fatima Al-Otaibi', num:'EMP-004', dept:'Finance', mgr:'Nora Al-Rashidi', job:'Financial Controller' },
      { id:'emp5', name:'Khalid Al-Shehri', num:'EMP-005', dept:'Operations', mgr:'Abdullah Al-Harbi', job:'Ops Manager' },
      { id:'emp6', name:'Omar Al-Ghamdi', num:'EMP-006', dept:'HSE', mgr:'Abdullah Al-Harbi', job:'Safety Engineer' },
      { id:'emp7', name:'Nora Al-Rashidi', num:'EMP-007', dept:'HR', mgr:'Sarah Al-Qahtani', job:'Recruiter' },
      { id:'emp8', name:'Abdullah Al-Harbi', num:'EMP-008', dept:'Maintenance', mgr:'Khalid Al-Shehri', job:'Supervisor' },
      { id:'emp9', name:'Reem Al-Mutairi', num:'EMP-009', dept:'Finance', mgr:'Fatima Al-Otaibi', job:'Accountant' },
      { id:'emp10', name:'Turki Al-Anzi', num:'EMP-010', dept:'Operations', mgr:'Khalid Al-Shehri', job:'Operator' },
    ];
    const periods: PerformanceEval['period'][] = ['Annual 2025', 'Q1 2026', 'Q2 2026'];
    const statuses: PerformanceEval['status'][] = ['Approved','Approved','Approved','Pending Approval','Draft'];
    const evals: PerformanceEval[] = [];
    let n = 1;
    periods.forEach(period => {
      employees.forEach(emp => {
        const s = () => Math.round(60 + Math.random() * 40);
        const t=s(),q=s(),p=s(),c=s(),l=s(),ps=s(),d=s(),a=s(),tw=s(),inv=s(),sf=s();
        const overall = parseFloat(((t+q+p+c+l+ps+d+a+tw)*10/9 + inv*5/100 + sf*5/100).toFixed(1));
        const capped = Math.min(100, Math.round(overall));
        evals.push({
          id: `eval-${period.replace(' ','-')}-${emp.id}`,
          evalNumber: `EVAL-${n.toString().padStart(3,'0')}`,
          employeeId: emp.id, employeeName: emp.name, employeeNumber: emp.num,
          departmentName: emp.dept, managerId: 'mgr1', managerName: emp.mgr, jobTitle: emp.job,
          period, evalDate: '2026-06-15',
          technicalScore: t, qualityScore: q, productivityScore: p, communicationScore: c,
          leadershipScore: l, problemSolvingScore: ps, disciplineScore: d, attendanceScore: a,
          teamworkScore: tw, innovationScore: inv, safetyScore: sf,
          overallScore: capped,
          finalRating: this._rateScore(capped),
          finalComments: 'Employee demonstrates consistent performance and dedication.',
          managerRecommendation: capped >= 85 ? 'Recommend for promotion' : 'Continue current role',
          status: statuses[Math.floor(Math.random() * statuses.length)],
          managerApprovedAt: '2026-06-20', hrApprovedAt: '2026-06-25', hrApprovedBy: 'HR Manager',
          createdAt: '2026-06-10',
        });
        n++;
      });
    });
    return evals;
  }

  // ── Performance Goals (40) ───────────────────────────────────
  readonly performanceGoals = signal<PerformanceGoal[]>([
    { id:'g1', employeeId:'emp1', employeeName:'Ahmad Al-Dosari', departmentName:'Drilling', title:'Complete Advanced Drilling Certification', description:'Obtain advanced drilling certification by Q3', category:'Development', priority:'High', weight:30, startDate:'2026-01-01', endDate:'2026-09-30', period:'Annual 2026', targetValue:100, currentProgress:65, completionPct:65, status:'In Progress' },
    { id:'g2', employeeId:'emp1', employeeName:'Ahmad Al-Dosari', departmentName:'Drilling', title:'Reduce Drilling NPT by 15%', description:'Non-productive time reduction target', category:'Operational', priority:'Critical', weight:40, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:15, currentProgress:8, completionPct:53, status:'In Progress' },
    { id:'g3', employeeId:'emp2', employeeName:'Sarah Al-Qahtani', departmentName:'HR', title:'Implement E-Recruitment System', description:'Deploy digital recruitment platform', category:'Strategic', priority:'High', weight:35, startDate:'2026-01-01', endDate:'2026-06-30', period:'Annual 2026', targetValue:100, currentProgress:100, completionPct:100, status:'Completed' },
    { id:'g4', employeeId:'emp2', employeeName:'Sarah Al-Qahtani', departmentName:'HR', title:'Reduce Turnover Rate to 8%', description:'Improve employee retention programs', category:'Operational', priority:'High', weight:30, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:8, currentProgress:10, completionPct:60, status:'In Progress' },
    { id:'g5', employeeId:'emp3', employeeName:'Mohammed Al-Zahrani', departmentName:'Drilling', title:'Lead 3 Drilling Projects', description:'Project management experience', category:'Development', priority:'Medium', weight:25, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:3, currentProgress:2, completionPct:67, status:'In Progress' },
    { id:'g6', employeeId:'emp4', employeeName:'Fatima Al-Otaibi', departmentName:'Finance', title:'Implement Budget Control System', description:'Digital budget tracking and alerts', category:'Financial', priority:'Critical', weight:40, startDate:'2026-01-01', endDate:'2026-09-30', period:'Annual 2026', targetValue:100, currentProgress:80, completionPct:80, status:'In Progress' },
    { id:'g7', employeeId:'emp5', employeeName:'Khalid Al-Shehri', departmentName:'Operations', title:'Achieve 95% Equipment Uptime', description:'Minimize equipment downtime', category:'Operational', priority:'Critical', weight:45, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:95, currentProgress:92, completionPct:97, status:'In Progress' },
    { id:'g8', employeeId:'emp6', employeeName:'Omar Al-Ghamdi', departmentName:'HSE', title:'Zero LTI for 365 Days', description:'Lost-time injury free target', category:'Safety', priority:'Critical', weight:50, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:365, currentProgress:185, completionPct:51, status:'In Progress' },
    { id:'g9', employeeId:'emp6', employeeName:'Omar Al-Ghamdi', departmentName:'HSE', title:'Complete HSE Audits (12)', description:'Monthly site safety audits', category:'Safety', priority:'High', weight:30, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:12, currentProgress:6, completionPct:50, status:'In Progress' },
    { id:'g10', employeeId:'emp7', employeeName:'Nora Al-Rashidi', departmentName:'HR', title:'Hire 20 New Engineers', description:'Engineering recruitment drive', category:'Operational', priority:'High', weight:35, startDate:'2026-01-01', endDate:'2026-12-31', period:'Annual 2026', targetValue:20, currentProgress:14, completionPct:70, status:'In Progress' },
  ]);

  // ── Competency Records (sample) ──────────────────────────────
  readonly competencyRecords = signal<CompetencyRecord[]>([
    { id:'cr1', employeeId:'emp1', employeeName:'Ahmad Al-Dosari', employeeNumber:'EMP-001', departmentName:'Drilling', jobTitle:'Sr. Engineer', competencyType:'Technical', competencyName:'Drilling Technology', requiredLevel:'Expert', currentLevel:'Advanced', gap:'Minor', trainingNeeded:true, trainingCourse:'Advanced Drilling Workshop', assessedAt:'2026-06-01' },
    { id:'cr2', employeeId:'emp1', employeeName:'Ahmad Al-Dosari', employeeNumber:'EMP-001', departmentName:'Drilling', jobTitle:'Sr. Engineer', competencyType:'Safety', competencyName:'Well Control', requiredLevel:'Expert', currentLevel:'Expert', gap:'No Gap', trainingNeeded:false, assessedAt:'2026-06-01' },
    { id:'cr3', employeeId:'emp1', employeeName:'Ahmad Al-Dosari', employeeNumber:'EMP-001', departmentName:'Drilling', jobTitle:'Sr. Engineer', competencyType:'Software Skills', competencyName:'Drilling Software Suite', requiredLevel:'Advanced', currentLevel:'Intermediate', gap:'Moderate', trainingNeeded:true, trainingCourse:'Software Certification Program', assessedAt:'2026-06-01' },
    { id:'cr4', employeeId:'emp2', employeeName:'Sarah Al-Qahtani', employeeNumber:'EMP-002', departmentName:'HR', jobTitle:'HR Manager', competencyType:'Management', competencyName:'People Management', requiredLevel:'Expert', currentLevel:'Expert', gap:'No Gap', trainingNeeded:false, assessedAt:'2026-06-01' },
    { id:'cr5', employeeId:'emp2', employeeName:'Sarah Al-Qahtani', employeeNumber:'EMP-002', departmentName:'HR', jobTitle:'HR Manager', competencyType:'Leadership', competencyName:'Strategic Leadership', requiredLevel:'Advanced', currentLevel:'Intermediate', gap:'Moderate', trainingNeeded:true, trainingCourse:'Executive Leadership Program', assessedAt:'2026-06-01' },
    { id:'cr6', employeeId:'emp3', employeeName:'Mohammed Al-Zahrani', employeeNumber:'EMP-003', departmentName:'Drilling', jobTitle:'Engineer', competencyType:'Technical', competencyName:'Reservoir Engineering', requiredLevel:'Advanced', currentLevel:'Beginner', gap:'Critical', trainingNeeded:true, trainingCourse:'Reservoir Engineering Fundamentals', assessedAt:'2026-06-01' },
    { id:'cr7', employeeId:'emp4', employeeName:'Fatima Al-Otaibi', employeeNumber:'EMP-004', departmentName:'Finance', jobTitle:'Financial Controller', competencyType:'Technical', competencyName:'Financial Modeling', requiredLevel:'Expert', currentLevel:'Advanced', gap:'Minor', trainingNeeded:true, trainingCourse:'Advanced Financial Modeling', assessedAt:'2026-06-01' },
    { id:'cr8', employeeId:'emp5', employeeName:'Khalid Al-Shehri', employeeNumber:'EMP-005', departmentName:'Operations', jobTitle:'Ops Manager', competencyType:'Leadership', competencyName:'Operations Leadership', requiredLevel:'Expert', currentLevel:'Expert', gap:'No Gap', trainingNeeded:false, assessedAt:'2026-06-01' },
    { id:'cr9', employeeId:'emp6', employeeName:'Omar Al-Ghamdi', employeeNumber:'EMP-006', departmentName:'HSE', jobTitle:'Safety Engineer', competencyType:'Safety', competencyName:'NEBOSH / IOSH', requiredLevel:'Advanced', currentLevel:'Intermediate', gap:'Moderate', trainingNeeded:true, trainingCourse:'NEBOSH Certification', assessedAt:'2026-06-01' },
    { id:'cr10', employeeId:'emp7', employeeName:'Nora Al-Rashidi', employeeNumber:'EMP-007', departmentName:'HR', jobTitle:'Recruiter', competencyType:'Communication', competencyName:'Interviewing Skills', requiredLevel:'Advanced', currentLevel:'Advanced', gap:'No Gap', trainingNeeded:false, assessedAt:'2026-06-01' },
  ]);

  // ── Performance Computed Signals ──────────────────────────────═
  readonly totalEvaluated = computed(() => this.performanceEvals().filter(e => e.status === 'Approved').length);
  readonly pendingEvals = computed(() => this.performanceEvals().filter(e => e.status === 'Pending Approval' || e.status === 'In Progress').length);
  readonly completedEvals = computed(() => this.performanceEvals().filter(e => e.status === 'Approved').length);
  readonly avgPerfScore = computed(() => {
    const evals = this.performanceEvals().filter(e => e.overallScore > 0);
    return evals.length ? parseFloat((evals.reduce((s, e) => s + e.overallScore, 0) / evals.length).toFixed(1)) : 0;
  });
  readonly topPerformers = computed(() => this.performanceEvals().filter(e => e.finalRating === 'Outstanding' || e.finalRating === 'Excellent').length);
  readonly belowTargetEmployees = computed(() => this.performanceEvals().filter(e => e.finalRating === 'Needs Improvement' || e.finalRating === 'Unsatisfactory').length);

  // ── Performance CRUD ────────────────────────────═
  addEvalTemplate(t: Partial<EvalTemplate>) {
    const nt: EvalTemplate = { id: `et-${Date.now()}`, status: 'Draft', allowSelfEvaluation: false, approvalRequired: true, criteria: [], period: 'Annual 2026', name: '', createdAt: new Date().toISOString().split('T')[0], createdBy: 'HR', ...t };
    this.evalTemplates.update(list => [...list, nt]);
    this.notify.success('hr.performance.msg_saved', 'Template saved.');
  }

  updateEvalTemplate(id: string, changes: Partial<EvalTemplate>) {
    this.evalTemplates.update(list => list.map(t => t.id === id ? { ...t, ...changes } : t));
    this.notify.success('hr.performance.msg_saved', 'Template updated.');
  }

  deleteEvalTemplate(id: string) {
    this.evalTemplates.update(list => list.filter(t => t.id !== id));
    this.notify.warning('hr.performance.msg_saved', 'Template removed.');
  }

  approveEval(id: string) {
    this.performanceEvals.update(list => list.map(e =>
      e.id === id && e.status !== 'Approved'
        ? { ...e, status: 'Approved' as const, hrApprovedAt: new Date().toISOString().split('T')[0], hrApprovedBy: 'HR Manager' }
        : e
    ));
    this.notify.success('hr.performance.msg_approved', 'Evaluation approved.');
  }

  addGoal(g: Partial<PerformanceGoal>) {
    const ng: PerformanceGoal = { id: `g-${Date.now()}`, employeeId: '', employeeName: '', title: '', category: 'Operational', priority: 'Medium', weight: 20, startDate: '', endDate: '', period: 'Annual 2026', targetValue: 100, currentProgress: 0, completionPct: 0, status: 'Not Started', ...g };
    this.performanceGoals.update(list => [...list, ng]);
    this.notify.success('hr.performance.msg_saved', 'Goal added.');
  }

  updateGoal(id: string, changes: Partial<PerformanceGoal>) {
    this.performanceGoals.update(list => list.map(g => g.id === id ? { ...g, ...changes, updatedAt: new Date().toISOString() } : g));
    this.notify.success('hr.performance.msg_saved', 'Goal updated.');
  }

  deleteGoal(id: string) {
    this.performanceGoals.update(list => list.filter(g => g.id !== id));
  }
}

