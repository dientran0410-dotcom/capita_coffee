// const normalizedGateway =
//   (import.meta.env.VITE_API_GATEWAY || 'https://api-gate-way-3ds5.onrender.com').replace(/\/+$/, '');

// export const API_GATEWAY = normalizedGateway;

// // Auth Service
// export const AUTH_SERVICE_URL =
//   import.meta.env.VITE_AUTH_SERVICE_URL || 'https://auth-service-wq2a.onrender.com';

// // API Endpoints structure
// export const API_ENDPOINT = {
//   REPORT: import.meta.env.DEV
//     ? '/api/reports-service'
//     : `${API_GATEWAY}/api/reports-service`,
//   ENGAGEMENT: import.meta.env.DEV
//     ? '/api/engagement-service'
//     : `${API_GATEWAY}/api/engagement-service`,
// };

// export default {
//   API_GATEWAY,
//   AUTH_SERVICE_URL,
// };

const normalizeUrl = (value: string) => value.replace(/\/+$/, "");

// Central API gateway constant used across the frontend.
// DEV: requests should go through Vite proxy (/api) to avoid CORS.
export const API_GATE_WAY = normalizeUrl(
  import.meta.env.VITE_API_GATEWAY || "https://api-gate-way-3ds5.onrender.com"
);
export const API_GATEWAY = API_GATE_WAY;

// Always keep auth-service calls relative so they go through FE domain (/api rewrite/proxy).
export const AUTH_SERVICE_URL = "";

// Service endpoint prefixes
export const API_ENDPOINT = {
  REPORT: import.meta.env.DEV
    ? '/api/report-service'
    : `${API_GATEWAY}/api/report-service`,
  ENGAGEMENT: import.meta.env.DEV
    ? '/api/engagement-service'
    : `${API_GATEWAY}/api/engagement-service`,
};

export default {
  API_GATE_WAY,
  API_GATEWAY,
  AUTH_SERVICE_URL,
};
