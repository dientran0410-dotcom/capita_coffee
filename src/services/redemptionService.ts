import { apiUtils } from "../api/axios";
import {
  REDEMPTION_CONFIRM,
  REDEMPTION_CHECK_QR,
  REDEMPTION_GET_ALL,
  REDEMPTION_GET_ID,
  REDEMPTION_MY_HISTORY
} from "../constants/apiEndPoints";
import type { CustomerRedemptionResponse } from "../types/Redemption";

const toApiUrl = (url: string) => {
  if (!import.meta.env.DEV) {
    return url;
  }

  try {
    const parsed = new URL(url);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
};

// Xác nhận redeem
export const confirmRedeem = async (rewardId: string | number): Promise<CustomerRedemptionResponse> => {
  const data = await apiUtils.post<any>(toApiUrl(REDEMPTION_CONFIRM(String(rewardId))));
  return data?.payload ?? data;
};

// Check QR / code redemption
export const checkRedemption = async (code: string) => {
  const data = await apiUtils.get<any>(toApiUrl(REDEMPTION_CHECK_QR(code)));
  return data?.payload ?? data;
};

// Lấy tất cả redemption
export const getAllRedemption = async () => {
  const data = await apiUtils.get<any>(toApiUrl(REDEMPTION_GET_ALL));
  return data?.payload ?? data;
};

// Lấy redemption theo ID
export const getRedemptionById = async (id: string) => {
  const data = await apiUtils.get<any>(toApiUrl(REDEMPTION_GET_ID(id)));
  return data?.payload ?? data;
};

// Lich su redeem cua customer hien tai
export const getMyRedemptionHistory = async () => {
  const data = await apiUtils.get<any>(toApiUrl(REDEMPTION_MY_HISTORY));
  return data?.payload ?? data;
};
