import { apiUtils } from "../api/axios";
import { NOTIFICATION_URL } from "../constants/apiEndPoints";
import type { ApiResponse } from "../types/ApiResponse";
import type {
  Notification,
  NotificationListResponse,
  UnreadCountResponse,
  MarkAllReadResponse,
  NotificationQueryParams,
} from "../types/Notification";

/**
 * Interface cho request đăng ký subscription
 */
export interface SubscriptionRequest {
  subscriptionId: string;
  deviceId?: string;
}

/**
 * Interface cho response đăng ký subscription
 */
export interface SubscriptionResponse {
  registered: boolean;
}

/**
 * Notification Service - Xử lý các request liên quan đến notifications
 */
const notificationService = {
  /**
   * Đăng ký subscription với backend để nhận thông báo đích danh
   * @param data - subscriptionId từ OneSignal và deviceId (optional)
   * @returns Promise với response xác nhận đăng ký thành công
   */
  async registerSubscription(
    data: SubscriptionRequest
  ): Promise<ApiResponse<SubscriptionResponse>> {
    return await apiUtils.post<ApiResponse<SubscriptionResponse>>(
      `${NOTIFICATION_URL}/subscriptions`,
      data
    );
  },

  /**
   * Lấy danh sách thông báo của user
   * @param params - Query parameters: page, limit, isRead, type
   * @returns Promise với response chứa danh sách notification và meta
   */
  async getNotifications(
    params?: NotificationQueryParams
  ): Promise<ApiResponse<NotificationListResponse>> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.isRead !== undefined)
      queryParams.append("isRead", params.isRead.toString());
    if (params?.type) queryParams.append("type", params.type);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${NOTIFICATION_URL}?${queryString}`
      : NOTIFICATION_URL;

    return await apiUtils.get<ApiResponse<NotificationListResponse>>(url);
  },

  /**
   * Lấy số lượng thông báo chưa đọc
   * @returns Promise với response chứa số lượng unreadCount
   */
  async getUnreadCount(): Promise<
    ApiResponse<UnreadCountResponse>
  > {
    return await apiUtils.get<ApiResponse<UnreadCountResponse>>(
      `${NOTIFICATION_URL}/unread-count`
    );
  },

  /**
   * Đánh dấu một thông báo là đã đọc
   * @param id - ID của thông báo
   * @returns Promise với response chứa notification đã cập nhật
   */
  async markAsRead(
    id: number
  ): Promise<ApiResponse<Notification>> {
    return await apiUtils.patch<ApiResponse<Notification>>(
      `${NOTIFICATION_URL}/${id}/read`
    );
  },

  /**
   * Đánh dấu tất cả thông báo là đã đọc
   * @returns Promise với response chứa message và count
   */
  async markAllAsRead(): Promise<
    ApiResponse<MarkAllReadResponse>
  > {
    return await apiUtils.patch<ApiResponse<MarkAllReadResponse>>(
      `${NOTIFICATION_URL}/read-all`
    );
  },
};

export default notificationService;
