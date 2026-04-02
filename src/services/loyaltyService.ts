import { apiUtils } from "../api/axios";
import {
  LOYALTY_TIER_URL,
  LOYALTY_TIER_UPDATE_URL,
  LOYALTY_TIER_DELETE_URL,
  LOYALTY_RULE_URL,
  LOYALTY_RULE_BY_EVENT_URL,
  LOYALTY_RULE_ALL_URL,
  CUSTOMER_ENGAGEMENT_GET_URL,
  CUSTOMER_ENGAGEMENT_REGISTER_URL,
  CUSTOMER_ENGAGEMENT_EARN_POINTS_URL,
  CUSTOMER_ENGAGEMENT_PAYMENT_CHECKOUT_URL,
  CUSTOMER_ENGAGEMENT_ORDER_PAYMENT_URL,
} from "../constants/apiEndPoints";

import type {
  LoyaltyTierResponse,
  CreateLoyaltyTierRequest,
  LoyaltyRuleResponse,
  LoyaltyRuleRequest,
  TierName,
  CustomerEngagementResponse,
  EarnPointsRequest,
  OrderPaymentRequest,
  PaymentCheckoutRequest,
} from "../types/Loyalty";
import { getStoredToken } from "../utils/authHelpers";


const unwrap = <T>(raw: any): T => {
  if (raw?.data !== undefined) return raw.data as T;
  if (raw?.payload !== undefined) return raw.payload as T;
  if (raw?.result !== undefined) return raw.result as T;
  if (raw?.content !== undefined) return raw.content as T;
  return raw as T;
};

const unwrapArray = <T>(raw: any): T[] => {
  const value = unwrap<unknown>(raw);
  return Array.isArray(value) ? (value as T[]) : [];
};

const loyaltyService = {
  async createTier(data: CreateLoyaltyTierRequest): Promise<LoyaltyTierResponse | null> {
    const response = await apiUtils.post<any>(LOYALTY_TIER_URL, data);
    return unwrap<LoyaltyTierResponse | null>(response) ?? null;
  },

  async getAllTiers(): Promise<LoyaltyTierResponse[]> {
    const data = await apiUtils.get<any>(LOYALTY_TIER_URL);
    return unwrapArray<LoyaltyTierResponse>(data);
  },

  async updateTier(
    franchiseId: string,
    tierName: TierName,
    data: CreateLoyaltyTierRequest
  ): Promise<LoyaltyTierResponse | null> {
    const response = await apiUtils.put<any>(
      LOYALTY_TIER_UPDATE_URL(franchiseId, tierName),
      data
    );
    return unwrap<LoyaltyTierResponse | null>(response) ?? null;
  },

  async deleteTier(franchiseId: string, tierName: TierName): Promise<void> {
    await apiUtils.delete<void>(LOYALTY_TIER_DELETE_URL, {
      params: { franchiseId, tierName },
    });
  },

  async createRule(
    franchiseId: string,
    data: LoyaltyRuleRequest
  ): Promise<LoyaltyRuleResponse | null> {
    const response = await apiUtils.post<any>(LOYALTY_RULE_URL(franchiseId), data);
    return unwrap<LoyaltyRuleResponse | null>(response) ?? null;
  },

  async getAllRules(): Promise<LoyaltyRuleResponse[]> {
    const data = await apiUtils.get<any>(LOYALTY_RULE_ALL_URL);
    return unwrapArray<LoyaltyRuleResponse>(data);
  },

  async getRulesByFranchise(franchiseId: string): Promise<LoyaltyRuleResponse[]> {
    const data = await apiUtils.get<any>(LOYALTY_RULE_URL(franchiseId));
    return unwrapArray<LoyaltyRuleResponse>(data);
  },

  async updateRule(
    franchiseId: string,
    eventType: string,
    data: LoyaltyRuleRequest
  ): Promise<LoyaltyRuleResponse | null> {
    const response = await apiUtils.put<any>(
      LOYALTY_RULE_BY_EVENT_URL(franchiseId, eventType),
      data
    );
    return unwrap<LoyaltyRuleResponse | null>(response) ?? null;
  },

  async deleteRule(franchiseId: string, eventType: string): Promise<void> {
    await apiUtils.delete<void>(LOYALTY_RULE_BY_EVENT_URL(franchiseId, eventType));
  },

  async getCustomerEngagement(
    customerId: string,
    franchiseId: string,
  ): Promise<CustomerEngagementResponse | null> {
    const data = await apiUtils.get<any>(
      CUSTOMER_ENGAGEMENT_GET_URL(customerId, franchiseId),
    );
    return unwrap<CustomerEngagementResponse | null>(data) ?? null;
  },

  async registerCustomerEngagement(
    franchiseId: string,
    options?: { customerId?: string; userName?: string },
  ): Promise<void> {
    const token = getStoredToken();

    const headers: Record<string, string> = {
      "X-Skip-401-Redirect": "true",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      headers["X-Skip-Auth"] = "true";
    }

    if (options?.customerId) {
      headers["X-User-Role"] = "CUSTOMER";
      headers["X-User-Id"] = String(options.customerId);
    }

    if (options?.userName?.trim()) {
      headers["X-User-Name"] = encodeURIComponent(options.userName.trim());
    }

    await apiUtils.post<any>(
      CUSTOMER_ENGAGEMENT_REGISTER_URL(franchiseId),
      undefined,
      {
        headers,
        skipAuth: Boolean(token),
      } as any,
    );
  },

  async earnPointsAndAutoUpgradeTier(
    customerId: string,
    franchiseId: string,
    payload: EarnPointsRequest,
  ): Promise<CustomerEngagementResponse | null> {
    const data = await apiUtils.post<any>(
      CUSTOMER_ENGAGEMENT_EARN_POINTS_URL(customerId, franchiseId),
      payload,
    );
    return unwrap<CustomerEngagementResponse | null>(data) ?? null;
  },

  async processPaymentCheckout(
    payload: PaymentCheckoutRequest,
  ): Promise<CustomerEngagementResponse | null> {
    const data = await apiUtils.post<any>(
      CUSTOMER_ENGAGEMENT_PAYMENT_CHECKOUT_URL,
      payload,
    );
    return unwrap<CustomerEngagementResponse | null>(data) ?? null;
  },

  async processOrderPayment(
    payload: OrderPaymentRequest,
  ): Promise<CustomerEngagementResponse | null> {
    const data = await apiUtils.post<any>(
      CUSTOMER_ENGAGEMENT_ORDER_PAYMENT_URL,
      payload,
    );
    return unwrap<CustomerEngagementResponse | null>(data) ?? null;
  },
};

export default loyaltyService;
