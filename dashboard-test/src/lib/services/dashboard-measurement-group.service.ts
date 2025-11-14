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

  async getAll(): Promise<DashboardMeasurementGroup[]> {
    try {
      const response = await apiClient.get<DashboardMeasurementGroupResponse>(
        this.baseUrl
      );

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching dashboard measurement groups:", error);

      return [];
    }
  }

  async getById(id: number): Promise<DashboardMeasurementGroup | null> {
    try {
      const response = await apiClient.get<DashboardMeasurementGroupSingleResponse>(
        `${this.baseUrl}/${id}`
      );

      return response.data.data || null;
    } catch (error) {
      console.error("Error fetching dashboard measurement group by ID:", error);

      return null;
    }
  }

  async create(
    data: CreateDashboardMeasurementGroupData
  ): Promise<DashboardMeasurementGroup> {
    const response = await apiClient.post<DashboardMeasurementGroupSingleResponse>(
      this.baseUrl,
      data
    );

    return response.data.data;
  }

  async update(
    id: number,
    data: UpdateDashboardMeasurementGroupData
  ): Promise<DashboardMeasurementGroup> {
    const response = await apiClient.put<DashboardMeasurementGroupSingleResponse>(
      `${this.baseUrl}/${id}`,
      data
    );

    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

const dashboardMeasurementGroupService = new DashboardMeasurementGroupService();

export default dashboardMeasurementGroupService;


