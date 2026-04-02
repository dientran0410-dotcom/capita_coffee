import { API_ENDPOINT } from "./api";

export const AUTH_URL = "/auth/";
export const USER_URL = "/users/";
export const EVENT_URL = "/events/";
export const CATEGORY_URL = "/categories";
export const PRODUCT_URL = "/products/";
export const POINTS_URL = "/points";

// Payment/Product service URLs
// Always use relative paths so DEV goes through Vite proxy (/api -> VITE_API_GATEWAY)
// and PROD calls API gateway directly.
export const CART_URL = `/api/products/cart`;
export const CART_ADD_URL = `/api/products/cart/add`;
export const CART_ITEM_URL = `/api/products/cart/item`;
export const CART_ITEM_DELETE_URL = `/api/products/cart/item`;

export const INVOICE_URL = `/api/products/invoices`;
export const INVOICE_CREATE_URL = `/api/products/invoices/create`;
export const INVOICE_CHECKOUT_URL = `/api/products/invoices`;

export const PAYMENT_URL = `/api/products/payment`;
export const MOMO_URL = `/api/products/momo`;
export const MOMO_CREATE_URL = `/api/products/momo/create`;
export const MOMO_RETURN_URL = `/api/products/momo/return`;

export const NOTIFICATION_URL = "/api/notifications";

// ============================================================
// Notification Service APIs
// ============================================================
export const NOTIFICATION_BASE_URL = "/api/notification-service";

// Templates
export const NOTIFICATION_TEMPLATES_URL =
  "/api/notification-service/templates";
export const NOTIFICATION_TEMPLATE_BY_ID_URL = (id: number) =>
  `/api/notification-service/templates/${id}`;

// Logs
export const NOTIFICATION_LOGS_URL =
  "/api/notification-service/logs";
export const NOTIFICATION_LOGS_STATS_URL =
  "/api/notification-service/logs/statistics";
export const NOTIFICATION_LOGS_BY_STATUS_URL =
  "/api/notification-service/logs/by-status";
export const NOTIFICATION_LOGS_BY_TYPE_URL =
  "/api/notification-service/logs/by-type";
export const NOTIFICATION_LOGS_BY_EMAIL_URL =
  "/api/notification-service/logs/by-email";

// Cleanup
export const NOTIFICATION_LOGS_CLEANUP_URL = (days: number) =>
  `/api/notification-service/logs/cleanup/${days}`;

// Engagement Service - Promotion APIs
export const PROMOTION_BASE_URL = `${API_ENDPOINT.ENGAGEMENT}/promotions`;
export const PROMOTION_ACTIVE_URL = `${PROMOTION_BASE_URL}/active`;

export const PROMOTION_GET_ALL = `${PROMOTION_BASE_URL}/get-all`;

export const PROMOTION_CREATE = `${PROMOTION_BASE_URL}/create`;

export const PROMOTION_BY_ID_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}`;

export const PROMOTION_UPDATE_STATUS_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}/status`;

export const PROMOTION_UPDATE_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}`;

export const PROMOTION_DELETE_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}`;

export const PROMOTION_BY_FRANCHISE_URL = (franchiseId: string) =>
  `${PROMOTION_BASE_URL}/franchise/${franchiseId}`;

export const PROMOTION_BY_STATUS_URL = (status: string) =>
  `${PROMOTION_BASE_URL}/status/${status}`;

