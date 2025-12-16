export const ENV_CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  APP_NAME: import.meta.env.VITE_APP_NAME || "Virtual Device Simulator",
  APP_VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  NODE_ENV: import.meta.env.NODE_ENV || "development",
};

export const isDevelopment = ENV_CONFIG.NODE_ENV === "development";
export const isProduction = ENV_CONFIG.NODE_ENV === "production";
