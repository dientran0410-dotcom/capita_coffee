export interface Staff {
  staffId: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  status?: StaffStatus;
  branchId?: string;
  franchiseId?: string;
  hireDate?: string;
  avatar?: string;
  [key: string]: unknown;
}

export enum StaffStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED'
}

export interface CreateStaffRequest {
  fullName: string;
  email: string;
  phone?: string;
  position?: string;
  branchId?: string;
  franchiseId?: string;
  hireDate?: string;
}

export interface UpdateStaffRequest extends Partial<CreateStaffRequest> {
  status?: StaffStatus;
}

export interface StaffSchedule {
  scheduleId: string;
  staffId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  [key: string]: unknown;
}

export interface PaginatedStaff {
  content: Staff[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
