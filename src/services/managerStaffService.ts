import { apiUtils } from "@/api/axios";

/**
 * Manager Staff Service
 * Centralized service for all staff-related operations accessible to manager
 */

export interface CreateStaffRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  franchiseId: string;
  gender?: string;
  dateOfBirth?: string;
  roleName?: "STAFF";
}

export interface StaffProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  gender?: string;
  dateOfBirth?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  franchiseId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffListResponse {
  content: StaffProfile[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

/**
 * Create a new staff account
 * Manager can only create staff for their own franchise with STAFF role
 */
export async function createManagerStaff(
  payload: CreateStaffRequest
): Promise<{ data?: any; result?: any }> {
  const createPayload = {
    email: payload.email.trim(),
    password: payload.password,
    name: payload.name.trim(),
    address: payload.address?.trim(),
    phone: payload.phone.trim(),
    franchiseId: payload.franchiseId,
    roleName: "STAFF", // Always STAFF for manager creation
  };

  console.log("🔐 Creating manager staff with payload:", createPayload);
  
  const response = await apiUtils.post(
    "/api/auth-service/users/create-account",
    createPayload
  );

  // Log the response structure for debugging
  const result = response?.data || response?.result || response;
  console.log("✅ Staff creation response:", result);
  console.log("📊 Response structure:", {
    hasData: !!response?.data,
    hasResult: !!response?.result,
    keys: result ? Object.keys(result) : []
  });

  return response;
}

/**
 * Get all staff for manager's franchise with pagination
 */
export async function getManagerStaffList(
  page = 0,
  size = 10,
  filters?: {
    status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    search?: string;
    sortBy?: "name" | "email" | "createdAt";
    sortDir?: "ASC" | "DESC";
  }
): Promise<StaffListResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });

  if (filters?.status) params.append("status", filters.status);
  if (filters?.search) params.append("search", filters.search);
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortDir) params.append("sortDir", filters.sortDir);

  console.log("📥 Fetching manager staff with params:", params.toString());

  const response = await apiUtils.get(
    `/api/shift-service/staffs?${params.toString()}`
  );

  const result = (response as any)?.data || (response as any)?.result || response;
  
  console.log("📤 Manager staff response:", {
    total: result?.totalElements,
    count: result?.content?.length,
    hasContent: !!result?.content
  });

  return result;
}

/**
 * Get detailed information for a specific staff member
 */
export async function getStaffDetail(staffId: string): Promise<StaffProfile> {
  const response = await apiUtils.get(
    `/api/shift-service/staffs/${encodeURIComponent(staffId)}`
  );
  return (response as any)?.data || (response as any)?.result || response;
}

/**
 * Update staff information (personal details, address, etc.)
 * Does NOT change password or role - use password reset/role change endpoints separately
 */
export async function updateStaffProfile(
  staffId: string,
  updates: Partial<Omit<StaffProfile, "id" | "status" | "franchiseId">>
): Promise<StaffProfile> {
  const response = await apiUtils.put(
    `/api/shift-service/staffs/${encodeURIComponent(staffId)}`,
    updates
  );
  return (response as any)?.data || (response as any)?.result || response;
}

/**
 * Change staff status (ACTIVE, INACTIVE, SUSPENDED)
 * Used for deactivating, activating, or suspending staff accounts
 */
export async function updateStaffStatus(
  staffId: string,
  newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
): Promise<any> {
  const response = await apiUtils.patch(
    `/api/shift-service/staffs/${encodeURIComponent(staffId)}/status`,
    { status: newStatus }
  );
  return (response as any)?.data || (response as any)?.result || response;
}

/**
 * Search staff by keyword (name, email, phone)
 */
export async function searchStaff(
  keyword: string,
  page = 0,
  size = 10
): Promise<StaffListResponse> {
  return getManagerStaffList(page, size, { search: keyword });
}

/**
 * Get staff statistics for manager's franchise
 * Returns count of active, inactive, suspended staff
 */
export async function getStaffStatistics(): Promise<{
  activeCount: number;
  inactiveCount: number;
  suspendedCount: number;
  totalCount: number;
}> {
  try {
    const response = await apiUtils.get(
      "/api/shift-service/staffs/statistics"
    );
    return (response as any)?.data || (response as any)?.result || response;
  } catch (error) {
    // If statistics endpoint not available, calculate from list
    const allStaff = await getManagerStaffList(0, 1000);
    const stats = {
      activeCount: 0,
      inactiveCount: 0,
      suspendedCount: 0,
      totalCount: allStaff.totalElements,
    };

    allStaff.content?.forEach((staff) => {
      if (staff.status === "ACTIVE") stats.activeCount++;
      else if (staff.status === "INACTIVE") stats.inactiveCount++;
      else if (staff.status === "SUSPENDED") stats.suspendedCount++;
    });

    return stats;
  }
}

/**
 * Bulk update staff status
 * Update multiple staff members at once
 */
export async function bulkUpdateStaffStatus(
  staffIds: string[],
  newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED"
): Promise<any> {
  const response = await apiUtils.patch(
    "/api/shift-service/staffs/bulk/status",
    {
      staffIds,
      status: newStatus,
    }
  );
  return (response as any)?.data || (response as any)?.result || response;
}

/**
 * Export staff list to CSV (if supported by backend)
 */
export async function exportStaffList(format: "csv" | "excel" = "csv"): Promise<Blob> {
  const response = await apiUtils.get(
    `/api/shift-service/staffs/export?format=${format}`
  );
  return response as any;
}

/**
 * Get staff assignment to shifts/schedules
 */
export async function getStaffSchedules(staffId: string): Promise<any[]> {
  const response = await apiUtils.get(
    `/api/shift-service/staffs/${encodeURIComponent(staffId)}/schedules`
  );
  return (response as any)?.data || (response as any)?.result || response || [];
}

/**
 * Get staff attendance records
 */
export async function getStaffAttendance(
  staffId: string,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);

  const response = await apiUtils.get(
    `/api/shift-service/staffs/${encodeURIComponent(staffId)}/attendance?${params.toString()}`
  );
  return (response as any)?.data || (response as any)?.result || response || [];
}
