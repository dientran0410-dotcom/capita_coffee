import { http } from '../utils/axiosClient';
import { getStaffById } from './staffService';

// ──────────────────────────────────────────────────────────────
// FRANCHISE-STAFF MAPPING ENDPOINTS
// ──────────────────────────────────────────────────────────────

export const FRANCHISE_STAFF_ASSIGN_URL = '/franchise-service/franchise-staff/assign';

export function FRANCHISE_STAFF_BY_STAFF_URL(staffId: string) {
  return `/franchise-service/franchise-staff/staff/${encodeURIComponent(staffId)}/franchise`;
}

export function FRANCHISE_STAFF_BY_FRANCHISE_URL(franchiseId: string) {
  return `/franchise-service/franchise-staff/franchise/${encodeURIComponent(franchiseId)}`;
}

export const FRANCHISE_STAFF_REMOVE_URL = '/franchise-service/franchise-staff/remove';

// ──────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ──────────────────────────────────────────────────────────────

export type FranchiseStaffMapping = {
  id?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  staffId: string;
  status: string;
  assignedAt?: string;
  unassignedAt?: string | null;
  franchise?: string;
};

export type Staff = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  branchId?: string;
  status?: string;
  dateOfBirth?: string;
  createdAt?: string;
  staffCode?: string;
  gender?: string;
  [key: string]: unknown;
};

export type FranchiseInfo = {
  franchiseId: string;
  franchiseName?: string;
  franchiseCode?: string;
  address?: string;
  region?: string;
  timezone?: string;
  status?: string;
};

export type StaffFranchiseLookupResponse = {
  success?: boolean;
  message?: string;
  data?: {
    staff?: Staff;
    franchises?: FranchiseInfo[];
  };
  error?: {
    code?: string;
    message?: string;
    path?: string;
  };
  timestamp?: string;
};

export type WrappedResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
    path?: string;
  };
  timestamp?: string;
};

export type FranchiseStaffDetail = FranchiseStaffMapping & {
  staff?: Staff | null;
};

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Unwrap API response data
 * Handles both wrapped and unwrapped response formats
 */
function unwrapData<T>(res: WrappedResponse<T> | T | undefined): T {
  if (!res) return undefined as T;

  if (typeof res === 'object' && 'data' in res) {
    const wrapped = res as WrappedResponse<T>;
    return wrapped.data as T;
  }

  return res as T;
}

// ──────────────────────────────────────────────────────────────
// API FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Assign a staff to a franchise
 * POST /api/franchise-service/franchise-staff/assign
 */
export async function assignStaffToFranchise(
  franchiseId: string,
  staffId: string
): Promise<FranchiseStaffMapping> {
  try {
    const res = await http(FRANCHISE_STAFF_ASSIGN_URL, {
      method: 'POST',
      body: JSON.stringify({ franchiseId, staffId }),
    });

    return unwrapData<FranchiseStaffMapping>(res);
  } catch (error) {
    console.error('Error assigning staff to franchise:', error);
    throw error;
  }
}

/**
 * Get all franchises for a specific staff
 * GET /api/franchise-service/franchise-staff/staff/{staffId}/franchise
 */
export async function getFranchiseByStaffId(
  staffId: string
): Promise<StaffFranchiseLookupResponse['data']> {
  try {
    const res = await http(FRANCHISE_STAFF_BY_STAFF_URL(staffId));
    return unwrapData<StaffFranchiseLookupResponse['data']>(res);
  } catch (error) {
    console.error('Error fetching franchises for staff:', error);
    throw error;
  }
}

/**
 * Get all staff mappings for a franchise
 * GET /api/franchise-service/franchise-staff/franchise/{franchiseId}
 */
export async function getStaffMappingsByFranchise(
  franchiseId: string
): Promise<FranchiseStaffMapping[]> {
  try {
    const res = await http(FRANCHISE_STAFF_BY_FRANCHISE_URL(franchiseId));
    return unwrapData<FranchiseStaffMapping[]>(res) ?? [];
  } catch (error) {
    console.error('Error fetching staff mappings for franchise:', error);
    throw error;
  }
}

/**
 * Remove a staff from a franchise
 * DELETE /api/franchise-service/franchise-staff/remove?franchiseId=...&staffId=...
 */
export async function removeStaffFromFranchise(
  franchiseId: string,
  staffId: string
): Promise<string> {
  try {
    const url = `${FRANCHISE_STAFF_REMOVE_URL}?franchiseId=${encodeURIComponent(franchiseId)}&staffId=${encodeURIComponent(staffId)}`;

    const res = await http(url, {
      method: 'DELETE',
    });

    return unwrapData<string>(res);
  } catch (error) {
    console.error('Error removing staff from franchise:', error);
    throw error;
  }
}

// ──────────────────────────────────────────────────────────────
// CONVENIENCE FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Get only active staff mappings for a franchise
 */
export async function getActiveStaffMappingsByFranchise(
  franchiseId: string
): Promise<FranchiseStaffMapping[]> {
  const items = await getStaffMappingsByFranchise(franchiseId);
  return items.filter((item) => item.status === 'ACTIVE');
}

/**
 * Get franchise staff details with enriched staff information
 * Calls getFranchiseStaffDetails for each mapping to get full staff details
 */
export async function getFranchiseStaffDetails(
  franchiseId: string
): Promise<FranchiseStaffDetail[]> {
  const mappings = await getActiveStaffMappingsByFranchise(franchiseId);

  const enriched = await Promise.all(
    mappings.map(async (mapping) => {
      try {
        const staff = await getStaffById(mapping.staffId);
        return {
          ...mapping,
          staff: staff as Staff,
        };
      } catch (error) {
        console.warn(
          `Failed to fetch staff details for ${mapping.staffId}:`,
          error
        );
        return {
          ...mapping,
          staff: null,
        };
      }
    })
  );

  return enriched;
}

/**
 * Get staffs for a franchise with optional filtering
 */
export async function getStaffByFranchiseWithFilters(
  franchiseId: string,
  options?: {
    activeOnly?: boolean;
    statusFilter?: string;
  }
): Promise<FranchiseStaffDetail[]> {
  let data = await getFranchiseStaffDetails(franchiseId);

  if (options?.activeOnly) {
    data = data.filter((item) => item.status === 'ACTIVE');
  }

  if (options?.statusFilter) {
    data = data.filter((item) => item.status === options.statusFilter);
  }

  return data;
}

export default {
  FRANCHISE_STAFF_ASSIGN_URL,
  FRANCHISE_STAFF_BY_STAFF_URL,
  FRANCHISE_STAFF_BY_FRANCHISE_URL,
  FRANCHISE_STAFF_REMOVE_URL,
  assignStaffToFranchise,
  getFranchiseByStaffId,
  getStaffMappingsByFranchise,
  removeStaffFromFranchise,
  getActiveStaffMappingsByFranchise,
  getFranchiseStaffDetails,
  getStaffByFranchiseWithFilters,
};
