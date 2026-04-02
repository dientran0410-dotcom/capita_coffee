export const normalizeRole = (role: unknown): string => {
  const value = String(role || '')
    .toUpperCase()
    .replace(/^ROLE_/, '');

  return value || 'CUSTOMER';
};

export const pickRoleFromList = (list: unknown): string | null => {
  if (!Array.isArray(list) || list.length === 0) return null;

  const first = list[0];

  if (typeof first === 'string') return first;

  if (first && typeof first === 'object') {
    const obj = first as Record<string, unknown>;
    return (
      (obj.role as string) ||
      (obj.name as string) ||
      (obj.authority as string) ||
      null
    );
  }

  return null;
};

// =================== USER ID EXTRACTION ===================

/**
 * Centralized user ID extraction utility to replace all scattered getUserId functions
 */
export const extractUserId = (user: any): string | null => {
  if (!user) return null;

  // Try direct fields first (from AuthContext user object)
  if (typeof user.userId === "string" && user.userId.trim()) return user.userId;
  if (typeof user.id === "string" && user.id.trim()) return user.id;
  if (typeof user.staffId === "string" && user.staffId.trim()) return user.staffId;

  // Try raw object (from API response)
  const rawUser = user?.raw as Record<string, unknown> | undefined;
  if (rawUser) {
    // Try direct fields in raw
    if (typeof rawUser.userId === "string" && rawUser.userId.trim()) return rawUser.userId;
    if (typeof rawUser.id === "string" && rawUser.id.trim()) return rawUser.id;

    // Try nested user object
    const nestedRawUser = rawUser?.user as Record<string, unknown> | undefined;
    if (nestedRawUser) {
      if (typeof nestedRawUser.userId === "string" && nestedRawUser.userId.trim()) return nestedRawUser.userId;
      if (typeof nestedRawUser.id === "string" && nestedRawUser.id.trim()) return nestedRawUser.id;
    }

    // Try data.data structure (common in API responses)
    const dataData = rawUser?.data as Record<string, unknown> | undefined;
    if (dataData && typeof dataData.userId === "string" && dataData.userId.trim()) return dataData.userId;
  }

  return null;
};

// =================== TOKEN MANAGEMENT ===================

export const AUTH_STORAGE_KEYS = [
  "token",
  "accessToken",
  "auth_token",
  "refreshToken",
  "refresh_token",
  "auth_user",
  "user",
  "auth_expires_in",
  "role"
] as const;

/**
 * Centralized auth storage clearing to replace scattered implementations
 */
export const clearAuthStorage = (): void => {
  AUTH_STORAGE_KEYS.forEach((key) => {
    try {
      globalThis.localStorage?.removeItem(key);
      globalThis.sessionStorage?.removeItem(key);
    } catch {
      // Ignore storage errors
    }
  });

  // Also clear cookies
  try {
    document.cookie = 'auth_token=; Max-Age=0; path=/';
    document.cookie = 'refresh_token=; Max-Age=0; path=/';
  } catch {
    // Ignore cookie errors
  }
};

/**
 * Centralized token retrieval to replace scattered getStoredToken implementations
 */
export const getStoredToken = (): string | null => {
  const directToken =
    globalThis.localStorage?.getItem("accessToken") ??
    globalThis.localStorage?.getItem("token") ??
    globalThis.localStorage?.getItem("auth_token") ??
    globalThis.sessionStorage?.getItem("accessToken") ??
    globalThis.sessionStorage?.getItem("token") ??
    globalThis.sessionStorage?.getItem("auth_token");

  if (directToken) return directToken;

  // Try to get from user object
  const rawUser =
    globalThis.localStorage?.getItem("auth_user") ??
    globalThis.localStorage?.getItem("user") ??
    globalThis.sessionStorage?.getItem("auth_user") ??
    globalThis.sessionStorage?.getItem("user");

  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser);
    return (
      user.token ||
      user.accessToken ||
      user.raw?.token ||
      user.raw?.accessToken ||
      null
    );
  } catch {
    return null;
  }
};

export const getStoredRefreshToken = (): string | null => {
  return (
    globalThis.localStorage?.getItem("refreshToken") ??
    globalThis.localStorage?.getItem("refresh_token") ??
    globalThis.sessionStorage?.getItem("refreshToken") ??
    globalThis.sessionStorage?.getItem("refresh_token") ??
    null
  );
};

