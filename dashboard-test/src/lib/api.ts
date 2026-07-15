import axios from "axios";

// Por defecto usamos una ruta relativa ("/api") para que el navegador haga las
// peticiones al MISMO origen desde el que se sirvió el frontend (nginx proxea
// "/api" al backend). Así el mismo build funciona en cualquier IP/dominio sin
// hornear la URL del backend. VITE_API_URL solo se usa como override explícito
// (p. ej. despliegues donde el backend vive en otro host).
const apiBaseURL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

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
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default apiClient;
