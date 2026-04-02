/**
 * Các loại notification từ backend
 */
export type NotificationType =
  | "staff_assigned"
  | "event_created"
  | "event_pending_approval"
  | "event_approved"
  | "event_rejected"
  | "event_cancelled"
  | "event_time_changed"
  | "one_day"
  | "thirty_min"
  | "incident_reported"
  | "cancellation_request"
  | "cancellation_approved"
  | "cancellation_rejected"
  | "organizer_request_submitted"
  | "organizer_request_received"
  | "organizer_request_approved"
  | "organizer_request_rejected";

/**
 * Interface cho notification data từ backend
 */
export interface NotificationData {
  eventId?: string;
  type?: NotificationType;
  startTime?: string;
  endTime?: string;
  status?: "PENDING" | "PUBLISHED" | "CANCELED";
  title?: string;
  eventTitle?: string;
  organizerName?: string;
  requestId?: number;
  reason?: string;
  adminNote?: string;
  incidentId?: number;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reporterName?: string;
  requesterName?: string;
}

/**
 * Interface cho notification item từ API
 */
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  content: string;
  data: NotificationData;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}

/**
 * Interface cho phân trang
 */
export interface NotificationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Interface cho response danh sách notification
 */
export interface NotificationListResponse {
  data: Notification[];
  meta: NotificationMeta;
}

/**
 * Interface cho response số lượng chưa đọc
 */
export interface UnreadCountResponse {
  unreadCount: number;
}

/**
 * Interface cho response đánh dấu tất cả đã đọc
 */
export interface MarkAllReadResponse {
  message: string;
  count: number;
}

/**
 * Interface cho query params khi lấy danh sách notification
 */
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  isRead?: boolean;
  type?: NotificationType;
}
