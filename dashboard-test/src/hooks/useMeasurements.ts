import { useQuery } from "@tanstack/react-query";

import type { MeasurementFilters } from "@/types/measurement";
import { measurementService } from "../lib/services/measurement.service";

export const useMeasurements = (filters?: MeasurementFilters) => {
  return useQuery({
    queryKey: ["measurements", filters],
    queryFn: () => measurementService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMeasurement = (id: number) => {
  return useQuery({
    queryKey: ["measurement", id],
    queryFn: () => measurementService.getById(id),
    enabled: !!id,
  });
};

export const useMeasurementsByExternalId = (externalId: string) => {
  return useQuery({
    queryKey: ["measurements", "externalId", externalId],
    queryFn: () => measurementService.getByExternalId(externalId),
    enabled: !!externalId,
  });
};
