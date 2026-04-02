export interface RedemptionHistory {
  id: number;
  date: string;
  rewardName: string;
  rewardIcon?: string;
  pointsSpent: number;
  status: RedemptionStatus;
}

export const RedemptionStatus = {
  CLAIMED: 'Claimed',
  SHIPPED: 'Shipped',
  USED: 'Used',
  EXPIRED: 'Expired',
  DELIVERED: 'Delivered',
  PENDING: 'Pending',
} as const;

export type RedemptionStatus = typeof RedemptionStatus[keyof typeof RedemptionStatus];

export interface RedemptionSummary {
  totalPointsRedeemed: number;
  pointsChangePercentage: number;
  totalRewardsClaimed: number;
  rewardsChangePercentage: number;
  pointsExpiringSoon: number;
  expirationDays: number;
}
export interface RedemptionQRResponse {
    redemptCode: string;
    qrImg: string;
}

export interface RedemptionFilters {
  searchQuery: string;
  status: string;
  dateRange: string;
}

export interface QRCheckResponse {
  valid: boolean
  message: string
  redemptionCode: string
  redemptionPoints: number
  rewardName: string
}

export type CustomerRedemptionStatus = string;

export interface CustomerRedemptionResponse {
  id: number;
  redemptionCode: string;
  userId: string;
  rewardId: number;
  promotionId: number | null;
  pointsUsed: number;
  status: CustomerRedemptionStatus;
  expirationDate: string | null;
  creationDate: string;
  qrImage: string | null;
}
