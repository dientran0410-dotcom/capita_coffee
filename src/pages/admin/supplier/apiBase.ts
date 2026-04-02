const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "https://api-gate-way-3ds5.onrender.com"
).replace(/\/+$/, "");

export function backendApiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
