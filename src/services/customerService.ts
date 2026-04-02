import api from "../api/axios";
// ✅ ADMIN ENDPOINTS - NOW IMPORTED FOR USE
import {
  ADMIN_CUSTOMER_ALL_PROFILE_URL,
  ADMIN_CUSTOMER_PROFILE_URL,
  ADMIN_CUSTOMER_SEARCH_URL,
  ADMIN_CUSTOMER_ACTIVITY_URL,
  ADMIN_CUSTOMER_AUDIT_URL,
  ADMIN_CUSTOMER_LOCK_URL,
  ADMIN_CUSTOMER_UNLOCK_URL,
  ADMIN_CUSTOMER_STATUS_URL,
  CUSTOMER_UPDATE_DETAILS_URL,
  CUSTOMER_ME_PROFILE_URL, 
} from "../constants/apiEndPoints";
import type {
  Customer,
  CustomerSearchRequest,
  CustomerSearchResponse,
  CustomerActivityResponse,
  CustomerAuditResponse,
  ApiResponse,
} from "../types/customer";
import {
  getCustomers as getMockCustomers,
  getCustomerById as getMockCustomerById,
  updateCustomer as updateMockCustomer,
} from "./mockCustomer";

/**
 * ============================================================
 * ADMIN CUSTOMER MANAGEMENT APIs (NEW)
 * ============================================================
 * Real API calls for admin panel customer management
 */

/**
 * API 1: Search/Filter/Paginate customers (POST)
 * 
 * POST /api/auth-service/admin/customers/search
 * Ưu tiên dùng cho list page vì có search/filter/pagination
 */
export const searchCustomers = async (
  searchParams: CustomerSearchRequest
): Promise<CustomerSearchResponse> => {
  try {
    console.log('[customerApi] Searching customers with params:', searchParams);
    
    // Build payload - exclude empty filters
    const payload: Record<string, any> = {
      name: searchParams.name || "",
      email: searchParams.email || "",
      page: (searchParams.page || 1) - 1,
      size: searchParams.size || 10,
      sortBy: searchParams.sortBy || "createdAt",
      sortDir: searchParams.sortDir || "DESC",
    };
    if (searchParams.phone && searchParams.phone.trim()) {
      payload.phone = searchParams.phone;
    }
    
    // Only include status if it has a value
    if (searchParams.status && searchParams.status !== "") {
      payload.status = searchParams.status;
    }

    // Only include role if it has a value (support backend role filtering if available)
    if (searchParams.role && searchParams.role !== "") {
      payload.role = searchParams.role;
    }
    
    console.log('[customerApi] Final payload:', payload);
    
    // Call real API
    const response = await api.post<CustomerSearchResponse>(
      ADMIN_CUSTOMER_SEARCH_URL,
      payload
    );
    console.log('[customerApi] searchCustomers response:', {
      statusCode: response.data?.statusCode,
      success: response.data?.success,
      contentLength: response.data?.data?.content?.length || 0,
      totalElements: response.data?.data?.totalElements,
      message: response.data?.message
    });
    
    // LOG RAW CUSTOMER DATA when filtering by status
    if (payload.status && response.data?.data?.content?.length > 0) {
      console.log('[customerApi] 🔍 RAW CUSTOMERS FOR STATUS FILTER:', {
        filterStatus: payload.status,
        customers: response.data.data.content.slice(0, 3).map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          // Log all fields to see if status is named differently
          allFields: Object.keys(c)
        }))
      });
    } else if (payload.status) {
      console.log('[customerApi] ⚠️ NO CUSTOMERS RETURNED for status:', payload.status);
    }
    
    return response.data;
  } catch (error) {
    console.error('[customerApi] Error searching customers:', {
      status: error?.response?.status,
      statusCode: error?.response?.data?.statusCode,
      message: error?.response?.data?.message || error?.message,
      url: error?.config?.url,
      params: searchParams
    });
    throw error;
  }
};

/**
 * API 2: Get all customer profiles (GET)
 * GET /api/auth-service/admin/customers/all-profile
 */