export const PROMOTION_COUPONS_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}/coupons`;

export const PROMOTION_STATS_URL = (id: number) =>
  `${PROMOTION_BASE_URL}/${id}/stats`;

export const PROMOTION_DASHBOARD_URL =
  `${PROMOTION_BASE_URL}/dashboard`;

// Coupon APIs
export const COUPON_BASE_URL = `${API_ENDPOINT.ENGAGEMENT}/coupons`;

export const COUPON_GET_ALL = `${COUPON_BASE_URL}/get-all`;
export const COUPON_ACTIVE_URL = `${COUPON_BASE_URL}/active`;
export const COUPON_CREATE = `${COUPON_BASE_URL}/create`;
export const COUPON_BY_ID_URL = (id: number) =>
  `${COUPON_BASE_URL}/${id}`;

export const COUPON_GENERATE_URL =
  `${COUPON_BASE_URL}/generate`;

export const COUPON_VALIDATE_URL = (code: string) =>
  `${COUPON_BASE_URL}/validate/${code}`;

export const COUPON_STATS_URL = (promotionId: number) =>
  `${COUPON_BASE_URL}/stats/${promotionId}`;

export const COUPON_APPLY = `${COUPON_BASE_URL}/apply`;
export const COUPON_CHECKOUT = `${COUPON_BASE_URL}/checkout`;

export const COUPON_QR_URL = (code: string) =>
  `${COUPON_BASE_URL}/qr?code=${encodeURIComponent(code)}`;

export const COUPON_MY_APPLIED = (customerId: string) =>
  `${COUPON_BASE_URL}/my-applied/${customerId}`;

// Loyalty APIs
export const LOYALTY_BASE_URL =
  `${API_ENDPOINT.ENGAGEMENT}/admin/loyalty`;

export const LOYALTY_TIERS_URL =
  `${LOYALTY_BASE_URL}/tiers`;

// Tier endpoints
export const LOYALTY_TIER_URL =
  `${LOYALTY_BASE_URL}/tiers`;

export const LOYALTY_TIER_UPDATE_URL = (
  franchiseId: string,
  tierName: string
) => `${LOYALTY_BASE_URL}/${franchiseId}/${tierName}`;

export const LOYALTY_TIER_DELETE_URL =
  `${LOYALTY_BASE_URL}/tiers`;

// Rule endpoints
export const LOYALTY_RULE_ALL_URL =
  `${LOYALTY_BASE_URL}/rules`;

export const LOYALTY_RULE_URL = (franchiseId: string) =>
  `${LOYALTY_BASE_URL}/franchises/${franchiseId}/rules`;

export const LOYALTY_RULE_BY_EVENT_URL = (
  franchiseId: string,
  eventType: string
) =>
  `${LOYALTY_BASE_URL}/franchises/${franchiseId}/rules/event/${eventType}`;

export const CUSTOMER_ENGAGEMENT_REGISTER_URL = (franchiseId: string) =>
  `${API_ENDPOINT.ENGAGEMENT}/loyalty/register/${franchiseId}`;

export const CUSTOMER_ENGAGEMENT_GET_URL = (
  customerId: string,
  franchiseId: string,
) => `${API_ENDPOINT.ENGAGEMENT}/loyalty/customers/${customerId}/franchise/${franchiseId}`;

export const CUSTOMER_ENGAGEMENT_EARN_POINTS_URL = (
  customerId: string,
  franchiseId: string,
) => `${API_ENDPOINT.ENGAGEMENT}/loyalty/earn-points/${customerId}/${franchiseId}`;

export const CUSTOMER_ENGAGEMENT_PAYMENT_CHECKOUT_URL =
  `${API_ENDPOINT.ENGAGEMENT}/loyalty/payment/checkout`;

export const CUSTOMER_ENGAGEMENT_ORDER_PAYMENT_URL =
  `${API_ENDPOINT.ENGAGEMENT}/loyalty/order/payment`;



// Franchise Service - Contract APIs
export const CONTRACT_BASE_URL = "/api/franchise-service/contracts";
export const CONTRACT_BY_ID_URL = (id: string) => `/api/franchise-service/contracts/${id}`;
export const CONTRACT_SEARCH_URL = "/api/franchise-service/contracts/search";
export const CONTRACT_ACTIVATE_URL = (id: string) => `/api/franchise-service/contracts/${id}/activate`;
export const CONTRACT_RENEW_URL = (id: string) => `/api/franchise-service/contracts/${id}/renew`;
export const CONTRACT_TERMINATE_URL = (id: string) => `/api/franchise-service/contracts/${id}/terminate`;

// Franchise Service - Franchise-Staff Mapping APIs
export const FRANCHISE_STAFF_ASSIGN_URL = "/api/franchise-service/franchise-staff/assign";
export const FRANCHISE_STAFF_BY_STAFF_URL = (staffId: string) => `/api/franchise-service/franchise-staff/staff/${staffId}/franchise`;
export const FRANCHISE_STAFF_BY_FRANCHISE_URL = (franchiseId: string) => `/api/franchise-service/franchise-staff/franchise/${franchiseId}`;
export const FRANCHISE_STAFF_REMOVE_URL = "/api/franchise-service/franchise-staff/remove";

// Auth Service - User Management APIs
export const CREATE_ACCOUNT_URL = "/api/auth-service/users/create-account";
export const CHANGE_ROLE_URL = (userId: string) => `/api/auth-service/users/${userId}/role`;
export const DEACTIVATE_USER_URL = (userId: string) =>
  `/api/auth-service/users/${userId}/deactivate`;
export const DELETE_USER_URL = (userId: string) => `/api/auth-service/users/${userId}`;
export const GET_CURRENT_USER_URL = "/api/auth-service/users/me";

// Auth Service - Permission Management APIs
export const GET_ALL_PERMISSIONS_URL = "/api/auth-service/admin/roles/permissions";
export const GET_ROLE_PERMISSIONS_URL = (roleId: string) =>
  `/api/auth-service/admin/roles/${roleId}/permissions`;
export const ASSIGN_ROLE_PERMISSIONS_URL = (roleId: string) =>
  `/api/auth-service/admin/roles/${roleId}/permissions`;
export const DELETE_ROLE_PERMISSIONS_URL = (roleId: string) =>
  `/api/auth-service/admin/roles/${roleId}/permissions`;

//Report endpoint
export const REPORT_ENDPOINTS = {
  REPORT: {
    BASE: `${API_ENDPOINT.REPORT}/reports`,
    REVENUE: `/revenue-report`,
    EXPENSE: `/expense-report`,
    INVENTORY: `/inventory-report`,
    PRODUCT_PERFORMANCE: `/product-performance`,
    PROFIT_LOSS: `/profit-loss`,
    EXPORT: (id: string) => `/export/${id}`,
  },
};

//Redemption endpoint
export const REDEMPTION_BASE_URL= `${API_ENDPOINT.ENGAGEMENT}/redemption`;
export const REDEMPTION_CONFIRM =(rewardId: string) =>`${REDEMPTION_BASE_URL}/confirm/${rewardId}`;
export const REDEMPTION_CHECK_QR =(code: string) => `${REDEMPTION_BASE_URL}/confirm/${encodeURIComponent(code)}`;
export const REDEMPTION_GET_ALL= `${REDEMPTION_BASE_URL}/get-all`;
export const REDEMPTION_GET_ID = (id: string) => `${REDEMPTION_BASE_URL}/${id}`;
export const REDEMPTION_MY_HISTORY = `${REDEMPTION_BASE_URL}/my-history`;

//Reward endpoint
export const REWARD_BASE_URL =`${API_ENDPOINT.ENGAGEMENT}/admin/rewards`;
// CREATE (multipart/form-data)
export const REWARD_CREATE = REWARD_BASE_URL;
// UPDATE (multipart/form-data)
export const REWARD_UPDATE = (id: number | string) =>
  `${REWARD_BASE_URL}/${id}`;
export const REWARD_DELETE = (id: number | string) =>
  `${REWARD_BASE_URL}/${id}`;
export const REWARD_GET_BY_ID = (id: number | string) =>
  `${REWARD_BASE_URL}/${id}`;

export const REWARD_GET_ALL = REWARD_BASE_URL;
export const REWARD_GET_ACTIVE = `${REWARD_BASE_URL}/active`;
export { API_ENDPOINT };

// ============================================================
// Auth Service - Admin Customer Management APIs
// ============================================================
export const ADMIN_CUSTOMER_ALL_PROFILE_URL =
  "/api/auth-service/admin/customers/all-profile";

export const ADMIN_CUSTOMER_PROFILE_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/profile`;

