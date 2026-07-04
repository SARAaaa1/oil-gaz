export type OvertimeType = 'Weekday' | 'Weekend' | 'Holiday' | 'Night Shift';
export type OvertimeStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected' | 'Paid';

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName?: string;
  date: string;
  type: OvertimeType;
  requestedHours: number;
  approvedHours?: number;
  reason: string;
  status: OvertimeStatus;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  hourlyRate?: number;
  totalAmount?: number;
  attendanceRecordId?: string;
}

export type PermissionType = 'Late Arrival' | 'Early Leave' | 'Official Mission' | 'Medical' | 'Personal';
export type PermissionStatus = 'Pending' | 'Approved' | 'Rejected';

export interface PermissionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName?: string;
  date: string;
  type: PermissionType;
  timeFrom: string;
  timeTo: string;
  durationMinutes?: number;
  reason: string;
  attachment?: string;
  status: PermissionStatus;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
}

export type TripStatus = 'Draft' | 'Pending' | 'Approved' | 'In Progress' | 'Completed' | 'Cancelled';
export type TransportationType = 'Air' | 'Land' | 'Sea' | 'Company Vehicle';

export interface BusinessTrip {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName?: string;
  destination: string;
  projectId?: string;
  projectName?: string;
  purpose: string;
  startDate: string;
  endDate: string;
  durationDays?: number;
  transportation: TransportationType;
  accommodation?: string;
  dailyAllowance?: number;
  totalAllowance?: number;
  status: TripStatus;
  submittedDate: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  notes?: string;
}

export interface AttendanceImportRecord {
  id: string;
  employeeNumber: string;
  employeeName?: string;
  employeeId?: string;
  date: string;
  time: string;
  deviceId?: string;
  verifyMode?: string;
  status: 'Valid' | 'Invalid' | 'Duplicate' | 'Unknown Employee';
  errorMessage?: string;
}

export interface AttendanceImportResult {
  fileName: string;
  importDate: string;
  totalRecords: number;
  successRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  unknownEmployees: number;
  records: AttendanceImportRecord[];
}
