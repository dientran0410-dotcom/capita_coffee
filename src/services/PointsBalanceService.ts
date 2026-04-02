import { apiUtils } from "../api/axios";
import { POINTS_URL } from "../constants/apiEndPoints";
import type { PointsBalanceResponse, PointsBalanceRequest } from "../types/reward";
import type { ApiResponse } from "../types/ApiResponse";

/** Unwrap common API envelope patterns: { payload }, { data }, or direct */
function unwrap<T>(responseData: unknown): T {
  if (responseData && typeof responseData === "object") {
    const d = responseData as Record<string, unknown>;
    if (d.payload !== undefined) return d.payload as T;
    if (d.data !== undefined) return d.data as T;
  }
  return responseData as T;
}

const pointsBalanceService = {
  /**
   * Lấy thông tin điểm tích lũy qua query params
   */
  async getPointsBalance(
    customerId: string | number,
    franchiseId: string
  ): Promise<PointsBalanceResponse> {
    const response = await apiUtils.get<ApiResponse<PointsBalanceResponse>>(
      `${POINTS_URL}/balance`,
      { customerId: String(customerId), franchiseId }
    );
    return unwrap<PointsBalanceResponse>(response);
  },

  /**
   * Lấy thông tin điểm tích lũy qua request body
   */
  async getPointsBalanceByBody(
    request: PointsBalanceRequest
  ): Promise<PointsBalanceResponse> {
    const response = await apiUtils.post<ApiResponse<PointsBalanceResponse>>(
      `${POINTS_URL}/balance`,
      request
    );
    return unwrap<PointsBalanceResponse>(response);
  },
};

export default pointsBalanceService;
