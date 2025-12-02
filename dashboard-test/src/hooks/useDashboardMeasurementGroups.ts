import { useState, useEffect } from "react";

import dashboardMeasurementGroupService from "@/lib/services/dashboard-measurement-group.service";
import type { DashboardMeasurementGroup } from "@/types/dashboard-measurement-group";

export const useDashboardMeasurementGroups = () => {
  const [groups, setGroups] = useState<DashboardMeasurementGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardMeasurementGroupService.getAll();

      setGroups(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch groups";

      setError(errorMessage);
      console.error("Error fetching dashboard measurement groups:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
  };
};
