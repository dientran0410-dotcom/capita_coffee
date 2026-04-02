/**
 * Centralized fetch wrapper.
 * All frontend API calls should go through this helper.
 */

import { getLoggedInBranchId } from './branch';
import { toAppError } from './errorMessage';
import { API_GATEWAY } from '../constants/api';

const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
};

const AUTH_PATH_REGEX =
  /\/auth-service\/login|\/auth-service\/register|\/auth-service\/refresh|\/auth-service\/forgot-password|\/auth\/login|\/auth\/register|\/auth\/refresh|\/auth\/forgot-password/i;

type HttpOptions = RequestInit & {
  skipAuth?: boolean;
};

type StoredIdentity = {
  userId: string;
  role: string;
  userName: string;
};

function resolveStoredIdentity(): StoredIdentity | null {
  try {
    const rawUser =
      globalThis.localStorage?.getItem('user') ??
      globalThis.localStorage?.getItem('auth_user') ??
      globalThis.sessionStorage?.getItem('user') ??
      globalThis.sessionStorage?.getItem('auth_user');

    if (!rawUser) return null;

    const user = JSON.parse(rawUser) as any;
    const userId = String(
      user?.userId ||
        user?.id ||
        user?.raw?.userId ||
        user?.raw?.id ||
        user?.raw?.user?.userId ||
        user?.raw?.user?.id ||
        user?.staffId ||
        '',
    ).trim();

    if (!userId) return null;

    const role = String(user?.role || user?.raw?.role || 'CUSTOMER')
      .toUpperCase()
      .replace(/^ROLE_/, '')
      .trim();

    const userNameRaw = String(user?.username || user?.name || user?.raw?.username || user?.raw?.name || 'Unknown');
    const userName = encodeURIComponent(userNameRaw);

    return { userId, role: role || 'CUSTOMER', userName };
  } catch {
    return null;
  }
}

function getStoredToken(): string | null {
  const directToken =
    globalThis.localStorage?.getItem('accessToken') ??
    globalThis.localStorage?.getItem('token') ??
    globalThis.localStorage?.getItem('auth_token') ??
    globalThis.sessionStorage?.getItem('accessToken') ??
    globalThis.sessionStorage?.getItem('token') ??
    globalThis.sessionStorage?.getItem('auth_token');

  if (directToken) return directToken;

  const rawUser =
    globalThis.localStorage?.getItem('auth_user') ??
    globalThis.localStorage?.getItem('user') ??
    globalThis.sessionStorage?.getItem('auth_user') ??
    globalThis.sessionStorage?.getItem('user');

  if (!rawUser) return null;

  try {
    const user = JSON.parse(rawUser) as {
      token?: string;
      accessToken?: string;
      raw?: {
        token?: string;
        accessToken?: string;
      };
    };

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
}

function getBranchId(): string {
  return getLoggedInBranchId() || '';
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};

  if (headers instanceof Headers) {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers) as Record<string, string>;
  }

  return { ...(headers as Record<string, string>) };
}

function normalizePath(path: string): string {
  const candidate = path.startsWith('/') ? path : `/${path}`;

  if (candidate.startsWith('/api/')) {
    return candidate.slice(4);
  }

  return candidate;
}

function withBranchId(path: string): string {
  const [pathname, query = ''] = path.split('?');
  if (!query) return path;

  const params = new URLSearchParams(query);
  if (!params.has('branchId')) return path;

  const existingBranchId = (params.get('branchId') || '').trim();
  if (existingBranchId) {
    return `${pathname}?${params.toString()}`;
  }

  const branchId = getBranchId();
  if (branchId) {
    params.set('branchId', branchId);
  } else {
    params.delete('branchId');
  }
  return `${pathname}?${params.toString()}`;
}

function buildCandidates(path: string): string[] {
  const normalized = withBranchId(normalizePath(path));
  const candidates = [normalized];

  if (normalized.startsWith('/staffs')) {
    candidates.unshift(normalized.replace('/staffs', '/shift-service/staffs'));
  }

  if (normalized.startsWith('/staff/')) {
    candidates.unshift(normalized.replace('/staff/', '/staff-service/staff/'));
  }

  if (normalized.startsWith('/shifts')) {
    candidates.unshift(normalized.replace('/shifts', '/shift-service/shifts'));
  }

  return [...new Set(candidates)];
}

