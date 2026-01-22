import type {
  DashboardMeasurementGroup,
  DashboardMeasurementGroupResponse,
  DashboardMeasurementGroupSingleResponse,
  CreateDashboardMeasurementGroupData,
  UpdateDashboardMeasurementGroupData,
} from "@/types/dashboard-measurement-group";

import apiClient from "../api";

class DashboardMeasurementGroupService {
  private readonly baseUrl = "/dashboard-measurement-groups";

  private normalizeChartMeasurementIds(
    value: unknown
  ): number[] | undefined {
    if (Array.isArray(value)) {
      return value
        .map((item) => Number(item))
        .filter((item) => Number.isFinite(item));
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed
            .map((item) => Number(item))
            .filter((item) => Number.isFinite(item));
        }
      } catch {
        // fall through to comma-separated parsing
      }

      return trimmed
        .split(",")
        .map((item) => Number(item.trim()))
        .filter((item) => Number.isFinite(item));
    }

    return undefined;
  }

  private normalizeGroup(
    group: DashboardMeasurementGroup
  ): DashboardMeasurementGroup {
    return {
      ...group,
      chartMeasurementIds: this.normalizeChartMeasurementIds(
        group.chartMeasurementIds
      ),
    };
  }

  async getAll(): Promise<DashboardMeasurementGroup[]> {
    try {
      const response = await apiClient.get<DashboardMeasurementGroupResponse>(
        this.baseUrl
      );

      const data = response.data.data || [];
      return data.map((group) => this.normalizeGroup(group));
    } catch (error) {
      console.error("Error fetching dashboard measurement groups:", error);

      return [];
    }
  }

  async getById(id: number): Promise<DashboardMeasurementGroup | null> {
    try {
      const response =
        await apiClient.get<DashboardMeasurementGroupSingleResponse>(
          `${this.baseUrl}/${id}`
        );

      const group = response.data.data || null;
      return group ? this.normalizeGroup(group) : null;
    } catch (error) {
      console.error("Error fetching dashboard measurement group by ID:", error);

      return null;
    }
  }

  async create(
    data: CreateDashboardMeasurementGroupData
  ): Promise<DashboardMeasurementGroup> {
    const response =
      await apiClient.post<DashboardMeasurementGroupSingleResponse>(
        this.baseUrl,
        data
      );

    return this.normalizeGroup(response.data.data);
  }

  async update(
    id: number,
    data: UpdateDashboardMeasurementGroupData
  ): Promise<DashboardMeasurementGroup> {
    const response =
      await apiClient.put<DashboardMeasurementGroupSingleResponse>(
        `${this.baseUrl}/${id}`,
        data
      );

    return this.normalizeGroup(response.data.data);
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

const dashboardMeasurementGroupService = new DashboardMeasurementGroupService();

export default dashboardMeasurementGroupService;
