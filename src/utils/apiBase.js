// Determines the correct API base at runtime for both dev and production builds.
// In dev (Vite), BASE_URL is '/', and we rely on the dev proxy for '/api'.
// In production, API lives at '/api' (root level).
export const API_BASE = (() => {
  const base = (import.meta && import.meta.env && import.meta.env.BASE_URL) || '/';
  // For root domain deployment, always use /api
  return '/api';
})();
