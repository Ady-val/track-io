import axios from "axios";

const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";
export const VD_TOKEN_KEY = "vd_token";
export const VD_USER_KEY = "vd_user";

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(VD_TOKEN_KEY);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(VD_TOKEN_KEY);
      localStorage.removeItem(VD_USER_KEY);
    }
    return Promise.reject(error);
  },
);

export default apiClient;
