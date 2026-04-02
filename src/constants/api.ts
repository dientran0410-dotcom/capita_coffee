// Keep a single FE-relative API base for all environments.
export const API_GATE_WAY = "/api";
export const API_GATEWAY = API_GATE_WAY;

// Always keep auth-service calls relative so they go through FE domain (/api rewrite/proxy).
export const AUTH_SERVICE_URL = "";

// Service endpoint prefixes
export const API_ENDPOINT = {
  REPORT: '/api/report-service',
  ENGAGEMENT: '/api/engagement-service',
};

export default {
  API_GATE_WAY,
  API_GATEWAY,
  AUTH_SERVICE_URL,
};
