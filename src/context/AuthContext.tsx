/* eslint-disable react-refresh/only-export-components */
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { http } from '../api/axios';
import { CUSTOMER_ENGAGEMENT_REGISTER_URL } from '../constants/apiEndPoints';
import { decodeJwtPayload, getRoleFromToken, parseLoginResponse, clearAuthStorage } from '../utils/authHelpers';
import { logout as logoutAPI } from '../services/authService';
import { getAdminFranchises } from '../services/franchiseService';

type AuthUser = {
  id?: string | number | null;
  userId?: string | number | null;
  supplierId?: string | number | null;
  supplierStatus?: string | null;
  accountStatus?: string | null;
  staffId?: string | number | null;
  // franchiseId?: string | number | null;
  username?: string;
  email?: string;
  role?: string;
  franchiseId?: string | null; // <-- ĐÃ THÊM FRANCHISE ID
  raw?: Record<string, unknown>;
};

type SupplierAccountLookup = {
  id?: string;
  accountId?: string;
  name?: string;
  status?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  currentUser: AuthUser | null;
  role: string;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser | null>;
  logout: () => void;
};

const AuthContext = React.createContext<AuthContextType | null>(null);
const CUSTOMER_SYNC_KEY_PREFIX = 'customer_engagement_synced:';

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const pickString = (...values: unknown[]): string => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

const pickBoolean = (...values: unknown[]): boolean | null => {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (normalized === 'true') return true;
      if (normalized === 'false') return false;
    }
  }
  return null;
};

const normalizeRoleName = (role: unknown): string =>
  String(role || '')
    .toUpperCase()
    .replace(/^ROLE_/, '');

const REQUIRED_ACCOUNT_STATUS = 'ACTIVE';
const REQUIRED_SUPPLIER_STATUS = 'APPROVED';

