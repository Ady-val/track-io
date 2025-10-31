import axios from "axios";

// En desarrollo local: apunta a localhost:3000
// En producción (Docker): usa la variable de entorno VITE_API_URL
const apiBaseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", error);

    return Promise.reject(error);
  }
);

export default apiClient;
