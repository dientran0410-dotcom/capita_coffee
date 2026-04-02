import { http } from "../utils/axiosClient";

export interface StaffScheduleResponse {
  id: string;
  staffId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: string;
  status: string;
}

export interface StaffScheduleWithAttendanceResponse
  extends StaffScheduleResponse {
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "ABSENT";
}

export interface StaffScheduleRequest {
  staffId: string;
  shiftId: string;
  date: string;
  startTime: string;
  endTime: string;
  branchId: string;
}

/**
 * Get all schedules for a specific staff member
 */
export async function getSchedulesByStaffId(
  staffId: string
): Promise<StaffScheduleResponse[]> {
  const response = await http(
    `/shift-service/staff/${staffId}/schedules`
  );
  return response || [];
}

/**
 * Get schedules with attendance status for a specific staff member
 */
export async function getSchedulesWithAttendance(
  staffId: string
): Promise<StaffScheduleWithAttendanceResponse[]> {
  const response = await http(
    `/shift-service/staff-schedules/${staffId}`
  );
  return response || [];
}

/**
 * Create a new schedule for a staff member
 */
export async function createSchedule(
  staffId: string,
  request: StaffScheduleRequest
): Promise<StaffScheduleResponse> {
  const response = await http(`/shift-service/staff/${staffId}/schedules`, {
    method: "POST",
    data: request,
  });
  return response;
}

/**
 * Update an existing schedule
 */
export async function updateSchedule(
  scheduleId: string,
  request: StaffScheduleRequest
): Promise<StaffScheduleResponse> {
  const response = await http(`/shift-service/schedules/${scheduleId}`, {
    method: "PUT",
    data: request,
  });
  return response;
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string): Promise<void> {
  await http(`/shift-service/schedules/${scheduleId}`, {
    method: "DELETE",
  });
}
