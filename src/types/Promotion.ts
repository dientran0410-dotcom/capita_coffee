import { DiscountType } from "./coupon";

/**
 * Promotion entity từ backend
 */
export interface Promotion {
  id: number;
  franchiseId: string;
  name: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "EXPIRED";
  startDate: string;
  endDate: string;
  discountType?: DiscountType;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Request để tạo promotion mới
 */
export interface CreatePromotionRequest {
  franchiseId: string;
  name: string;
  description?: string;
  discountType?: DiscountType;
  startDate: string;
  endDate: string;
}