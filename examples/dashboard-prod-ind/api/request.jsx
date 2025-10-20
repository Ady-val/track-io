import axios from "axios";
import { loadMocks } from "./mocks";

const backendIp = "192.168.124.236";
// Cambiar true por false para usar la API de producción
export const apiURL = "http://localhost:8080";
// export const apiURL = `http://${backendIp}:8080`;
// const dev = process.env.REACT_APP_DEPLOYMENT_ENV;
const mocksEnabled = false;

/**
 * It returns an axios instance with a baseURL of the API
 * @returns An axios instance with a baseURL of the baseURL constant.
 */
export const request = () => {
  const id = window.localStorage.getItem("id");
  const token = window.localStorage.getItem("token");
  const customAxios = axios.create({
    baseURL: apiURL,
    credentials: "include",
    headers: {
      user: id,
      token,
    },
  });

  customAxios.interceptors.response.use(
    (config) => {
      return config;
    },
    (err) => {
      if (err.response) {
        const { noToken } = err.response.data;

        if (noToken) {
          window.localStorage.removeItem("name");
          window.localStorage.removeItem("token");
          window.location.reload(false);
        }
      }

      return err;
    }
  );

  if (mocksEnabled) loadMocks(customAxios);

  return customAxios;
};

export const axiosInstance = request();
