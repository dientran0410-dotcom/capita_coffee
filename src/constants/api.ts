const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

// Backend API gateway domain (no trailing slash), configured per environment.
export const API_GATE_WAY = normalizeUrl(
  import.meta.env.VITE_API_BASE_URL || "https://api-gate-way-3ds5.onrender.com"
);
export const API_GATEWAY = API_GATE_WAY;

// Auth service requests should target backend domain directly.
export const AUTH_SERVICE_URL = API_GATEWAY;

// Service endpoint prefixes
export const API_ENDPOINT = {
  REPORT: `${API_GATEWAY}/api/report-service`,
  ENGAGEMENT: `${API_GATEWAY}/api/engagement-service`,
};

export default {
  API_GATE_WAY,
  API_GATEWAY,
  AUTH_SERVICE_URL,
};