export const getAllCustomerProfiles = async (): Promise<{
  statusCode: number;
  success: boolean;
  message: string;
  data: Customer[];
}> => {
  try {
    console.log('[customerApi] Fetching all profiles from:', ADMIN_CUSTOMER_ALL_PROFILE_URL);
    const response = await api.get(ADMIN_CUSTOMER_ALL_PROFILE_URL);
    console.log('[customerApi] getAllCustomerProfiles response:', {
      statusCode: response.data?.statusCode,
      success: response.data?.success,
      dataLength: response.data?.data?.length || 0,
      message: response.data?.message
    });
    
    // LOG RAW DATA to see what status values we have
    if (response.data?.data?.length > 0) {
      console.log('[customerApi] 🔍 RAW ALL CUSTOMERS DATA:', {
        totalCount: response.data.data.length,
        customers: response.data.data.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          allFields: Object.keys(c)
        }))
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('[customerApi] Error fetching all customer profiles:', {
      status: error?.response?.status,
      statusCode: error?.response?.data?.statusCode,
      message: error?.response?.data?.message || error?.message,
      url: error?.config?.url
    });
    throw error;
  }
};

/**
 * API 3: Get customer by ID (GET)
 * GET /api/auth-service/admin/customers/{userId}/profile
 * Dùng cho detail/edit profile page
 */
export const getCustomerByIdAPI = async (
  customerId: string
): Promise<{ statusCode: number; success: boolean; message: string; data: Customer }> => {
  try {
    const response = await api.get(ADMIN_CUSTOMER_PROFILE_URL(customerId));
    return response.data;
  } catch (error) {
    console.error("Error fetching customer details:", error);
    throw error;
  }
};

/**
 * API 4: Update customer profile (PUT)
 * PUT /api/auth-service/admin/customers/{userId}/profile
 */
