﻿import { http } from '../utils/axiosClient';

interface AttendanceRecord {
  staffId?: string;
  status?: string;
  [key: string]: unknown;
}

export async function getStaffWorkingToday(branchId?: string) {
  // Get today's date in YYYY-MM-DD format
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Get shifts for today
  let shiftsUrl = `/shifts?date=${encodeURIComponent(dateStr)}`;
  if (branchId) {
    shiftsUrl += `&branchId=${encodeURIComponent(branchId)}`;
  }

  const shiftsResponse = await http(shiftsUrl);
  const shifts = shiftsResponse?.result ?? shiftsResponse?.data?.result ?? shiftsResponse?.data ?? shiftsResponse ?? [];

  if (!Array.isArray(shifts) || shifts.length === 0) {
    return 0;
  }

  // Get attendance for each shift and count unique staff
  const staffIds = new Set<string>();

  for (const shift of shifts) {
    try {
      const attendanceResponse = await http(`/api/shift-service/shifts/${shift.id}/attendance`);
      const attendanceList = attendanceResponse?.result ?? attendanceResponse?.data?.result ?? attendanceResponse?.data ?? attendanceResponse ?? [];

      if (Array.isArray(attendanceList)) {
        attendanceList.forEach((attendance: AttendanceRecord) => {
          if (attendance.staffId && attendance.status === 'PRESENT') {
            staffIds.add(attendance.staffId);
          }
        });
      }
    } catch (error) {
      console.error(`Error fetching attendance for shift ${shift.id}:`, error);
    }
  }

  return staffIds.size;
}

export async function getAttendanceReport(params: {
  month?: number;
  year?: number;
  branchId?: string;
}) {
  const q = new URLSearchParams();
  if (params.month) q.append('month', String(params.month));
  if (params.year) q.append('year', String(params.year));
  if (params.branchId) q.append('branchId', params.branchId);
  
  // Đã sửa chuẩn URL
  return http(`/api/shift-service/attendance-reports?${q.toString()}`);
}

export async function getStaffAttendanceHistory(
  staffId: string,
  month?: number,
  year?: number,
  exactDate?: string,
  branchId?: string
) {
  const q = new URLSearchParams();
  if (month) q.append('month', String(month));
  if (year) q.append('year', String(year));
  if (exactDate) q.append('exactDate', exactDate);
  if (branchId) q.append('branchId', branchId);
  
  // Đã sửa chuẩn URL
  return http(`/api/shift-service/attendance-reports/staff/${staffId}?${q.toString()}`);
}

export async function fetchAttendanceByShift(shiftId: string) {
  return http(`/api/shift-service/shifts/${shiftId}/attendance`);
}

export async function bulkMarkAttendance(
  shiftId: string,
  attendanceList: Record<string, unknown>[]
) {
  return http(`/api/shift-service/shifts/${shiftId}/attendance/bulk`, {
    method: 'POST',
    body: JSON.stringify({ attendances: attendanceList }),
  });
}

export async function getDashboardOverview(date: string, branchId?: string) {
  const q = new URLSearchParams();
  if (date) q.append('date', date);
  if (branchId) q.append('branchId', branchId);
  return http(`/api/shift-service/attendance-reports/dashboard?${q.toString()}`);
}