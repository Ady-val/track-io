import { useState, useEffect } from "react";

import { apiService, type Device } from "../services/api";

export const useVirtualDevices = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Usar API real siempre
        const response = await apiService.getVirtualDevices();

        setDevices(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error loading devices:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadDevices();
  }, []);

  return { devices, isLoading, error };
};
