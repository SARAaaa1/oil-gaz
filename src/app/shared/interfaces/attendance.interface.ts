export type AttendanceStatus =
  | 'Present' | 'Absent' | 'Late' | 'Leave' | 'Business Trip'
  | 'Remote' | 'Holiday' | 'Weekend' | 'Half Day' | 'On Leave';

export type ExceptionType =
  | 'Missing Check-In' | 'Missing Check-Out' | 'Duplicate Punch' | 'Invalid Time';

export type ExceptionStatus = 'Pending' | 'Resolved' | 'Rejected';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentId?: string;
  departmentName?: string;
  locationId?: string;
  locationName?: string;
  shiftId?: string;
  shiftName?: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  workingHours?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  overtimeHours?: number;
  status: AttendanceStatus;
  source?: 'Manual' | 'ZKTeco' | 'System';
  notes?: string;
}

export interface AttendanceException {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName?: string;
  date: string;
  type: ExceptionType;
  description: string;
  status: ExceptionStatus;
  resolvedBy?: string;
  resolvedDate?: string;
  correctedClockIn?: string;
  correctedClockOut?: string;
  approvedBy?: string;
  notes?: string;
}

export interface AttendanceSummary {
  employeeId: string;
  employeeName: string;
  month: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  totalWorkingHours: number;
  totalOvertimeHours: number;
  totalLateMinutes: number;
  attendanceRate: number;
}
