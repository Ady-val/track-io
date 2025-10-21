import type {
  Measurement,
  MeasurementResponse,
  CreateMeasurementData,
  MeasurementFilters,
} from "@/types/measurement";

import apiClient from "../api";

export const measurementService = {
  async getAll(filters?: MeasurementFilters): Promise<Measurement[]> {
    try {
      const response = await apiClient.get<MeasurementResponse>(
        "/measurements",
        {
          params: filters,
        }
      );

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching measurements:", error);

      return [];
    }
  },

  async getById(id: number): Promise<Measurement | null> {
    try {
      const response = await apiClient.get<{
        message: string;
        data: Measurement;
      }>(`/measurements/${id}`);

      return response.data.data || null;
    } catch (error) {
      console.error("Error fetching measurement by ID:", error);

      return null;
    }
  },

  async getByExternalId(externalId: string): Promise<Measurement | null> {
    try {
      const response = await apiClient.get<MeasurementResponse>(
        "/measurements",
        {
          params: { externalId, limit: 1, offset: 0 },
        }
      );

      if (response.data.data && response.data.data.length > 0) {
        return response.data.data[0] ?? null;
      }

      return null;
    } catch (error) {
      console.error("Error fetching measurement:", error);

      return null;
    }
  },

  async create(data: CreateMeasurementData): Promise<Measurement> {
    const response = await apiClient.post<{
      message: string;
      data: Measurement;
    }>("/measurements", data);

    return response.data.data;
  },
};

export default measurementService;