function toUrl(path: string): string {
  const isAbsolute = /^https?:\/\//i.test(path);
  return isAbsolute ? path : `${API_GATEWAY}/api${path}`;
}

export async function http(path: string, options: HttpOptions = {}) {
  const token = getStoredToken();
  const candidates = buildCandidates(path);
  const callerHeaders = normalizeHeaders(options.headers);

  const skipAuth =
    Boolean(options.skipAuth) ||
    callerHeaders['X-Skip-Auth'] === 'true' ||
    callerHeaders['X-Skip-Auth'] === '1';

  let lastResponse: Response | null = null;

  for (const candidatePath of candidates) {
    const url = toUrl(candidatePath);
    
    // Kiểm tra xem có phải auth endpoint không (hỗ trợ cả URL tuyệt đối và tương đối)
    const isAuthPath = AUTH_PATH_REGEX.test(url) || /api-auth-service|auth-service\/.*login|auth-service\/.*register/i.test(url);
    const shouldAttachAuth = token && !skipAuth && !isAuthPath;

    const headers: Record<string, string> = {
      ...DEFAULT_HEADERS,
      ...(shouldAttachAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...callerHeaders,
    };

    // Some gateway/protected endpoints require these headers in addition to Bearer token.
    if (shouldAttachAuth) {
      const identity = resolveStoredIdentity();
      if (identity) {
        if (!headers['X-User-Id']) headers['X-User-Id'] = identity.userId;
        if (!headers['X-User-Role']) headers['X-User-Role'] = identity.role;
        if (!headers['X-User-Name']) headers['X-User-Name'] = identity.userName;
        // Some services in this repo also accept USER as an alias.
        if (!headers['USER']) headers['USER'] = identity.userId;
      }
    }

    // This header is safe and needed when downstream services tunnel through ngrok.
    headers['ngrok-skip-browser-warning'] = '1';

    if (options.body instanceof FormData) {
      delete headers['Content-Type'];
    }

    const res = await fetch(url, {
      ...options,
      headers,
      // Add 15 second timeout to prevent hanging requests
      signal: AbortSignal.timeout(15000),
    });

    if (res.status === 404) {
      lastResponse = res;
      continue;
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('text/html')) {
      const html = await res.text().catch(() => '');
      if (/ERR_NGROK_6024|ngrok(?:-free)?\.app|ngrok\.io/i.test(html)) {
        throw toAppError(
          new Error(
            'Ngrok warning page was returned instead of API JSON. Please keep requests on /api proxy and ensure gateway forwards ngrok-skip-browser-warning.'
          )
        );
      }
      throw toAppError(new Error('Expected JSON response but received HTML content.'));
    }

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const extractedMessage =
        data?.message ||
        data?.error?.message ||
        (data?.errors && typeof data.errors === 'object'
          ? Object.values(data.errors as Record<string, unknown>)
              .flatMap((v) => (Array.isArray(v) ? v : [v]))
              .find((v) => typeof v === 'string' && v.trim())
          : undefined) ||
        `HTTP ${res.status}`;

      try {
        const safeHeaders = { ...headers };
        if (safeHeaders.Authorization) safeHeaders.Authorization = 'Bearer ***';

        console.error('[http] Request failed', {
          url,
          method: options?.method || 'GET',
          headers: safeHeaders,
          body: typeof options?.body === 'string' ? options.body : undefined,
          status: res.status,
          response: data,
        });
      } catch {
        // ignore log failures
      }

      throw toAppError({
        status: res.status,
        message: extractedMessage,
        raw: data,
      });
    }
    return data.result ?? data;
  }

  if (lastResponse) {
    const data = await lastResponse.json().catch(() => ({}));
    const extractedMessage =
      data?.message ||
      data?.error?.message ||
      (data?.errors && typeof data.errors === 'object'
        ? Object.values(data.errors as Record<string, unknown>)
            .flatMap((v) => (Array.isArray(v) ? v : [v]))
            .find((v) => typeof v === 'string' && v.trim())
        : undefined) ||
      `HTTP ${lastResponse.status}`;

    try {
      console.error('[http] Request failed (after candidates)', {
        status: lastResponse.status,
        response: data,
      });
    } catch {
      // ignore
    }

    throw toAppError({
      status: lastResponse.status,
      message: extractedMessage,
      raw: data,
    });
  }

  throw toAppError(new Error('API request failed'));
}
