import { apiUtils } from "../api/axios";
import {
  NOTIFICATION_BASE_URL,
  NOTIFICATION_LOGS_URL,
  NOTIFICATION_LOGS_STATS_URL,
  NOTIFICATION_LOGS_BY_EMAIL_URL,
  NOTIFICATION_LOGS_CLEANUP_URL,
} from "../constants/apiEndPoints";

/**
 * Email Log Interface - Từ Notification Service
 */
export interface EmailLog {
  id: number;
  email: string;
  name: string;
  type: string;
  status: "SUCCESS" | "FAIL";
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Paginated Response Interface
 */
export interface PaginatedEmailLogs {
  content: EmailLog[];
  totalPages: number;
  totalElements: number;
  first: boolean;
  last: boolean;
  size: number;
  number: number;
  numberOfElements: number;
  empty: boolean;
  sort?: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  pageable?: {
    offset: number;
    sort: any;
    pageNumber: number;
    pageSize: number;
    paged: boolean;
    unpaged: boolean;
  };
}

/**
 * Email Statistics Interface
 */
export interface EmailStats {
  totalEmails: number;
  successEmails: number;
  failedEmails: number;
  successRate: number;
}

/**
 * Email Template Interface
 */
export interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Query Parameters Interface
 */
export interface EmailLogsParams {
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: "ASC" | "DESC";
  type?: string;
  status?: "SUCCESS" | "FAIL";
  email?: string;
}

/**
 * Notification Service - Email Logs API
 * Quản lý lịch sử gửi email notifications
 */
const notificationService = {
  /**
   * Lấy danh sách tất cả email logs
   * @param params - Query parameters: page, size, sortBy, direction
   * @returns Promise với response chứa danh sách email logs phân trang
   */
  async getNotifications(params?: EmailLogsParams): Promise<PaginatedEmailLogs> {
    const queryParams = new URLSearchParams();
    
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.direction) queryParams.append("direction", params.direction);

    const queryString = queryParams.toString();
    const url = queryString
      ? `${NOTIFICATION_LOGS_URL}?${queryString}`
      : NOTIFICATION_LOGS_URL;

    return await apiUtils.get<PaginatedEmailLogs>(url);
  },

  /**
   * Lấy thống kê email
   * @returns Promise với response chứa thống kê (total, success, failed, successRate)
   */
  async getStats(): Promise<EmailStats> {
    return await apiUtils.get<EmailStats>(NOTIFICATION_LOGS_STATS_URL);
  },

  /**
   * Lấy email logs theo email address
   * @param email - Email address
   * @param params - Query parameters: page, size
   * @returns Promise với danh sách email logs của một email cụ thể
   */
  async getLogsByEmail(
    email: string,
    params?: { page?: number; size?: number }
  ): Promise<PaginatedEmailLogs> {
    const queryParams = new URLSearchParams();
    queryParams.append("email", email);
    
    if (params?.page !== undefined) queryParams.append("page", params.page.toString());
    if (params?.size !== undefined) queryParams.append("size", params.size.toString());

    const url = `${NOTIFICATION_LOGS_BY_EMAIL_URL}?${queryParams.toString()}`;
    return await apiUtils.get<PaginatedEmailLogs>(url);
  },

  /**
   * Lấy danh sách tất cả email templates
   * @returns Promise với response chứa danh sách email templates
   */
  async getTemplates(): Promise<EmailTemplate[]> {
    return await apiUtils.get<EmailTemplate[]>(`${NOTIFICATION_BASE_URL}/templates`);
  },

  /**
   * Tạo email template mới
   * @param data - Dữ liệu template (type, subject, title, message)
   * @returns Promise với response chứa template đã tạo
   */
  async createTemplate(data: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate> {
    console.log('[NotificationService] Creating template:', data);
    return await apiUtils.post<EmailTemplate>(`${NOTIFICATION_BASE_URL}/templates`, data);
  },

  /**
   * Lấy email template theo loại
   * @param type - Loại template (REGISTER_SUCCESS, PAYMENT_SUCCESS, ...)
   * @returns Promise với response chứa email template
   */
  async getTemplateByType(type: string): Promise<EmailTemplate> {
    return await apiUtils.get<EmailTemplate>(`${NOTIFICATION_BASE_URL}/templates/type/${type}`);
  },

  /**
   * Lấy email template theo ID
   * @param id - ID của template
   * @returns Promise với response chứa email template
   */
  async getTemplateById(id: number): Promise<EmailTemplate> {
    return await apiUtils.get<EmailTemplate>(`${NOTIFICATION_BASE_URL}/templates/${id}`);
  },

  /**
   * Cập nhật email template
   * @param id - ID của template
   * @param data - Dữ liệu cập nhật (type, subject, title, message)
   * @returns Promise với response chứa template đã cập nhật
   */
  async updateTemplate(id: number, data: Partial<EmailTemplate>): Promise<EmailTemplate> {
    return await apiUtils.put<EmailTemplate>(`${NOTIFICATION_BASE_URL}/templates/${id}`, data);
  },

  /**
   * Xóa email template theo ID
   * @param id - ID của template
   * @returns Promise với response xác nhận xóa
   */
  async deleteTemplate(id: number): Promise<any> {
    return await apiUtils.delete(`${NOTIFICATION_BASE_URL}/templates/${id}`);
  },

  /**
   * Xóa email logs cũ hơn số ngày được chỉ định
   * @param days - Số ngày (xóa logs cũ hơn số ngày này)
   * @returns Promise với response xác nhận xóa
   */
  async cleanupLogs(days: number): Promise<any> {
    const url = NOTIFICATION_LOGS_CLEANUP_URL(days);
    console.log('[NotificationService] Cleanup logs older than', days, 'days:', url);
    return await apiUtils.delete(url);
  },

  /**
   * Dummy methods để giữ backward compatibility với Notification.tsx page
   * (nếu page này vẫn sử dụng old APIs)
   */
  async markAsRead(id: number): Promise<any> {
    console.warn("markAsRead: Not available in Email Logs API");
    return { success: false };
  },

  async markAllAsRead(): Promise<any> {
    console.warn("markAllAsRead: Not available in Email Logs API");
    return { success: false };
  },
};

export default notificationService;
