import { useState, useEffect, useCallback } from "react";

import areaService, { type AreaFilters } from "@/lib/services/area.service";
import type { Area } from "@/types/area";

interface UseAreasReturn {
  areas: Area[];
  loading: boolean;
  error: string | null;
  total: number;
  refetch: () => Promise<void>;
  getAreas: (filters?: AreaFilters) => Promise<void>;
}

export const useAreas = (initialFilters?: AreaFilters): UseAreasReturn => {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);

  const getAreas = useCallback(async (filters?: AreaFilters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await areaService.getAll(filters);
      const sortedAreas = response.data.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setAreas(sortedAreas);
      setTotal(response.total);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error al cargar las áreas";

      setError(errorMessage);
      console.error("Error fetching areas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refetch = useCallback(async () => {
    await getAreas(initialFilters);
  }, [getAreas, initialFilters]);

  useEffect(() => {
    getAreas(initialFilters);
  }, [getAreas, initialFilters]);

  return {
    areas,
    loading,
    error,
    total,
    refetch,
    getAreas,
  };
};