export const ADMIN_CUSTOMER_SEARCH_URL =
  "/api/auth-service/admin/customers/search";

export const ADMIN_CUSTOMER_ACTIVITY_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/activity`;

export const ADMIN_CUSTOMER_AUDIT_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/audit`;

export const ADMIN_CUSTOMER_LOCK_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/profile/lock`;

export const ADMIN_CUSTOMER_UNLOCK_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/profile/unlock`;

export const ADMIN_CUSTOMER_STATUS_URL = (userId: string) =>
  `/api/auth-service/admin/customers/${userId}/profile/status`;

export const CUSTOMER_UPDATE_DETAILS_URL = (userId: string) =>
  `/api/auth-service/public/internal/customers/${userId}/details`;

// ============================================================
// Auth Service - Customer Self-Profile APIs (me/details)
// ============================================================
export const CUSTOMER_ME_PROFILE_URL = "/api/auth-service/customers/me/details";

// ============================================================
// Supplier Service APIs (MERGED - NO DATA LOSS)
// ============================================================

// 🔹 Legacy (giữ lại để không mất code bên kia)
export const SUPPLIER_URL = "/suppliers";
export const SUPPLIER_PRODUCT_URL = "/suppliers/products";

// 🔹 Gateway / Production (chuẩn hệ thống)
export const SUPPLIER_SERVICE_BASE =
  "/api/supplier-service";

export const SUPPLIER_SERVICE_URL =
  "/api/supplier-service/suppliers";

export const SUPPLIER_SERVICE_PRODUCT_URL =
  "/api/supplier-service/suppliers/products";


