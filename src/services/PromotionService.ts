import { apiUtils } from "../api/axios";
import type { Promotion, CreatePromotionRequest } from "../types/Promotion";
import {
  PROMOTION_BASE_URL,
  PROMOTION_GET_ALL,
  PROMOTION_CREATE,
  PROMOTION_ACTIVE_URL,
  PROMOTION_BY_ID_URL,
  PROMOTION_UPDATE_STATUS_URL,
  PROMOTION_UPDATE_URL,
  PROMOTION_DELETE_URL,
  PROMOTION_BY_FRANCHISE_URL,
  PROMOTION_BY_STATUS_URL,
  PROMOTION_COUPONS_URL,
  PROMOTION_STATS_URL,
  PROMOTION_DASHBOARD_URL
} from "../constants/apiEndPoints";
import type { ApiResponse } from "../types/ApiResponse";

/**
 * Promotion Service - Xử lý các request liên quan đến promotions
 */
const promotionService = {
  /**
   * GET /api/engagement-service/promotions/get-All
   * Lấy tất cả promotions
   */
  async getAllPromotions(): Promise<ApiResponse<Promotion[]>> {
    return await apiUtils.get<ApiResponse<Promotion[]>>(PROMOTION_GET_ALL);
  },

  /**
   * GET /api/engagement/promotions/active?franchiseId=1
   * Lấy các promotions đang active (có thể filter theo franchiseId)
   */
  async getActivePromotions(
    franchiseId?: string
  ): Promise<ApiResponse<Promotion[]>> {
    const params = franchiseId ? { franchiseId } : undefined;
    return await apiUtils.get<ApiResponse<Promotion[]>>(
      PROMOTION_ACTIVE_URL,
      params
    );
  },

  /**
   * GET /api/engagement/promotions/{id}
   * Lấy chi tiết 1 promotion
   */
  async getPromotionById(
    id: number
  ): Promise<ApiResponse<Promotion>> {
    return await apiUtils.get<ApiResponse<Promotion>>(PROMOTION_BY_ID_URL(id));
  },

  /**
   * POST /api/engagement-service/create
   * Tạo promotion mới
   */
  async createPromotion(
    data: CreatePromotionRequest
  ): Promise<ApiResponse<Promotion>> {
    return await apiUtils.post<ApiResponse<Promotion>>(PROMOTION_CREATE, data);
  },

  /**
   * PATCH /api/engagement/promotions/{id}/status?status=ACTIVE
   * Cập nhật status của promotion
   */
  async updatePromotionStatus(
    id: number,
    status: "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED"
  ): Promise<ApiResponse<Promotion>> {
    return await apiUtils.patch<ApiResponse<Promotion>>(
      PROMOTION_UPDATE_STATUS_URL(id),
      null,
      { params: { status } }
    );
  },

  /**
   * PUT /api/engagement/promotions/{id}
   * Cập nhật toàn bộ promotion
   */
  async updatePromotion(
    id: number,
    data: CreatePromotionRequest
  ): Promise<ApiResponse<Promotion>> {
    return await apiUtils.put<ApiResponse<Promotion>>(PROMOTION_UPDATE_URL(id), data);
  },

  /**
   * DELETE /api/engagement/promotions/{id}
   * Xóa promotion
   */
  async deletePromotion(id: number): Promise<void> {
    return await apiUtils.delete<void>(PROMOTION_DELETE_URL(id));
  },

  /**
   * GET /api/engagement/promotions/franchise/{franchiseId}
   * Lấy promotions theo franchise
   */
  async getPromotionsByFranchise(
    franchiseId: string
  ): Promise<ApiResponse<Promotion[]>> {
    return await apiUtils.get<ApiResponse<Promotion[]>>(PROMOTION_BY_FRANCHISE_URL(franchiseId));
  },

  /**
   * GET /api/engagement/promotions/status/{status}
   * Lấy promotions theo status
   */
  async getPromotionsByStatus(
    status: "DRAFT" | "ACTIVE" | "INACTIVE" | "EXPIRED"
  ): Promise<ApiResponse<Promotion[]>> {
    return await apiUtils.get<ApiResponse<Promotion[]>>(PROMOTION_BY_STATUS_URL(status));
  },

  /**
   * GET /api/engagement/promotions/{id}/coupons
   * Lấy danh sách coupons của promotion
   */
  async getPromotionCoupons(id: number): Promise<any> {
    return await apiUtils.get<any>(PROMOTION_COUPONS_URL(id));
  },

  /**
   * GET /api/engagement/promotions/{id}/stats
   * Lấy thống kê promotion
   */
  async getPromotionStats(id: number): Promise<any> {
    return await apiUtils.get<any>(PROMOTION_STATS_URL(id));
  },

  /**
   * GET /api/engagement/promotions/dashboard
   * Lấy dashboard tổng quan
   */
  async getPromotionDashboard(): Promise<any> {
    return await apiUtils.get<any>(PROMOTION_DASHBOARD_URL);
  },
};

export default promotionService;