// =================== PROTECTED ROUTES ===================

export const PROTECTED_ROUTE_PATTERNS = [
  "/customer/checkout",
  "/customer/portal",
  "/cart",
  "/admin",
  "/manager",
  "/staff",
  "/supplier",
] as const;

/**
 * Centralized protected path checking
 */
export const isProtectedPath = (pathname?: string): boolean => {
  if (!pathname) return false;
  return PROTECTED_ROUTE_PATTERNS.some(path => pathname.startsWith(path));
};

// =================== JWT UTILITIES ===================

export type JwtPayload = {
  role?: string;
  permissions?: string[];
  name?: string;
  userId?: string;
  id?: string;
  uid?: string;
  user_id?: string;
  accountId?: string;
  nameid?: string;
  sub?: string;
  exp?: number;
  iat?: number;
  [k: string]: unknown;
};

const isValidUserIdCandidate = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes('@')) return false;
  return true;
};

export const decodeJwtPayload = (token?: string | null): JwtPayload | null => {
  try {
    if (!token || typeof token !== 'string') return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const json = typeof globalThis?.atob === 'function' ? globalThis.atob(padded) : atob(padded);
    return json ? (JSON.parse(json) as JwtPayload) : null;
  } catch {
    // Silently fail if token decode fails
    return null;
  }
};

export const extractRole = (payload: Record<string, unknown> | null | undefined): string => {
  if (!payload) return 'CUSTOMER';

  const directRole =
    payload.role ||
    payload.userRole ||
    payload.accountRole ||
    payload.authority;

  if (directRole) return normalizeRole(directRole);

  const listRole =
    pickRoleFromList(payload.roles) || pickRoleFromList(payload.authorities);

  if (listRole) return normalizeRole(listRole);

  return 'CUSTOMER';
};

export const extractRoleFromToken = (
  token: string | null | undefined
): string | null => {
  const claims = decodeJwtPayload(token ?? null);
  if (!claims) return null;

  const claimRole = claims.role || claims.userRole || claims.accountRole || claims.authority;
  if (claimRole) return normalizeRole(claimRole);

  const listRole = pickRoleFromList(claims.roles) || pickRoleFromList(claims.authorities);
  if (listRole) return normalizeRole(listRole);

  return null;
};

export const getRoleFromToken = (token?: string | null): string => {
  const r = extractRoleFromToken(token);
  return normalizeRole(r || 'CUSTOMER');
};

export const extractUserIdFromToken = (token?: string | null): string | null => {
  const claims = decodeJwtPayload(token ?? null);
  if (!claims) return null;

  const record = claims as Record<string, unknown>;

  const candidates: unknown[] = [
    claims.userId,
    claims.id,
    claims.uid,
    claims.user_id,
    claims.accountId,
    claims.nameid,
    record['nameId'],
    record['nameidentifier'],
    record['name_identifier'],
    record['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
    claims.sub,
  ];

  for (const candidate of candidates) {
    if (isValidUserIdCandidate(candidate)) {
      return candidate.trim();
    }
  }

  return null;
};

export type LoginResponse = {
  access: string | null;
  refresh: string | null;
  apiUser: Record<string, unknown>;
};

export const parseLoginResponse = (resp: unknown): LoginResponse => {
  const raw = (resp && (resp as Record<string, unknown>)?.data) ?? resp;
  const payload = (raw as Record<string, unknown>)?.data ?? raw;
  const payloadObj = payload as Record<string, unknown>;
  
  const access = (
    payloadObj?.accessToken ?? 
    payloadObj?.token ?? 
    (raw as Record<string, unknown>)?.accessToken ?? 
    (raw as Record<string, unknown>)?.token
  ) || null;
  
  const refresh = (
    payloadObj?.refreshToken ?? 
    (raw as Record<string, unknown>)?.refreshToken
  ) || null;
  
  const apiUser = (
    payloadObj?.user ?? 
    (raw as Record<string, unknown>)?.user ?? 
    payloadObj ?? 
    raw
  ) as Record<string, unknown>;

  return { access: typeof access === 'string' ? access : null, refresh: typeof refresh === 'string' ? refresh : null, apiUser };
};
