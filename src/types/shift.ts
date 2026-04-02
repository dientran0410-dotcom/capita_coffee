export interface Shift {
  shiftId: string;
  shiftName: string;
  startTime: string;
  endTime: string;
  date?: string;
  branchId?: string;
  franchiseId?: string;
  status?: ShiftStatus;
  assignedStaff?: string[];
  [key: string]: unknown;
}

export enum ShiftStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface CreateShiftRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
  date?: string;
  branchId?: string;
  franchiseId?: string;
}

export interface UpdateShiftRequest extends Partial<CreateShiftRequest> {
  status?: ShiftStatus;
}

export interface ShiftDashboardData {
  totalShifts: number;
  activeShifts: number;
  completedShifts: number;
  staffAssigned: number;
  [key: string]: unknown;
}
