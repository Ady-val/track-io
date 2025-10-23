import type {
  Device,
  DeviceResponse,
  DevicesResponse,
  CreateDeviceData,
  DeviceFilters,
} from "@/types/device";

import apiClient from "../api";

class DeviceService {
  private readonly baseUrl = "/devices";

  async getAll(filters?: DeviceFilters): Promise<DevicesResponse> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.areaId) params.append("areaId", filters.areaId.toString());
    if (filters?.externalId) params.append("externalId", filters.externalId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    if (filters?.includeDeleted) params.append("includeDeleted", "true");

    // Always include relations for devices page
    params.append("includeRelations", "true");

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<DevicesResponse>(url);

    return response.data;
  }

  async getById(id: number): Promise<DeviceResponse> {
    const response = await apiClient.get<DeviceResponse>(
      `${this.baseUrl}/${id}`
    );

    return response.data;
  }

  async getByExternalId(externalId: string): Promise<Device | null> {
    try {
      const response = await this.getAll({ externalId, limit: 1, offset: 0 });

      if (response.data && response.data.length > 0) {
        return response.data[0] ?? null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching device by external ID:", error);

      return null;
    }
  }

  async getCount(): Promise<{ message: string; count: number }> {
    const response = await apiClient.get<{ message: string; count: number }>(
      `${this.baseUrl}/count`
    );

    return response.data;
  }

  async create(data: CreateDeviceData): Promise<Device> {
    const response = await apiClient.post<DeviceResponse>(this.baseUrl, data);

    return response.data.data;
  }

  async update(
    id: number,
    data: { name?: string; externalId?: string }
  ): Promise<DeviceResponse> {
    const response = await apiClient.patch<DeviceResponse>(
      `${this.baseUrl}/${id}`,
      data
    );

    return response.data;
  }

  async delete(id: number): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(
      `${this.baseUrl}/${id}`
    );

    return response.data;
  }

  async restore(id: number): Promise<DeviceResponse> {
    const response = await apiClient.patch<DeviceResponse>(
      `${this.baseUrl}/${id}/restore`
    );

    return response.data;
  }
}

const deviceService = new DeviceService();

export default deviceService;
