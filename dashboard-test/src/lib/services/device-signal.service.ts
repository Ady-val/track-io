import type {
  DeviceSignal,
  DeviceSignalResponse,
  DeviceSignalsResponse,
  CreateDeviceSignalData,
  DeviceSignalFilters,
} from "@/types/device-signal";

import apiClient from "../api";

class DeviceSignalService {
  private readonly baseUrl = "/device-signals";

  async getAll(filters?: DeviceSignalFilters): Promise<DeviceSignalsResponse> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.deviceId)
      params.append("deviceId", filters.deviceId.toString());
    if (filters?.departmentId)
      params.append("departmentId", filters.departmentId.toString());
    if (filters?.externalValueId)
      params.append("externalValueId", filters.externalValueId);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    if (filters?.includeDeleted) params.append("includeDeleted", "true");

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<DeviceSignalsResponse>(url);

    return response.data;
  }

  async getById(id: number): Promise<DeviceSignalResponse> {
    const response = await apiClient.get<DeviceSignalResponse>(
      `${this.baseUrl}/${id}`
    );

    return response.data;
  }

  async getByDeviceId(deviceId: number): Promise<DeviceSignal[]> {
    try {
      const response = await this.getAll({ deviceId });

      return response.data || [];
    } catch (error) {
      console.error("Error fetching device signals by device ID:", error);

      return [];
    }
  }

  async getByExternalValueIdAndDeviceExternalId(
    externalValueId: string,
    deviceExternalId: string
  ): Promise<DeviceSignal | null> {
    try {
      const deviceService = await import("./device.service");
      const device =
        await deviceService.default.getByExternalId(deviceExternalId);

      if (!device) {
        return null;
      }
      const response = await this.getAll({
        externalValueId,
        deviceId: device.id,
        limit: 1,
        offset: 0,
      });

      if (response.data && response.data.length > 0) {
        return response.data[0] ?? null;
      }

      return null;
    } catch (error) {
      console.error(
        "Error fetching device signal by external value ID and device external ID:",
        error
      );

      return null;
    }
  }

  async getByExternalValueId(
    externalValueId: string
  ): Promise<DeviceSignal | null> {
    try {
      const response = await this.getAll({
        externalValueId,
        limit: 1,
        offset: 0,
      });

      if (response.data && response.data.length > 0) {
        return response.data[0] ?? null;
      }

      return null;
    } catch (error) {
      console.error(
        "Error fetching device signal by external value ID:",
        error
      );

      return null;
    }
  }

  async getCount(): Promise<{ message: string; count: number }> {
    const response = await apiClient.get<{ message: string; count: number }>(
      `${this.baseUrl}/count`
    );

    return response.data;
  }

  async create(data: CreateDeviceSignalData): Promise<DeviceSignal> {
    const response = await apiClient.post<DeviceSignalResponse>(
      this.baseUrl,
      data
    );

    return response.data.data;
  }

  async update(
    id: number,
    data: { name?: string; departmentId?: number; externalValueId?: string }
  ): Promise<DeviceSignalResponse> {
    const response = await apiClient.patch<DeviceSignalResponse>(
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

  async restore(id: number): Promise<DeviceSignalResponse> {
    const response = await apiClient.patch<DeviceSignalResponse>(
      `${this.baseUrl}/${id}/restore`
    );

    return response.data;
  }
}

const deviceSignalService = new DeviceSignalService();

export default deviceSignalService;
