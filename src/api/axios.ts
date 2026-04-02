import axios from "axios";
import type {
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toAppError } from "../utils/errorMessage";
import { getStoredToken, getStoredRefreshToken, clearAuthStorage, isProtectedPath } from "../utils/authHelpers";
import { refreshToken as refreshAccessToken } from "../services/authService";

const apiUrl = "/api";

export type CustomAxiosRequestConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
};

// Extended config to support retry mechanism
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
  skipAuth?: boolean;
}

// Token response interface for type safety
interface TokenResponse {
  accessToken?: string;
  token?: string;
  access?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    token?: string;
    refreshToken?: string;
  };
}

// 👉 lấy token - now using centralized version from authHelpers

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});


// ================= REQUEST =================
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { skipAuth?: boolean }) => {
    // Keep URL resolution stable: baseURL is /api, so normalize /api/* -> /*
    // to avoid generating /api/api/* on requests that already include /api prefix.
    if (
      config.baseURL === "/api" &&
      typeof config.url === "string" &&
      config.url.startsWith("/api/")
    ) {
      config.url = config.url.slice(4);
    }

    const token = getStoredToken();
    const url = config.url || "";
    const fullUrl =
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `${config.baseURL || ""}${url}`;

    const skipAuth =
      Boolean(config.skipAuth) ||
      config.headers?.["X-Skip-Auth"] === "true" ||
      config.headers?.["X-Skip-Auth"] === "1";

    const manualAuthorization =
      config.headers["Authorization"] ||
      config.headers["authorization"];

    const isPublicAuthEndpoint =
      /\/auth-service(?:\/auth)?\/login|\/auth-service\/register|\/auth-service\/refresh|\/auth\/login|\/auth\/register|api-auth-service\/login|api-auth-service\/register/i.test(
        fullUrl,
      );

    const isCartEndpoint = /\/products\/cart/i.test(fullUrl);

    if (skipAuth) {
      // Allow caller-provided Authorization for special flows.
      if (!manualAuthorization) {
        delete config.headers["Authorization"];
        delete config.headers["authorization"];
      }
    } else if ((token && !isPublicAuthEndpoint) || isCartEndpoint) {
      // Add Authorization header if we have a token and it's not a public auth endpoint
      if (token && !isPublicAuthEndpoint) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      // Add custom headers for backend authentication (required for cart endpoints)
      try {
        // Try to get user info from localStorage
        const userStr = globalThis.localStorage?.getItem("user") || globalThis.localStorage?.getItem("auth_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = user?.userId || user?.id || user?.raw?.userId || user?.raw?.id || user?.staffId;
          const userRole = user?.role || "CUSTOMER";
          const userName = user?.username || user?.name || "Unknown";

          if (userId) {
            // Encode userName to avoid non-ISO-8859-1 characters (Vietnamese diacritics, etc.)
            // Use encodeURIComponent to safely encode special characters
            const encodedUserName = encodeURIComponent(String(userName));

            config.headers["X-User-Id"] = String(userId);
            config.headers["X-User-Role"] = String(userRole).toUpperCase().replace(/^ROLE_/, "");
            config.headers["X-User-Name"] = encodedUserName;

            console.log(`🔑 Adding auth headers for ${isCartEndpoint ? 'cart' : 'API'} request:`, {
              'X-User-Id': String(userId),
              'X-User-Role': String(userRole).toUpperCase().replace(/^ROLE_/, ""),
              'X-User-Name': encodedUserName
            });
          }
        }
      } catch (error) {
        console.warn("Failed to add custom auth headers:", error);
      }
    } else {
      delete config.headers["Authorization"];
      delete config.headers["authorization"];
    }

    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (/ngrok(?:-free)?\.app|ngrok\.io/i.test(fullUrl)) {
      config.headers["ngrok-skip-browser-warning"] = "1";
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ================= RESPONSE =================
let refreshPromise: Promise<string | null> | null = null;

async function ensureFreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const rt = getStoredRefreshToken();
  if (!rt) return null;

  refreshPromise = (async () => {
    try {
      const data = (await refreshAccessToken(rt)) as TokenResponse;
      const nextAccess =
        data?.accessToken ||
        data?.token ||
        data?.access ||
        data?.data?.accessToken ||
        data?.data?.token ||
        null;
      const nextRefresh = data?.refreshToken || data?.data?.refreshToken || null;

      if (typeof nextAccess === "string" && nextAccess.trim()) {
        localStorage.setItem("accessToken", nextAccess);
      }
      if (typeof nextRefresh === "string" && nextRefresh.trim()) {
        localStorage.setItem("refreshToken", nextRefresh);
      }

      return typeof nextAccess === "string" && nextAccess.trim() ? nextAccess : null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    let skipGlobalErrorLog = false;

    if (error?.response?.status === 401) {
      const originalConfig = error.config as ExtendedAxiosRequestConfig;
      const skipRedirect =
        originalConfig?.headers?.["X-Skip-401-Redirect"] === "true" ||
        originalConfig?.headers?.["X-Skip-401-Redirect"] === "1";
      skipGlobalErrorLog = skipRedirect;

      const requestUrl = String(originalConfig?.url || "");
      const isAuthRefresh = /\/auth\/refresh|\/auth-service\/auth\/refresh/i.test(requestUrl);

      // Try refresh + retry ONCE (for any protected API like coupon/points)
      if (!skipRedirect && !isAuthRefresh && !originalConfig?._retry) {
        originalConfig._retry = true;
        const nextAccess = await ensureFreshAccessToken();

        if (nextAccess) {
          originalConfig.headers = originalConfig.headers || {};
          originalConfig.headers["Authorization"] = `Bearer ${nextAccess}`;
          return api(originalConfig);
        }
      }

      if (!skipRedirect) {
        console.warn("[Axios] 401 Unauthorized detected", {
          url: originalConfig?.url,
          method: originalConfig?.method,
          hasToken: !!getStoredToken(),
          pathname: globalThis.location?.pathname,
        });

        const currentPath = globalThis.location?.pathname;
        const isProtectedRoute = isProtectedPath(currentPath);

        if (isProtectedRoute) {
          // Only force-redirect on protected pages.
          // Public pages like /login, /register should be able to handle 401 without being bounced away.
          clearAuthStorage();
          if (globalThis.location && globalThis.location.pathname !== "/login") {
            globalThis.location.href = "/login";
          }
        } else {
          console.warn(
            "[Axios] 401 on public path - not redirecting",
            currentPath
          );
        }
      }
    }

    if (error.response && !skipGlobalErrorLog) {
      console.error("API Error Response:", error.response.data);
    } else if (!error.response) {
      console.error("API Error:", error.message);
    }

    return Promise.reject(toAppError(error));
  }
);


// ================= API UTILS =================
export const apiUtils = {
  async get<T>(url: string, params?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
    const res = await api.get<T>(url, { ...config, params });
    return res.data;
  },

  async post<T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
    const res = await api.post<T>(url, data, config);
    return res.data;
  },

  async put<T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
    const res = await api.put<T>(url, data, config);
    return res.data;
  },

  async delete<T>(url: string, config?: CustomAxiosRequestConfig): Promise<T> {
    const res = await api.delete<T>(url, config);
    return res.data;
  },

  async patch<T>(url: string, data?: unknown, config?: CustomAxiosRequestConfig): Promise<T> {
    const res = await api.patch<T>(url, data, config);
    return res.data;
  },

  async uploadFiles<T>(
    url: string,
    files: File | File[],
    config?: CustomAxiosRequestConfig,
  ): Promise<T> {
    const formData = new FormData();

    if (Array.isArray(files)) {
      files.forEach((file, index) => formData.append(`file${index}`, file));
    } else {
      formData.append("file", files);
    }

    const res = await api.post<T>(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        "Content-Type": "multipart/form-data",
      },
    });

    return res.data;
  },
};

export const http = api;

export default api;
