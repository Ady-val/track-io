import type { DeviceFilters } from "../types/device";

import { useQuery } from "@tanstack/react-query";

import deviceService from "../lib/services/device.service";

export const useDevices = (filters?: DeviceFilters) => {
  return useQuery({
    queryKey: ["devices", filters],
    queryFn: () => deviceService.getAll(filters ?? { limit: 50 }),
    staleTime: 0, // Data is always considered stale, will refetch on mount
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true, // Continue refetching even when tab is not active
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchOnMount: true, // Always refetch when component mounts
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
  });
};
