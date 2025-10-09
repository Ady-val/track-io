import type {
  Measurement,
  MeasurementResponse,
  CreateMeasurementData,
} from "@/types/measurement";

import apiClient from "../api";

export const measurementService = {
  /**
   * Get measurement by external ID
   * @param externalId - The external ID to search for
   * @returns The measurement if found, null otherwise
   */
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

  /**
   * Create a new measurement
   * @param data - The measurement data to create
   * @returns The created measurement
   */
  async create(data: CreateMeasurementData): Promise<Measurement> {
    const response = await apiClient.post<{
      message: string;
      data: Measurement;
    }>("/measurements", data);

    return response.data.data;
  },
};

export default measurementService;
