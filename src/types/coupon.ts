export const DiscountType = {
  PERCENT: "PERCENT",
  FIXED_AMOUNT: "FIXED_AMOUNT",
  POINT_DISCOUNT: "POINT_DISCOUNT"
} as const;

export type DiscountType = typeof DiscountType[keyof typeof DiscountType];

export interface PromotionOption {
  id: number;
  name: string;
  franchiseId: string;
}

export interface TierOption {
  id: number;
  name: string;
  franchiseId: string;
}

export interface CouponResponse {
  id: number;
  promotionId: number | null;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  maxDiscount: number | null;
  usageLimit: number;
  userLimit: number;
  usedCount: number;
  minTier: { id: number; name: string } | null;
  isPublic: boolean;
  expiredAt?: string | null;
  startAt?: string | null;
}

export interface ApplyCouponRequest {
  customerId: string;
  couponCode: string;
}

export interface ApplyCouponResponse {
  id: number;
  userId: string;
  couponId: number;
  code: string;
  status: string;
  appliedAt: string;
  expiredAt: string;
}

export interface CheckoutCouponRequest {
  customerId: string;
  couponCode: string;
  orderCreateRequest: Record<string, unknown>;
}

export interface CheckoutCouponResponse {
  finalAmount: number;
}

export interface CouponQrResponse {
  code: string;
  redeemUrl: string;
  discountValue?: number;
  discountType?: string;
  qrCode?: string; // Generated on client-side
  expiresAt?: string; // Generated on client-side
}
