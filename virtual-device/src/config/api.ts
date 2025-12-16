export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || "/api",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};

export const ENDPOINTS = {
  DEVICES: "/devices",
  SIGNALS: "/signals",
  DEPARTMENTS: "/departments",
  AREAS: "/areas",
} as const;
