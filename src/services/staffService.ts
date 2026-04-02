import { apiUtils } from '../api/axios';

const DEFAULT_BRANCH_ID = 'BR-001';
const STAFF_BASE_CANDIDATES = ['/api/shift-service/staffs', '/api/staffs'];
const CREATE_ACCOUNT_URL = '/api/auth-service/users/create-account';

type Staff = Record<string, unknown>;

type Paginated<T> = {
  content?: T[];
  totalElements?: number;
  totalPages?: number;
  size?: number;
  number?: number;
} & Record<string, unknown>;

type ApiResponse<T> = {
  data?: T;
  result?: T;
} & Record<string, unknown>;

type CreateAccountPayload = {
  email: string;
  name: string;
  address: string;
  phone: string;
  franchiseId: string;
  roleName: string;
};

type CreateAccountData = {
  id?: string;
  userId?: string;
  franchiseId?: string;
  name?: string;
  email?: string;
  address?: string;
  phone?: string;
  status?: string;
  marketingOptin?: boolean;
  isFirstLogin?: boolean;
  role?: string;
} & Record<string, unknown>;

type CreateAccountResult = {
  statusCode?: number;
  success?: boolean;
  message?: string;
  data?: CreateAccountData;
  result?: CreateAccountData;
} & Record<string, unknown>;

function getBranchId(): string {
  try {
    const raw = globalThis.localStorage?.getItem('auth_user');
    if (!raw) return DEFAULT_BRANCH_ID;

    const user = JSON.parse(raw) as {
      branchId?: string;
      raw?: {
        branchId?: string;
        user?: {
          branchId?: string;
        };
      };
    };

    return (
      user.branchId ||
      user.raw?.branchId ||
      user.raw?.user?.branchId ||
      DEFAULT_BRANCH_ID
    );
  } catch {
    return DEFAULT_BRANCH_ID;
  }
}

function handleResponse<T>(res: ApiResponse<T> | undefined): T {
  return (res?.result ?? res?.data ?? res) as T;
}

function normalizeError(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as {
      response?: {
        data?: unknown;
      };
    };

    throw err.response?.data ?? error;
  }

  throw error;
}

function getStatusCode(error: unknown): number | undefined {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const err = error as {
      response?: {
        status?: number;
      };
    };
    return err.response?.status;
  }
  return undefined;
}

async function requestWithStaffBase<T>(
  requestFn: (base: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;

  for (const base of STAFF_BASE_CANDIDATES) {
    try {
      return await requestFn(base);
    } catch (error: unknown) {
      if (getStatusCode(error) === 404) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error('Staff endpoint not found');
}

export async function getAllStaffs(
  page = 0,
  size = 10,
  branchId?: string
): Promise<Paginated<Staff>> {
  try {
    const params: Record<string, any> = {
      page,
      size,
    };
    
    // Add branchId if provided or get from logged-in user
    const branch = branchId || getBranchId();
    if (branch && branch !== DEFAULT_BRANCH_ID) {
      params.branchId = branch;
    }
    
    const res = await requestWithStaffBase((base) =>
      apiUtils.get<ApiResponse<Paginated<Staff>>>(base, params)
    );

    return handleResponse<Paginated<Staff>>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function getStaffById(id: string): Promise<Staff> {
  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.get<ApiResponse<Staff>>(`${base}/${encodeURIComponent(id)}`)
    );

    return handleResponse<Staff>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function getCurrentStaffProfile(): Promise<Staff> {
  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.get<ApiResponse<Staff>>(`${base}/me`)
    );

    return handleResponse<Staff>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function createStaff(
  payload: Record<string, unknown>
): Promise<Staff> {
  const body = {
    ...payload,
    branchId: (payload.branchId as string | undefined) || getBranchId(),
  };

  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.post<ApiResponse<Staff>>(base, body)
    );
    return handleResponse<Staff>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function createAccountForStaff(
  payload: CreateAccountPayload
): Promise<CreateAccountResult> {
  try {
    return await apiUtils.post<CreateAccountResult>(CREATE_ACCOUNT_URL, payload);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function updateStaff(
  id: string,
  payload: Record<string, unknown>
): Promise<Staff> {
  const body = {
    ...payload,
    branchId: (payload.branchId as string | undefined) || getBranchId(),
  };

  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.put<ApiResponse<Staff>>(
        `${base}/${encodeURIComponent(id)}`,
        body
      )
    );

    return handleResponse<Staff>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function updateStaffStatus(
  id: string,
  status: string
): Promise<unknown> {
  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.patch<ApiResponse<unknown>>(
        `${base}/${encodeURIComponent(id)}/status`,
        { status }
      )
    );

    return handleResponse<unknown>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function deleteStaff(id: string): Promise<unknown> {
  try {
    const res = await requestWithStaffBase((base) =>
      apiUtils.delete<ApiResponse<unknown>>(
        `${base}/${encodeURIComponent(id)}`
      )
    );

    return handleResponse<unknown>(res as any);
  } catch (error: unknown) {
    normalizeError(error);
  }
}

export async function getSchedulesByStaff(staffId: string): Promise<unknown> {
  const encodedStaffId = encodeURIComponent(staffId);
  const scheduleCandidates = [
    `/api/staff/${encodedStaffId}/schedules`,
    `/api/staffs/${encodedStaffId}/schedules`,
    `/api/staff-service/staff/${encodedStaffId}/schedules`,
    `/api/staff-service/staffs/${encodedStaffId}/schedules`,
  ];

  try {
    let lastError: unknown;

    for (const endpoint of scheduleCandidates) {
      try {
        const res = await apiUtils.get<ApiResponse<unknown>>(endpoint);
        // Đã FIX: Ép kiểu "as any" để fix lỗi TypeScript ở đây
        return handleResponse<unknown>(res as any);
      } catch (error: unknown) {
        if (getStatusCode(error) === 404) {
          lastError = error;
          continue;
        }

        throw error;
      }
    }

    throw lastError ?? new Error('Staff schedule endpoint not found');
  } catch (error: unknown) {
    normalizeError(error);
  }
}