export const updateCustomerProfile = async (
  customerId: string,
  data: {
    name: string;
    phone: string;
    address: string;
    email?: string;
    marketingOptin?: boolean;
    franchiseId?: string;
  }
): Promise<ApiResponse<Customer>> => {
  try {
    const response = await api.put(
      ADMIN_CUSTOMER_PROFILE_URL(customerId),
      {
        name: data.name,
        phone: data.phone,
        address: data.address,
        email: data.email,
        marketingOptin: data.marketingOptin ?? true,
        franchiseId: data.franchiseId || "",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating customer profile:", error);
    throw error;
  }
};

/**
 * API 5: Get customer activity (GET)
 * GET /api/auth-service/admin/customers/{userId}/activity
 * Dùng cho Activity tab
 */
export const getCustomerActivity = async (
  customerId: string
): Promise<CustomerActivityResponse> => {
  try {
    const response = await api.get<CustomerActivityResponse>(
      ADMIN_CUSTOMER_ACTIVITY_URL(customerId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching customer activity:", error);
    throw error;
  }
};

/**
 * API 6: Get customer audit logs (GET)
 * GET /api/auth-service/admin/customers/{userId}/audit
 * Dùng cho Audit tab
 */
export const getCustomerAuditLogsAPI = async (
  customerId: string
): Promise<CustomerAuditResponse> => {
  try {
    const response = await api.get<CustomerAuditResponse>(
      ADMIN_CUSTOMER_AUDIT_URL(customerId)
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching customer audit logs:", error);
    throw error;
  }
};

/**
 * API 7: Lock customer account (PATCH)
 * PATCH /api/auth-service/admin/customers/{userId}/profile/lock
 */
export const lockCustomerAccount = async (
  customerId: string,
  reason?: string
): Promise<ApiResponse> => {
  try {
    const response = await api.patch(
      ADMIN_CUSTOMER_LOCK_URL(customerId),
      { reason: reason || "" }
    );
    return response.data;
  } catch (error) {
    console.error("Error locking customer account:", error);
    throw error;
  }
};

/**
 * API 8: Unlock customer account (PATCH)
 * PATCH /api/auth-service/admin/customers/{userId}/profile/unlock
 */
export const unlockCustomerAccount = async (
  customerId: string,
  reason?: string
): Promise<ApiResponse> => {
  try {
    const response = await api.patch(
      ADMIN_CUSTOMER_UNLOCK_URL(customerId),
      { reason: reason || "" }
    );
    return response.data;
  } catch (error) {
    console.error("Error unlocking customer account:", error);
    throw error;
  }
};

/**
 * API 9: Change customer status (PATCH)
 * PATCH /api/auth-service/admin/customers/{userId}/profile/status
 */
export const changeCustomerStatus = async (
  customerId: string,
  status: string
): Promise<ApiResponse> => {
  try {
    const response = await api.patch(
      ADMIN_CUSTOMER_STATUS_URL(customerId),
      { status }
    );
    return response.data;
  } catch (error) {
    console.error("Error changing customer status:", error);
    throw error;
  }
};

/**
 * ============================================================
 * BACKWARD COMPATIBLE FUNCTIONS (deprecated - use new functions above)
 * ============================================================
 */

/**
 * @deprecated Use searchCustomers() instead
 */
export const getCustomers = async (
  user: any,
  page: number = 1,
  limit: number = 10
) => {
  try {
    const response = await searchCustomers({ page, size: limit });
    return {
      data: {
        customers: response.data?.content || [],
        totalItems: response.data?.totalElements || 0,
      },
    };
  } catch (error) {
    console.error("Error fetching customers from API, fallback to mock:", error);
    return await getMockCustomers(user);
  }
};

/**
 * @deprecated Use getCustomerByIdAPI() instead
 */
export const getCustomerById = async (customerId: string) => {
  try {
    return await getCustomerByIdAPI(customerId);
  } catch (error) {
    console.error("Error fetching customer details from API, fallback to mock:", error);
    return await getMockCustomerById(customerId);
  }
};

/**
 * @deprecated Use getCustomerByIdAPI() instead
 */
export const viewCustomerInfo = async (customerId: string) => {
  try {
    return await getCustomerById(customerId);
  } catch (error) {
    console.error("Error viewing customer information:", error);
    throw error;
  }
};

/**
 * Customer self-update via public/internal endpoint.
 */
export const updateCustomerInfo = async (customerId: string, data: any) => {
  try {
    const response = await api.put(
      CUSTOMER_UPDATE_DETAILS_URL(customerId),
      {
        name: data.name || "",
        phone: data.phone || "",
        address: data.address || "",
        email: data.email || "",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating customer information:", error);
    throw error;
  }
};

/**
 * @deprecated Use getCustomerActivity() instead
 */
export const viewCustomerActivity = async (customerId: string) => {
  try {
    const response = await getCustomerActivity(customerId);
    return {
      data: {
        activities: response.data?.orders?.map((order) => ({
          id: order.id,
          action: `Order ${order.orderId}`,
          description: `Order placed - ${order.status}`,
          timestamp: order.createdAt,
        })) || [],
      },
    };
  } catch (error) {
    console.error("Error fetching customer activity:", error);
    throw error;
  }
};

/**
 * @deprecated Use getCustomerAuditLogsAPI() instead
 */
export const getCustomerAuditLogs = async (customerId: string) => {
  try {
    const response = await getCustomerAuditLogsAPI(customerId);
    return {
      data: {
        logs: response.data?.map((log) => ({
          id: log.id,
          action: log.action,
          user: log.actorEmail || "System",
          date: log.createdAt,
          detail: log.detail,
        })) || [],
      },
    };
  } catch (error) {
    console.error("Error fetching customer audit logs:", error);
    throw error;
  }
};

/**
 * ============================================================
 * LEGACY / NOT IMPLEMENTED FUNCTIONS
 * ============================================================
 */

export const getCurrentCustomerProfile = async (userId: string) => {
  const response = await api.get(CUSTOMER_UPDATE_DETAILS_URL(userId));
  const payload = response?.data;
  const data = payload?.data ?? payload?.payload ?? payload;

  if (data) {
    return { data };
  }

  throw new Error("Unable to load current customer profile");
};

export const updateCustomerDetails = async (userId: string, data: any) => {
  try {
    const response = await api.put(
      CUSTOMER_UPDATE_DETAILS_URL(userId),
      {
        name: data?.name || "",
        phone: data?.phone || "",
        address: data?.address || "",
        email: data?.email || "",
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating customer details:", error);
    throw error;
  }
};

export const createCustomerBridge = async (data: any) => {
  return {
    data: {
      success: true,
      message: "Customer bridge created",
      bridgeId: `BR-${Date.now()}`,
      payload: data,
    },
  };
};

export const getCustomerBridgeInfo = async (customerId: any) => {
  return {
    data: {
      customerId,
      relatedServices: [],
      linkedOrders: [],
      linkedSuppliers: [],
    },
  };
};

export const updateCustomerBridgeInfo = async (_customerId: any, _data: any) => {
  return { data: { success: true, message: "Customer bridge information updated" } };
};

export const createCustomer = async (_data: any) => {
  return { data: { success: true, message: "Customer created", customerId: "" } };
};

export const searchCustomersLegacy = async (_query: any, page: any = 1, _limit: any = 10) => {
  try {
    const response = await searchCustomers({
      name: typeof _query === "string" ? _query : "",
      page,
      size: _limit,
    });
    return {
      data: {
        customers: response.data?.content || [],
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
        totalItems: response.data?.totalElements || 0,
      },
    };
  } catch (_error) {
    return {
      data: {
        customers: [],
        totalPages: 0,
        currentPage: page,
        totalItems: 0,
      },
    };
  }
};

export const getCustomersWithPagination = async (page: any = 1, limit: any = 10, _sort: any = "createdAt", _order: any = "desc") => {
  try {
    const response = await searchCustomers({ page, size: limit });
    return {
      data: {
        customers: response.data?.content || [],
        totalPages: response.data?.totalPages || 0,
        currentPage: page,
        totalItems: response.data?.totalElements || 0,
        pageSize: limit,
      },
    };
  } catch (_error) {
    return {
      data: {
        customers: [],
        totalPages: 0,
        currentPage: page,
        totalItems: 0,
        pageSize: limit,
      },
    };
  }
};

export const deactivateCustomer = async (_customerId: any, _reason: any = "") => {
  return { data: { success: true, message: "Customer deactivated" } };
};

export const publishCustomerEvents = async (_customerId: any, _event: any, _data: any) => {
  return { data: { success: true, message: "Customer event published" } };
};

export const validateCustomerData = async (_data: any) => {
  return { data: { isValid: true, errors: [] } };
};

export const getCustomerProfileSummary = async (customerId: any) => {
  return {
    data: {
      customerId,
      name: "",
      email: "",
      phone: "",
      totalOrders: 0,
      totalSpent: 0,
      lastOrderDate: "",
      status: "",
      memberSince: "",
    },
  };
};

export const getCustomerAddresses = async (_customerId: any) => {
  return { data: { addresses: [] } };
};

export const getCustomerRecentOrders = async (_customerId: any, _limit: any = 5) => {
  return {
    data: {
      orders: [
        { id: "OD-24061", store: "Capital Coffee - District 1", status: "Preparing", total: "89,000d", time: "Today - 15:25" },
        { id: "OD-24012", store: "Capital Coffee - Thu Duc", status: "Delivered", total: "129,000d", time: "Yesterday - 19:10" },
        { id: "OD-23974", store: "Capital Coffee - Binh Thanh", status: "Cancelled", total: "59,000d", time: "02/03 - 08:40" },
      ],
    },
  };
};

export const getCustomerPreferences = async (customerId: any) => {
  return {
    data: {
      customerId,
      emailNotifications: true,
      smsNotifications: false,
      newsletter: true,
      language: "en",
      theme: "light",
    },
  };
};

export const updateCustomerPreferences = async (_customerId: any, _preferences: any) => {
  return { data: { success: true, message: "Preferences updated" } };
};

export const getCurrentCustomerMeProfile = async (): Promise<{
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    franchiseId?: string;
    name: string;
    email: string;
    address?: string;
    phone: string;
    status: string;
    marketingOptin?: boolean;
    isFirstLogin?: boolean;
    role: string;
  };
}> => {
  try {
    const response = await api.get(CUSTOMER_ME_PROFILE_URL);
    console.log("[customerApi] getCurrentCustomerMeProfile:", response.data);
    return response.data;
  } catch (error) {
    console.error("[customerApi] Error fetching current customer profile:", error);
    throw error;
  }
};

export const updateCustomerMeProfile = async (data: {
  name: string;
  phone: string;
  address: string;
  mail: string;
  marketingOptin?: boolean;
}): Promise<{
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    id: string;
    franchiseId?: string;
    name: string;
    email: string;
    address?: string;
    phone: string;
    status: string;
    marketingOptin?: boolean;
    isFirstLogin?: boolean;
    role: string;
  };
}> => {
  try {
    const response = await api.put(CUSTOMER_ME_PROFILE_URL, {
      name: data.name || "",
      phone: data.phone || "",
      address: data.address || "",
      mail: data.mail || "",
      marketingOptin: data.marketingOptin ?? false,
    });
    console.log("[customerApi] updateCustomerMeProfile:", response.data);
    return response.data;
  } catch (error) {
    console.error("[customerApi] Error updating customer profile:", error);
    throw error;
  }
};
