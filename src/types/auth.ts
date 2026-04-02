export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  token?: string;
  user?: UserInfo;
  role?: string;
  userId?: string;
}

export interface UserInfo {
  userId?: string;
  email?: string;
  role?: string;
  branchId?: string;
  franchiseId?: string;
  [key: string]: unknown;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}
