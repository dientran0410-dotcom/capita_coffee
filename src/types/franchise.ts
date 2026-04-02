export interface FranchiseSummary {
  franchiseId: string;
  franchiseName: string;
  franchiseCode: string;
  address?: string;
  region?: string;
  status?: string;
}

export interface FranchiseDetail extends FranchiseSummary {
  phone?: string;
  email?: string;
  [key: string]: unknown;
}

export interface FranchiseServiceEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}
