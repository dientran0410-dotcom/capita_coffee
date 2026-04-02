export type TierName = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

export type EventType =
  | "ORDER"
  | "REVIEW"
  | "REFERRAL"
  | "REDEMPTION"
  | "BIRTHDAY"
  | "HOLIDAY"
  | "SPECIAL";

export interface LoyaltyTierResponse {
  id: number;
  franchiseId: string;
  name: TierName;
  minPoints: number;
  benefits: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLoyaltyTierRequest {
  franchiseId: string;
  name: TierName;
  tierMultiplier: number;
  benefits: string;
}

export interface LoyaltyRuleResponse {
  id: number;
  franchiseId: string;
  name: string;
  eventType: EventType;
  pointMultiplier: number;
  fixedPoints: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  expiryDays?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoyaltyRuleRequest {
  name: string;
  eventType: EventType;
  pointMultiplier: number;
  fixedPoints: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  expiryDays?: number;
}

export interface EarnPointsRequest {
  points: number;
  reason?: string;
}

export interface PaymentCheckoutRequest {
  customerId: string;
  franchiseId: string;
  orderAmount: number;
  orderId?: string;
}

export interface OrderItemAddonRequest {
  addonId: string;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderPaymentItemRequest {
  productId: string;
  quantity: number;
  price: number;
  addons?: OrderItemAddonRequest[];
  notes?: string;
}

export interface OrderPaymentRequest {
  customerId: string;
  franchiseId: string;
  invoiceId?: string;
  items: OrderPaymentItemRequest[];
  subtotal: number;
  shippingFee?: number;
  taxAmount?: number;
  totalAmount: number;
  pointsDiscount?: number;
  couponCode?: string;
  orderSource?: string;
  notes?: string;
}

export interface CustomerEngagementResponse {
  id: number;
  customerId: string;
  franchiseId: string;
  currentPoints: number;
  totalEarnedPoints: number;
  tierName: TierName | null;
  status: string;
  firstOrderAt?: string;
  lastOrderAt?: string;
  createdAt?: string;
}