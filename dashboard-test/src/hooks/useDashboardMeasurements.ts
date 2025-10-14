import { useState, useEffect } from "react";
import type { DashboardMeasurement } from "@/types/dashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const useDashboardMeasurements = () => {
  const [dashboards, setDashboards] = useState<DashboardMeasurement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboards = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/dashboard-measurements`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setDashboards(result.data || []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch dashboards";
      setError(errorMessage);
      console.error("Error fetching dashboard measurements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboards();
  }, []);

  return {
    dashboards,
    loading,
    error,
    refetch: fetchDashboards,
  };
};


