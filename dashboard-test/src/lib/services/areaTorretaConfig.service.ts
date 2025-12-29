import type { AxiosError } from "axios";

import apiClient from "../api";

export interface AreaTorretaConfig {
  id: number;
  areaId: number;
  torretaExternalId: string;
  configurationType: "area" | "department";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaTorretaConfigDto {
  areaId: number;
  torretaExternalId: string;
  configurationType: "area" | "department";
  isActive?: boolean;
}

export interface UpdateAreaTorretaConfigDto {
  configurationType?: "area" | "department";
  isActive?: boolean;
}

class AreaTorretaConfigService {
  private readonly baseUrl = "/area-torreta-configs";

  async getByArea(areaId: number): Promise<AreaTorretaConfig[]> {
    const response = await apiClient.get<{
      message: string;
      data: AreaTorretaConfig[];
    }>(`${this.baseUrl}/area/${areaId}`);

    return response.data.data;
  }

  async getById(id: number): Promise<AreaTorretaConfig> {
    const response = await apiClient.get<{
      message: string;
      data: AreaTorretaConfig;
    }>(`${this.baseUrl}/${id}`);

    return response.data.data;
  }

  async create(data: CreateAreaTorretaConfigDto): Promise<AreaTorretaConfig> {
    try {
      const response = await apiClient.post<{
        message: string;
        data: AreaTorretaConfig;
      }>(this.baseUrl, data);

      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ message?: string }>;

      console.error("Error creating area torreta config:", axiosError);
      if (axiosError.response) {
        console.error("Response status:", axiosError.response.status);
        console.error("Response data:", axiosError.response.data);
      }
      throw axiosError;
    }
  }

  async update(
    id: number,
    data: UpdateAreaTorretaConfigDto
  ): Promise<AreaTorretaConfig> {
    const response = await apiClient.patch<{
      message: string;
      data: AreaTorretaConfig;
    }>(`${this.baseUrl}/${id}`, data);

    return response.data.data;
  }

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

const areaTorretaConfigService = new AreaTorretaConfigService();

export default areaTorretaConfigService;
