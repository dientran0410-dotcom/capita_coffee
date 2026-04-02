import type {PromotionOption,
    TierOption,
    CouponResponse,
    ApplyCouponRequest,
    ApplyCouponResponse,
  CouponQrResponse,
  CheckoutCouponRequest,
  CheckoutCouponResponse
} from "../types/coupon";
import { DiscountType } from "../types/coupon";
import QRCode from 'qrcode';

import {
  COUPON_ACTIVE_URL,
  COUPON_BASE_URL,
  COUPON_BY_ID_URL,
  LOYALTY_TIERS_URL,
  COUPON_CREATE,
  COUPON_GET_ALL,
  PROMOTION_GET_ALL,
  COUPON_APPLY,
  COUPON_CHECKOUT,
  COUPON_QR_URL,
  COUPON_MY_APPLIED
} from '../constants/apiEndPoints';
import api from "../api/axios";
import type { ApiResponse } from "../types/ApiResponse";

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const normalizeDiscountType = (value: unknown): DiscountType => {
  const str = String(value ?? "").toUpperCase();
  if (str === "PERCENT" || str === "PERCENTAGE") return DiscountType.PERCENT;
  if (str === "FIXED_AMOUNT" || str === "FIXED") return DiscountType.FIXED_AMOUNT;
  if (str === "POINT_DISCOUNT" || str === "POINT") return DiscountType.POINT_DISCOUNT;
  return DiscountType.PERCENT; // default
};

const normalizeCoupon = (item: any): CouponResponse => {
  const minTierRaw = item?.minTier ?? item?.min_tier ?? null;
  const minTier = minTierRaw
    ? {
        id: toNumber(minTierRaw.id, 0),
        name: String(minTierRaw.name ?? ""),
      }
    : null;

  return {
    id: toNumber(item?.id, 0),
    promotionId: item?.promotionId ?? item?.promotion_id ?? null,
    code: String(item?.code ?? ""),
    discountType: normalizeDiscountType(item?.discountType ?? item?.discount_type),
    discountValue: toNumber(item?.discountValue ?? item?.discount_value, 0),
    minOrderValue: toNumber(item?.minOrderValue ?? item?.min_order_value, 0),
    maxDiscount:
      item?.maxDiscount === null || item?.max_discount === null
        ? null
        : toNumber(item?.maxDiscount ?? item?.max_discount, 0),
    usageLimit: toNumber(item?.usageLimit ?? item?.usage_limit, 0),
    userLimit: toNumber(item?.userLimit ?? item?.user_limit, 0),
    usedCount: toNumber(item?.usedCount ?? item?.used_count, 0),
    minTier,
    isPublic: Boolean(item?.isPublic ?? item?.is_public),
    startAt:
      item?.startAt ??
      item?.startDate ??
      item?.startedAt ??
      item?.start_time ??
      item?.start_at ??
      item?.createdAt ??
      item?.create_at ??
      null,
    expiredAt:
      item?.expiredAt ??
      item?.expiryAt ??
      item?.expiresAt ??
      item?.expired_at ??
      null,
  };
};

const normalizeCouponList = (payload: unknown): CouponResponse[] => {
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => normalizeCoupon(item));
};

const normalizeAppliedCoupon = (item: any): ApplyCouponResponse => ({
  id: toNumber(item?.id ?? item?.applyId ?? item?.appliedCouponId, 0),
  userId: String(item?.userId ?? item?.user_id ?? item?.customerId ?? item?.customer_id ?? ''),
  couponId: toNumber(item?.couponId ?? item?.coupon_id ?? item?.coupon?.id, 0),
  code: String(item?.code ?? item?.couponCode ?? item?.coupon_code ?? item?.coupon?.code ?? ''),
  status: String(item?.status ?? item?.state ?? 'PENDING'),
  appliedAt: String(item?.appliedAt ?? item?.applied_at ?? item?.createdAt ?? item?.created_at ?? ''),
  expiredAt: String(item?.expiredAt ?? item?.expiresAt ?? item?.expiryAt ?? item?.expired_at ?? item?.coupon?.expiredAt ?? ''),
});

const normalizeAppliedCouponList = (payload: unknown): ApplyCouponResponse[] => {
  if (!Array.isArray(payload)) return [];
  return payload.map((item) => normalizeAppliedCoupon(item));
};

const normalizeCouponQr = async (item: any): Promise<CouponQrResponse> => {
  // Backend trả về: { code, redeemUrl, discountValue, discountType }
  const redeemUrl = String(item?.redeemUrl ?? item?.redeem_url ?? item?.url ?? '');

  if (!redeemUrl) {
    throw new Error('Không tìm thấy URL để tạo mã QR');
  }

  // Generate QR code từ redeemUrl
  const qrCodeDataUrl = await QRCode.toDataURL(redeemUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M'
  });

  // Tính thời gian hết hạn (15 phút)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  return {
    code: String(item?.code ?? item?.couponCode ?? item?.coupon_code ?? ''),
    redeemUrl,
    discountValue: Number(item?.discountValue ?? item?.discount_value),
    discountType: String(item?.discountType ?? item?.discount_type ?? ''),
    qrCode: qrCodeDataUrl,
    expiresAt
  };
};

