export type RigStatus = 'Active' | 'Maintenance' | 'Standby';

export interface Rig {
  id: string;
  rigName: string;
  location: string;
  status: RigStatus;
  drillDepthFt: number;
  crewCount: number;
  managerName: string;
}

export interface TimesheetDayRow {
  day: number;
  operatingHours: number;
  standbyHours: number;
  repairHours: number;
  downtimeHours: number;
  rigMoveHours: number;
  comments?: string;
}

export interface RigTimesheet {
  id: string;
  rigId: string;
  rigName: string;
  month: string;
  days: TimesheetDayRow[];
  totalOperatingHours: number;
  utilizationRate: number;
  downtimePercent: number;
}
