export interface Attendance {
  attendanceId: string;
  staffId: string;
  shiftId: string;
  checkInTime?: string;
  checkOutTime?: string;
  status: AttendanceStatus;
  date: string;
  notes?: string;
  [key: string]: unknown;
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EARLY_LEAVE = 'EARLY_LEAVE',
  ON_LEAVE = 'ON_LEAVE'
}

export interface AttendanceReport {
  staffId: string;
  staffName?: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  onLeaveDays: number;
  attendanceRate: number;
  [key: string]: unknown;
}

export interface ShiftAttendance {
  shiftId: string;
  shiftName?: string;
  date: string;
  attendances: Attendance[];
  totalStaff: number;
  presentStaff: number;
  [key: string]: unknown;
}

export interface DashboardOverview {
  totalStaff: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  date: string;
  [key: string]: unknown;
}
