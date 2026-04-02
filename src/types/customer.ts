/**
 * Customer Types & Interfaces
 * Map to backend auth-service API responses
 */

// ============================================================
// API Response Types (from backend)
// ============================================================

/**
 * GET /api/auth-service/public/internal/customers/{userId}/details
 * Response structure
 */
export interface CustomerDetailsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: CustomerDetails;
}

/**
 * Customer details data structure
 * Maps to PUT /api/auth-service/public/internal/customers/{userId}/details request body
 */
export interface CustomerDetails {
  id: string; // UUID
  franchiseId: string; // UUID
  name: string;
  email: string;
  address: string;
  phone: string;
  // ✅ INCLUDES: ACTIVE, INACTIVE, LOCKED, DELETED
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | "DELETED";
  marketingOptin: boolean;
  isFirstLogin: boolean;
  role: string;
}

/**
 * Update Customer Details Request
 * PUT /api/auth-service/public/internal/customers/{userId}/details
 */
export interface UpdateCustomerDetailsRequest {
  name: string;
  phone: string;
  address: string;
  marketingOptin: boolean;
  franchiseId: string; // UUID
  // ✅ INCLUDES: ACTIVE, INACTIVE, LOCKED, DELETED
  status: "ACTIVE" | "INACTIVE" | "LOCKED" | "DELETED";
}

/**
 * Create Customer via Bridge Endpoint
 * POST /api/auth-service/public/internal/customers/bridge
 * ⚠️ WARNING: This is marked as "internal" - verify if UI can call directly
 */
export interface CreateCustomerBridgeRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  franchiseId: string; // UUID
  marketingOptin: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DELETED";
}

/**
 * Generic API Response wrapper for create/update operations
 */
export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

// ============================================================
// UI Model Types (Component/Page usage)
// ============================================================

/**
 * Customer model used in UI components/pages
 * Extended with UI-specific properties
 */
export interface Customer extends CustomerDetails {
  // UI extensions (not from API)
  loyaltyPoints?: number;
  totalOrders?: number;
  totalSpent?: number;
  memberSince?: string;
  lastOrderDate?: string;
  membershipTier?: string;
  avatar?: string;
}

/**
 * Customer activity log entry
 */
export interface Activity {
  id: number;
  action: string;
  description: string;
  timestamp: string;
}

/**
 * Customer address
 */
export interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  isDefault: boolean;
}

export type MembershipTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
/**
 * Customer audit log entry
 */
export interface AuditLog {
  id: number;
  action: string;
  user: string;
  date: string;
}

/**
 * Audit Log Entry - detailed version from API
 */
export interface AuditLogEntry {
  id: string;
  action: string;
  detail?: string;
  createdAt: string;
  actorId?: string;
  actorEmail?: string;
  entity?: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
}

/**
 * Order in Activity
 */
export interface Order {
  id: string;
  orderId: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  description?: string;
}

/**
 * Search Request Body
 */
export interface CustomerSearchRequest {
  name?: string;
  email?: string;
  phone?: string;
  status?: string;
  role?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

/**
 * Search Response from API
 */
export interface CustomerSearchResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    content: Customer[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  };
}

/**
 * Activity Response from API
 */
export interface CustomerActivityResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    profile?: CustomerDetails;
    orders?: Order[];
  };
}

/**
 * Audit Response from API
 */
export interface CustomerAuditResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: AuditLogEntry[];
}

/**
 * Customer preferences
 */
export interface Preferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  newsletters: boolean;
  language: string;
}

/**
 * Customer loyalty information
 */
export interface CustomerLoyalty {
  pointsAvailable: number;
  currentTier: string;
  pointsToNextReward: number;
}

/**
 * Point range for filtering
 */
export interface PointRange {
  label: string;
  min: number;
  max?: number;
}

// ============================================================
// Error Types
// ============================================================

export interface CustomerApiError {
  statusCode: number;
  message: string;
  error?: string;
}
