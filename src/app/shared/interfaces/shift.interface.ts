export type ShiftType = 'Fixed' | 'Rotary' | 'Flexible' | 'Night' | 'Split';
export type ShiftStatus = 'Active' | 'Inactive' | 'Draft';
export type LatePolicy = 'Warning' | 'Deduction' | 'None';
export type EarlyLeavePolicy = 'Warning' | 'Deduction' | 'None';

export interface Shift {
  id: string;
  code: string;
  name: string;
  arabicName: string;
  type: ShiftType;
  startTime: string;        // HH:mm
  endTime: string;          // HH:mm
  breakMinutes: number;
  gracePeriodMinutes: number;
  latePolicy: LatePolicy;
  earlyLeavePolicy: EarlyLeavePolicy;
  minWorkingHours: number;
  maxWorkingHours: number;
  isNightShift: boolean;
  isFlexible: boolean;
  status: ShiftStatus;
  color?: string;
  description?: string;
}

export type ScheduleType = 'Weekly' | 'Monthly' | 'Rotation';
export type ScheduleAssignType = 'Department' | 'Employee' | 'Location';

export interface WorkSchedule {
  id: string;
  name: string;
  arabicName: string;
  type: ScheduleType;
  shiftId: string;
  shiftName?: string;
  assignType: ScheduleAssignType;
  assignedToId: string;
  assignedToName?: string;
  effectiveFrom: string;
  effectiveTo?: string;
  workDays: string[];       // ['Sun','Mon','Tue','Wed','Thu']
  status: 'Active' | 'Inactive';
}