const resolveSupplierProfileForSession = async (
  accessToken: string | null
): Promise<SupplierAccountLookup> => {
  const claims = decodeJwtPayload(accessToken);
  const userId = pickString(claims?.userId);

  if (!userId) {
    throw new Error('Không thể xác định tài khoản supplier từ token đăng nhập.');
  }

  const response = await http.get(`/api/suppliers/account/${encodeURIComponent(userId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'X-Skip-Auth': 'true',
      'X-Skip-401-Redirect': 'true',
    },
  });

  const payload =
    (response && typeof response === 'object' && 'data' in response
      ? (response as { data?: unknown }).data
      : response) ?? {};

  const payloadRecord = toRecord(payload);
  const supplier = (
    payloadRecord.result ??
    payloadRecord.data ??
    payload
  ) as SupplierAccountLookup;

  const accountId = pickString(supplier?.accountId);
  const status = normalizeRoleName(supplier?.status);

  if (!accountId || accountId !== userId) {
    throw new Error('Tài khoản supplier không hợp lệ. Vui lòng liên hệ quản trị viên.');
  }

  if (status !== REQUIRED_SUPPLIER_STATUS) {
    throw new Error('Tài khoản supplier chưa ACTIVE. Vui lòng liên hệ quản trị viên.');
  }

  return {
    ...supplier,
    status,
  };
};

// Re-export types for backward compatibility
export type { AuthContextType, AuthUser };

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem('refreshToken')
  );
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw =
        localStorage.getItem('user') ||
        localStorage.getItem('auth_user') ||
        sessionStorage.getItem('user') ||
        sessionStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<string>(localStorage.getItem('role') || 'CUSTOMER');

  useEffect(() => {
    if (accessToken) {
      const decoded = getRoleFromToken(accessToken);
      setRole(decoded);
      setUser((prev) => {
        const next = { ...prev, role: decoded } as AuthUser;
        try {
          localStorage.setItem('user', JSON.stringify(next));
          localStorage.setItem('auth_user', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save user to localStorage:', e);
        }
        try {
          localStorage.setItem('role', decoded);
        } catch (e) {
          console.error('Failed to save role to localStorage:', e);
        }
        return next;
      });
      // Ensure axios default Authorization header is set on initial load
      try {
        if (accessToken && http?.defaults?.headers) {
          http.defaults.headers.common ??= {};
          (http.defaults.headers.common as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        }
      } catch (e) {
        console.error('Failed to set Authorization header:', e);
      }
    }
  }, [accessToken]);

  const attemptLogin = useCallback(
    async (
      endpoints: string[],
      payloads: Record<string, string>[]
    ): Promise<unknown> => {
      let lastError: Error | null = null;

      for (const endpoint of endpoints) {
        for (const payload of payloads) {
          try {
            return await http.post(endpoint, payload, {
              headers: { 'X-Skip-Auth': 'true' },
            });
          } catch (error) {
            const axiosError = error as { response?: { status: number } } | null;
            lastError = error instanceof Error ? error : new Error(String(error));
            const status = axiosError?.response?.status;
            const shouldRetry = [400, 404, 415, 422, 500].includes(status ?? 0);

            if (!shouldRetry) {
              throw error;
            }
          }
        }
      }

      if (lastError) throw lastError;
      return null;
    },
    []
  );

  const storeAuthData = useCallback(
    (access: string | null, refresh: string | null, userObj: AuthUser) => {
      setAccessToken(access);
      setRefreshToken(refresh);
      setUser(userObj);
      setRole(userObj.role || 'CUSTOMER');

      try {
        if (access) localStorage.setItem('accessToken', access);
        if (refresh) localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('auth_user', JSON.stringify(userObj));
        localStorage.setItem('role', userObj.role || 'CUSTOMER');
        if (userObj?.franchiseId) {
          localStorage.setItem('franchiseId', String(userObj.franchiseId));
        }
      } catch (e) {
        console.error('Failed to save auth to localStorage:', e);
      }

      try {
        if (access && http?.defaults?.headers) {
          http.defaults.headers.common ??= {};
          (http.defaults.headers.common as Record<string, string>)['Authorization'] = `Bearer ${access}`;
        }
      } catch (e) {
        console.error('Failed to set Authorization header:', e);
      }
    },
    []
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const loginEndpoints = [
        '/api/auth-service/auth/login',
        '/api/auth/login',
        '/api/auth-service/login',
      ];

      const loginPayloads = [
        { email, password },
        { username: email, password },
        { email, username: email, password },
      ];

      const resp = await attemptLogin(
        loginEndpoints,
        loginPayloads as Record<string, string>[]
      );
      const { access, refresh, apiUser } = parseLoginResponse(resp);
      const rawResp = toRecord(resp);
      const rawData = toRecord(rawResp.data);
      const rawPayload = toRecord(rawData.data);
      const userPayload = toRecord(apiUser);
      const nestedUser = toRecord(userPayload.user);

      const decodedRole = getRoleFromToken(access);
      const username = (apiUser?.name || apiUser?.username || apiUser?.email || '') as string;

      const userId = pickString(
        userPayload.id,
        userPayload.userId,
        nestedUser.id,
        nestedUser.userId,
      );

      const franchiseId = pickString(
        userPayload.franchiseId,
        nestedUser.franchiseId,
        rawPayload.franchiseId,
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext.login] Extracted IDs:', {
          userId,
          franchiseId,
          userPayload,
          nestedUser,
          rawPayload,
        });
      }

      const resolvedEmail = pickString(
        userPayload.email,
        nestedUser.email,
        rawPayload.email,
      ) || email;

      const userObj: AuthUser = {
        id: apiUser?.id as string | number | null,
        userId: userId || null,
        supplierId: null,
        supplierStatus: null,
        accountStatus: null,
        staffId: (apiUser?.staffId ?? apiUser?.id) as string | number | null,
        franchiseId: franchiseId || null,
        username,
        email: resolvedEmail,
        role: decodedRole,
        // franchiseId: franchiseId || null,
        raw: (resp && typeof resp === 'object' && 'data' in resp ? (resp as Record<string, unknown>)?.data : null) as Record<string, unknown> | null ?? {},
      };

      // For ADMIN users without franchiseId, fetch and set first franchise as default
      if (normalizeRoleName(decodedRole) === 'ADMIN' && !franchiseId) {
        try {
          const franchisesResponse = await getAdminFranchises();
          const franchisesData = franchisesResponse?.data;
          const franchises = Array.isArray(franchisesData) ? franchisesData : franchisesData?.result || [];
          
          if (franchises.length > 0) {
            const defaultFranchiseId = franchises[0]?.franchiseId || franchises[0]?.id;
            if (defaultFranchiseId) {
              userObj.franchiseId = String(defaultFranchiseId);
              console.debug('[AuthContext.login] Set default franchiseId for ADMIN:', defaultFranchiseId);
            }
          }
        } catch (error) {
          console.warn('[AuthContext.login] Failed to fetch default franchise for ADMIN:', error);
          // Continue without default franchise, user can select one later
        }
      }

      if (normalizeRoleName(decodedRole) === 'SUPPLIER') {
        const accountStatus = normalizeRoleName(
          pickString(
            userPayload.status,
            userPayload.accountStatus,
            nestedUser.status,
            nestedUser.accountStatus,
            rawPayload.status,
            rawPayload.accountStatus,
          )
        );

        if (accountStatus !== REQUIRED_ACCOUNT_STATUS) {
          throw new Error('Tài khoản đăng nhập chưa ACTIVE. Vui lòng liên hệ quản trị viên.');
        }

        const supplierProfile = await resolveSupplierProfileForSession(access);
        const supplierId = pickString(supplierProfile.id);
        const supplierStatus = pickString(supplierProfile.status);
        if (supplierId) {
          userObj.supplierId = supplierId;
          userObj.staffId = supplierId;
        }
        if (supplierStatus) {
          userObj.supplierStatus = supplierStatus;
        }
        userObj.accountStatus = accountStatus;
      }

      const isFirstLogin = pickBoolean(
        userPayload.isFirstLogin,
        nestedUser.isFirstLogin,
        rawPayload.isFirstLogin,
      );
      const syncKey = `${CUSTOMER_SYNC_KEY_PREFIX}${userId}:${franchiseId}`;
      const hasSynced = userId.length > 0 && franchiseId.length > 0 && localStorage.getItem(syncKey) === '1';
      const normalizedRole = normalizeRoleName(decodedRole);
      const shouldSyncCustomer =
        normalizedRole === 'CUSTOMER' &&
        access &&
        franchiseId.length > 0 &&
        (isFirstLogin === true || !hasSynced);

      if (process.env.NODE_ENV === 'development') {
        console.log('[AuthContext.login] Customer sync check:', {
          normalizedRole,
          hasAccess: !!access,
          franchiseId,
          franchiseIdLength: franchiseId.length,
          isFirstLogin,
          hasSynced,
          shouldSyncCustomer,
        });
      }

      if (shouldSyncCustomer) {
        try {
          const syncHeaders: Record<string, string> = {
            Authorization: `Bearer ${access}`,
            'X-Skip-Auth': 'true',
            'X-Skip-401-Redirect': 'true',
            'X-User-Role': 'CUSTOMER',
          };

          if (userId.length > 0) {
            syncHeaders['X-User-Id'] = userId;
          }

          if (username && username.trim().length > 0) {
            syncHeaders['X-User-Name'] = encodeURIComponent(username.trim());
          }

          await http.post(CUSTOMER_ENGAGEMENT_REGISTER_URL(franchiseId), undefined, {
            headers: {
              ...syncHeaders,
            },
          });

          if (userId.length > 0) {
            localStorage.setItem(syncKey, '1');
          }
        } catch (syncError) {
          console.warn('[AuthContext.login] Customer engagement sync failed, but continuing with login:', syncError);
          // Don't throw error - customer engagement sync is optional and should not block login
          // User can complete login even if engagement sync fails
        }
      }

      storeAuthData(access, refresh, userObj);
      return userObj;
    },
    [attemptLogin, storeAuthData]
  );

  const logout = useCallback(async () => {
    // Call logout API first if we have an access token
    if (accessToken) {
      try {
        await logoutAPI(accessToken);
        console.log('[AuthContext.logout] Successfully called logout API');
      } catch (error) {
        console.error('[AuthContext.logout] Error calling logout API:', error);
        // Continue with local cleanup even if API call fails
      }
    }

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setRole('CUSTOMER');

    // Use centralized auth storage clearing
    clearAuthStorage();

    try {
      if (http?.defaults?.headers) {
        if ((http.defaults.headers as Record<string, unknown>)?.common) {
          delete ((http.defaults.headers as Record<string, unknown>).common as Record<string, unknown>)['Authorization'];
        }
        delete (http.defaults.headers as Record<string, unknown>)['Authorization'];
      }
    } catch (e) {
      console.error('Failed to clear Authorization header:', e);
    }

    try {
      document.cookie = 'auth_token=; Max-Age=0; path=/';
      document.cookie = 'refresh_token=; Max-Age=0; path=/';
    } catch {
      // ignore
    }
  }, [accessToken]);

  const authValue = useMemo(
    () => ({
      user,
      currentUser: user,
      role,
      accessToken,
      refreshToken,
      isAuthenticated: !!accessToken,
      login,
      logout,
    }),
    [user, role, accessToken, refreshToken, login, logout]
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