const pickPayload = (body: any) => body?.payload ?? body?.data ?? body?.result ?? body;

const getCoupons = async () => {
  const res = await api.get<ApiResponse<CouponResponse[]>>(COUPON_GET_ALL);
  return normalizeCouponList(res.data?.payload);
};

const getActiveCouponsForCustomer = async () => {
  const res = await api.get<ApiResponse<CouponResponse[]>>(COUPON_ACTIVE_URL);
  const body = res.data as any;
  if (Array.isArray(body?.payload)) return normalizeCouponList(body.payload);
  if (Array.isArray(body?.data)) return normalizeCouponList(body.data);
  if (Array.isArray(body)) return normalizeCouponList(body);
  return [];
};

const getPromotions = async () => {
  const res = await api.get<PromotionOption[]>(PROMOTION_GET_ALL);
  return res.data;
};

const getTiers = async () => {
  const res = await api.get<TierOption[]>(LOYALTY_TIERS_URL);
  return res.data;
};

const createCoupon = async (payload: any) => {
  const res = await api.post<ApiResponse<CouponResponse>>(COUPON_CREATE, payload);
  return normalizeCoupon(res.data?.payload);
};

const updateCoupon = async (id: number, payload: any) => {
  const res = await api.put<ApiResponse<CouponResponse>>(COUPON_BY_ID_URL(id), payload);
  if (!res.data || !res.data.payload) {
    throw new Error(res.data?.message || "Update failed");
  }

  return normalizeCoupon(res.data.payload);
};

const deleteCoupon = async (id: number) => {
  await api.delete(COUPON_BY_ID_URL(id));
};

const applyCoupon = async (payload: ApplyCouponRequest): Promise<ApplyCouponResponse> => {
  const res = await api.post<ApiResponse<ApplyCouponResponse>>(COUPON_APPLY, payload);
  const body = res.data as any;
  return normalizeAppliedCoupon(pickPayload(body));
};

const generateQrForCoupon = async (code: string, couponId?: number): Promise<CouponQrResponse> => {
  const normalizedCode = String(code ?? '').trim();
  const normalizedCouponId = Number(couponId);
  const hasCouponId = Number.isFinite(normalizedCouponId) && normalizedCouponId > 0;

  if (!normalizedCode && !hasCouponId) {
    throw new Error('Không tìm thấy mã coupon hợp lệ để tạo QR.');
  }

  const candidates = [
    normalizedCode ? COUPON_QR_URL(normalizedCode) : null,
    normalizedCode ? `${COUPON_BASE_URL}/qr?couponCode=${encodeURIComponent(normalizedCode)}` : null,
    normalizedCode ? `${COUPON_BASE_URL}/qr/${encodeURIComponent(normalizedCode)}` : null,
    hasCouponId ? `${COUPON_BASE_URL}/qr?couponId=${normalizedCouponId}` : null,
    hasCouponId ? `${COUPON_BASE_URL}/qr?id=${normalizedCouponId}` : null,
  ].filter(Boolean) as string[];

  let lastError: unknown = null;
  for (const url of candidates) {
    try {
      const res = await api.get<ApiResponse<CouponQrResponse>>(url);
      const body = res.data as any;
      const normalized = await normalizeCouponQr(pickPayload(body));
      return normalized;
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError ?? new Error('Không thể tạo mã QR.');
};

const getMyAppliedCoupons = async (customerId: string): Promise<ApplyCouponResponse[]> => {
  const res = await api.get<ApiResponse<ApplyCouponResponse[]>>(COUPON_MY_APPLIED(customerId));
  const payload = pickPayload(res.data as any);
  return normalizeAppliedCouponList(payload);
};

const checkoutCoupon = async (
  payload: CheckoutCouponRequest,
): Promise<CheckoutCouponResponse> => {
  const customerId = String(payload?.customerId ?? '').trim();
  const couponCode = String(payload?.couponCode ?? '').trim().toUpperCase();

  if (!customerId) {
    throw new Error('Thiếu customerId để checkout coupon.');
  }

  if (!couponCode) {
    throw new Error('Thiếu couponCode để checkout coupon.');
  }

  const response = await api.post<ApiResponse<number | string>>(COUPON_CHECKOUT, {
    customerId,
    couponCode,
    orderCreateRequest: payload?.orderCreateRequest ?? {},
  });

  const raw = pickPayload(response.data as any);
  const finalAmount = Number(raw);
  if (!Number.isFinite(finalAmount) || finalAmount < 0) {
    throw new Error('Dữ liệu tổng tiền sau giảm không hợp lệ từ API checkout coupon.');
  }

  return { finalAmount };
};

// export dạng object
const couponService = {
  getCoupons,
  getActiveCouponsForCustomer,
  getPromotions,
  getTiers,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
  generateQrForCoupon,
  getMyAppliedCoupons,
  checkoutCoupon,
};

export default couponService;
