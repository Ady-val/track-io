import apiClient from "../api";
import type {
  CreateDashboardMeasurementWithMeasurementData,
  UpdateDashboardMeasurementWithMeasurementData,
  DashboardMeasurementSingleResponse,
} from "@/types/dashboard-measurement";
import type { DashboardMeasurement } from "@/types/dashboard";

class DashboardMeasurementService {
  private readonly baseUrl = "/dashboard-measurements";

  async createWithMeasurement(
    data: CreateDashboardMeasurementWithMeasurementData
  ): Promise<DashboardMeasurement> {
    const payload = {
      ...data,
      groupId:
        data.groupId === null || data.groupId === undefined
          ? undefined
          : data.groupId,
    };
    const response =
      await apiClient.post<DashboardMeasurementSingleResponse<DashboardMeasurement>>(
        `${this.baseUrl}/with-measurement`,
        payload
      );
    return response.data.data;
  }

  async updateWithMeasurement(
    id: number,
    data: UpdateDashboardMeasurementWithMeasurementData
  ): Promise<DashboardMeasurement> {
    const payload = {
      ...data,
      groupId:
        data.groupId === null || data.groupId === undefined
          ? null
          : data.groupId,
    };
    const response =
      await apiClient.put<DashboardMeasurementSingleResponse<DashboardMeasurement>>(
        `${this.baseUrl}/${id}/with-measurement`,
        payload
      );
    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

const dashboardMeasurementService = new DashboardMeasurementService();
export default dashboardMeasurementService;

