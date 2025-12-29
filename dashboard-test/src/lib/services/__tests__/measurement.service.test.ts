import { AxiosError, type AxiosResponse } from "axios";

import { createMockMeasurement } from "@/test-utils/mock-data";
import type { Measurement, MeasurementResponse } from "@/types/measurement";

import apiClient from "../../api";
import measurementService from "../measurement.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("MeasurementService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all measurements without filters", async () => {
      const mockMeasurements = [createMockMeasurement()];
      const mockResponse: MeasurementResponse = {
        message: "Measurements retrieved",
        data: mockMeasurements,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<MeasurementResponse>);

      const result = await measurementService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith("/measurements", {
        params: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockMeasurements[0]);
    });

    it("should fetch measurements with filters", async () => {
      const mockMeasurements = [createMockMeasurement({ type: "temperature" })];
      const mockResponse: MeasurementResponse = {
        message: "Measurements retrieved",
        data: mockMeasurements,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<MeasurementResponse>);

      const result = await measurementService.getAll({ type: "temperature" });

      expect(mockApiClient.get).toHaveBeenCalledWith("/measurements", {
        params: { type: "temperature" },
      });
      expect(result).toHaveLength(1);
      expect(result[0]?.type).toBe("temperature");
    });

    it("should return empty array on error", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      // Mock console.error para evitar output en tests
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await measurementService.getAll();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching measurements:",
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getById", () => {
    it("should fetch measurement by id", async () => {
      const mockMeasurement = createMockMeasurement({ id: 123 });
      const mockResponse = {
        message: "Measurement found",
        data: mockMeasurement,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Measurement }>);

      const result = await measurementService.getById(123);

      expect(mockApiClient.get).toHaveBeenCalledWith("/measurements/123");
      expect(result).toEqual(mockMeasurement);
      expect(result?.id).toBe(123);
    });

    it("should return null when measurement not found", async () => {
      const error = {
        message: "Not found",
        response: { status: 404, data: { message: "Not found" } },
      } as AxiosError<{ message: string }>;

      mockApiClient.get.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await measurementService.getById(999);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should return null on error", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await measurementService.getById(1);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("getByExternalId", () => {
    it("should fetch measurement by external id", async () => {
      const mockMeasurement = createMockMeasurement({
        externalId: "MEAS-123",
      });
      const mockResponse: MeasurementResponse = {
        message: "Measurements retrieved",
        data: [mockMeasurement],
        total: 1,
        pagination: {
          limit: 1,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<MeasurementResponse>);

      const result = await measurementService.getByExternalId("MEAS-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/measurements", {
        params: { externalId: "MEAS-123", limit: 1, offset: 0 },
      });
      expect(result).toEqual(mockMeasurement);
      expect(result?.externalId).toBe("MEAS-123");
    });

    it("should return null when measurement not found", async () => {
      const mockResponse: MeasurementResponse = {
        message: "Measurements retrieved",
        data: [],
        total: 0,
        pagination: {
          limit: 1,
          offset: 0,
          total: 0,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<MeasurementResponse>);

      const result = await measurementService.getByExternalId("NON-EXISTENT");

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await measurementService.getByExternalId("MEAS-123");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe("create", () => {
    it("should create a new measurement", async () => {
      const newMeasurement = createMockMeasurement({
        id: 999,
        name: "New Measurement",
        externalId: "MEAS-NEW",
      });
      const mockResponse = {
        message: "Measurement created",
        data: newMeasurement,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Measurement }>);

      const result = await measurementService.create({
        name: "New Measurement",
        externalId: "MEAS-NEW",
        type: "temperature",
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/measurements", {
        name: "New Measurement",
        externalId: "MEAS-NEW",
        type: "temperature",
      });
      expect(result).toEqual(newMeasurement);
      expect(result.name).toBe("New Measurement");
    });

    it("should handle errors when creating measurement", async () => {
      const error = new AxiosError("Validation error");
      error.response = {
        status: 400,
        data: { message: "Validation error" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(
        measurementService.create({
          name: "",
          externalId: "",
          type: "temperature",
        })
      ).rejects.toThrow("Validation error");
    });
  });
});
