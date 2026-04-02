import { http } from '../utils/axiosClient';

// Đã thêm branchId vào tham số và URL
export async function getShiftsByDate(date: string, branchId?: string) {
  let url = `/shifts?date=${encodeURIComponent(date)}`;
  if (branchId !== undefined && branchId !== null && branchId.trim() !== "") {
    url += `&branchId=${encodeURIComponent(branchId)}`;
  }
  return http(url);
}

export async function getShiftById(id: string) {
  return http(`/shifts/${id}`);
}

export async function createShift(payload: Record<string, unknown>) {
  return http('/shifts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateShift(id: string, payload: Record<string, unknown>) {
  return http(`/shifts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteShift(id: string) {
  return http(`/shifts/${id}`, { method: 'DELETE' });
}

export async function fetchStaffByShift(shiftId: string) {
  return http(`/shifts/${shiftId}/staff`);
}

export async function assignStaffToShift(
  shiftId: string,
  staffPayload: unknown
) {
  return http(`/shifts/${shiftId}/assign`, {
    method: 'POST',
    body: JSON.stringify(staffPayload),
  });
}

export async function getShiftDashboardOverview(date: string) {
  return http(`/attendance-reports/dashboard?date=${date}`);
}
