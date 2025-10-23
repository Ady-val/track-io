import type { Area, AreasResponse } from "@/types/area";

import apiClient from "../api";

export interface AreaFilters {
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

class AreaService {
  private readonly baseUrl = "/areas";

  async getAll(filters?: AreaFilters): Promise<AreasResponse> {
    const params = new URLSearchParams();

    if (filters?.name) params.append("name", filters.name);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());
    if (filters?.includeDeleted) params.append("includeDeleted", "true");

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<AreasResponse>(url);

    return response.data;
  }

  async getById(id: number): Promise<{ message: string; data: Area }> {
    const response = await apiClient.get<{ message: string; data: Area }>(
      `${this.baseUrl}/${id}`
    );

    return response.data;
  }

  async getCount(): Promise<{ message: string; count: number }> {
    const response = await apiClient.get<{ message: string; count: number }>(
      `${this.baseUrl}/count`
    );

    return response.data;
  }

  async create(data: {
    name: string;
  }): Promise<{ message: string; data: Area }> {
    const response = await apiClient.post<{ message: string; data: Area }>(
      this.baseUrl,
      data
    );

    return response.data;
  }

  async update(
    id: number,
    data: { name?: string }
  ): Promise<{ message: string; data: Area }> {
    const response = await apiClient.patch<{ message: string; data: Area }>(
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

  async restore(id: number): Promise<{ message: string; data: Area }> {
    const response = await apiClient.patch<{ message: string; data: Area }>(
      `${this.baseUrl}/${id}/restore`
    );

    return response.data;
  }
}

const areaService = new AreaService();

export default areaService;
