// ================== Reward ==================
export interface Reward {
  id: string;
  franchiseId: string;
  name: string;
  requiredPoints: number;
  description: string;
  active: boolean;
  imageUrl: string;
}

// ================== Loyalty Tier ==================
export interface TierInfoDTO {
  tierId: number;
  tierName: string;
  minPoints: number;
  benefits: string;
}

// ================== Points Balance ==================
export interface PointsBalanceResponse {
  customerId: number;
  franchiseId: string;
  currentPoints: number;
  totalEarnedPoints: number;
  tier: TierInfoDTO;
  status: string;
}

export interface PointsBalanceRequest {
  customerId: number;
  franchiseId: string;
}

// ================== Optional FE Model (nếu cần UI) ==================
export interface CustomerLoyalty {
  pointsAvailable: number;
  currentTier: string;
  pointsToNextReward: number;
}

// ================== Optional Filter ==================
export interface PointRange {
  label: string;
  min: number;
  max?: number;
}