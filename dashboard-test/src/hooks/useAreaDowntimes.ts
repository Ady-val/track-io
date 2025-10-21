import { useQuery } from "@tanstack/react-query";
import areaDowntimeService from "../lib/services/areaDowntime.service";
import type { AreaDowntimeFilters } from "../types/areaDowntime";

export const useAreaDowntimes = (filters?: AreaDowntimeFilters) => {
  return useQuery({
    queryKey: ["areaDowntimes", filters],
    queryFn: () => areaDowntimeService.getAll(filters || { limit: 10 }),
    staleTime: 0, // Data is always considered stale, will refetch on mount
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });
};
