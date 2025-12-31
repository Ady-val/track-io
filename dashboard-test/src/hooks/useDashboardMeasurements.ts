import { useState, useEffect, useCallback } from "react";

import apiClient from "@/lib/api";
import type { DashboardMeasurement } from "@/types/dashboard";

export const useDashboardMeasurements = (groupId?: number | null) => {
  const [dashboards, setDashboards] = useState<DashboardMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{
        message: string;
        data: DashboardMeasurement[];
        total: number;
      }>("/dashboard-measurements", {
        params: groupId ? { groupId: groupId.toString() } : {},
      });

      setDashboards(response.data.data ?? []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboards";

      setError(errorMessage);
      console.error("Error fetching dashboard measurements:", err);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDashboards();
  }, [fetchDashboards]);

  return {
    dashboards,
    loading,
    error,
    refetch: fetchDashboards,
  };
};

export const useAvailableDashboardMeasurements = () => {
  const [dashboards, setDashboards] = useState<DashboardMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailable = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<{
        message: string;
        data: DashboardMeasurement[];
        total: number;
      }>("/dashboard-measurements/available");

      setDashboards(response.data.data ?? []);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to fetch available dashboard measurements";

      setError(errorMessage);
      console.error("Error fetching available dashboard measurements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAvailable();
  }, [fetchAvailable]);

  return {
    data: dashboards,
    loading,
    error,
    refetch: fetchAvailable,
  };
};
