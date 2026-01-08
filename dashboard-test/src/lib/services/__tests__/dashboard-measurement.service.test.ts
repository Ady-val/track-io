import { AxiosError, type AxiosResponse } from "axios";

import type {
  DashboardMeasurementSingleResponse,
  CreateDashboardMeasurementWithMeasurementData,
  UpdateDashboardMeasurementWithMeasurementData,
} from "@/types/dashboard-measurement";
import type { DashboardMeasurement } from "@/types/dashboard";

import apiClient from "../../api";
import dashboardMeasurementService from "../dashboard-measurement.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createMockDashboardMeasurement = (
  overrides?: Partial<DashboardMeasurement>
): DashboardMeasurement => ({
  id: 1,
  measurementId: 1,
  externalId: "TEST-001",
  name: "Test Measurement",
  type: "temperature",
  value: 50,
  unit: "°C",
  timestamp: new Date().toISOString(),
  status: "active",
  minValue: 0,
  maxValue: 100,
  measurement: {
    id: 1,
    name: "Test Measurement",
    externalId: "TEST-001",
    type: "temperature",
  },
  ...overrides,
});

describe("DashboardMeasurementService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createWithMeasurement", () => {
    it("should create dashboard measurement with measurement successfully", async () => {
      const createData: CreateDashboardMeasurementWithMeasurementData = {
        externalId: "TEST-001",
        name: "Test Measurement",
        type: "temperature",
        minValue: 0,
        maxValue: 100,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 1,
        measurementId: 1,
        ...createData,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message: "Measurement and dashboard measurement created successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      const result = await dashboardMeasurementService.createWithMeasurement(
        createData
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/dashboard-measurements/with-measurement",
        {
          externalId: "TEST-001",
          name: "Test Measurement",
          type: "temperature",
          minValue: 0,
          maxValue: 100,
          groupId: undefined,
        }
      );
      expect(result).toEqual(mockDashboardMeasurement);
      expect(result.id).toBe(1);
    });

    it("should handle groupId correctly when provided", async () => {
      const createData: CreateDashboardMeasurementWithMeasurementData = {
        externalId: "TEST-002",
        name: "Test Measurement 2",
        type: "humidity",
        groupId: 5,
        minValue: 10,
        maxValue: 90,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id: 2,
        groupId: 5,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message: "Measurement and dashboard measurement created successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      const result = await dashboardMeasurementService.createWithMeasurement(
        createData
      );

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/dashboard-measurements/with-measurement",
        {
          externalId: "TEST-002",
          name: "Test Measurement 2",
          type: "humidity",
          groupId: 5,
          minValue: 10,
          maxValue: 90,
        }
      );
      expect(result).toEqual(mockDashboardMeasurement);
    });

    it("should set groupId to undefined when null", async () => {
      const createData: CreateDashboardMeasurementWithMeasurementData = {
        externalId: "TEST-003",
        name: "Test Measurement 3",
        type: "pressure",
        groupId: null,
        minValue: 0,
        maxValue: 100,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        groupId: null,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message: "Measurement and dashboard measurement created successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      await dashboardMeasurementService.createWithMeasurement(createData);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        "/dashboard-measurements/with-measurement",
        {
          externalId: "TEST-003",
          name: "Test Measurement 3",
          type: "pressure",
          groupId: undefined,
          minValue: 0,
          maxValue: 100,
        }
      );
    });

    it("should handle errors when creating dashboard measurement", async () => {
      const createData: CreateDashboardMeasurementWithMeasurementData = {
        externalId: "TEST-001",
        name: "Test Measurement",
        type: "temperature",
        minValue: 100,
        maxValue: 50, // Invalid: minValue > maxValue
      };
      const error = new AxiosError("Validation error");
      error.response = {
        status: 400,
        data: { message: "minValue must be less than maxValue" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(
        dashboardMeasurementService.createWithMeasurement(createData)
      ).rejects.toThrow("Validation error");
    });
  });

  describe("updateWithMeasurement", () => {
    it("should update dashboard measurement with measurement successfully", async () => {
      const id = 1;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        name: "Updated Measurement",
        minValue: 10,
        maxValue: 90,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id,
        minValue: 10,
        maxValue: 90,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message:
            "Measurement and dashboard measurement updated successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      const result = await dashboardMeasurementService.updateWithMeasurement(
        id,
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/dashboard-measurements/1/with-measurement",
        {
          name: "Updated Measurement",
          minValue: 10,
          maxValue: 90,
          groupId: null,
        }
      );
      expect(result).toEqual(mockDashboardMeasurement);
      expect(result.minValue).toBe(10);
      expect(result.maxValue).toBe(90);
    });

    it("should handle groupId correctly when provided", async () => {
      const id = 1;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        groupId: 3,
        minValue: 20,
        maxValue: 80,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id,
        groupId: 3,
        minValue: 20,
        maxValue: 80,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message:
            "Measurement and dashboard measurement updated successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      const result = await dashboardMeasurementService.updateWithMeasurement(
        id,
        updateData
      );

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/dashboard-measurements/1/with-measurement",
        {
          groupId: 3,
          minValue: 20,
          maxValue: 80,
        }
      );
      expect(result.groupId).toBe(3);
    });

    it("should set groupId to null when null is provided", async () => {
      const id = 1;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        groupId: null,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id,
        groupId: null,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message:
            "Measurement and dashboard measurement updated successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      await dashboardMeasurementService.updateWithMeasurement(id, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/dashboard-measurements/1/with-measurement",
        {
          groupId: null,
        }
      );
    });

    it("should set groupId to null when undefined is provided", async () => {
      const id = 1;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        minValue: 15,
        maxValue: 85,
      };
      const mockDashboardMeasurement = createMockDashboardMeasurement({
        id,
        groupId: null,
      });
      const mockResponse: DashboardMeasurementSingleResponse<DashboardMeasurement> =
        {
          message:
            "Measurement and dashboard measurement updated successfully",
          data: mockDashboardMeasurement,
        };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardMeasurementSingleResponse<DashboardMeasurement>>);

      await dashboardMeasurementService.updateWithMeasurement(id, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(
        "/dashboard-measurements/1/with-measurement",
        {
          minValue: 15,
          maxValue: 85,
          groupId: null,
        }
      );
    });

    it("should handle errors when updating dashboard measurement", async () => {
      const id = 999;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        minValue: 100,
        maxValue: 50, // Invalid: minValue > maxValue
      };
      const error = new AxiosError("Validation error");
      error.response = {
        status: 400,
        data: { message: "minValue must be less than maxValue" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.put.mockRejectedValue(error);

      await expect(
        dashboardMeasurementService.updateWithMeasurement(id, updateData)
      ).rejects.toThrow("Validation error");
    });

    it("should handle 404 error when dashboard measurement not found", async () => {
      const id = 999;
      const updateData: UpdateDashboardMeasurementWithMeasurementData = {
        name: "Updated Name",
      };
      const error = new AxiosError("Not found");
      error.response = {
        status: 404,
        data: { message: "Dashboard measurement with ID 999 not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.put.mockRejectedValue(error);

      await expect(
        dashboardMeasurementService.updateWithMeasurement(id, updateData)
      ).rejects.toThrow("Not found");
    });
  });

  describe("delete", () => {
    it("should delete dashboard measurement successfully", async () => {
      const id = 1;

      mockApiClient.delete.mockResolvedValue({
        status: 204,
        data: undefined,
      } as AxiosResponse);

      await dashboardMeasurementService.delete(id);

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/dashboard-measurements/1"
      );
      expect(mockApiClient.delete).toHaveBeenCalledTimes(1);
    });

    it("should handle errors when deleting dashboard measurement", async () => {
      const id = 999;
      const error = new AxiosError("Not found");
      error.response = {
        status: 404,
        data: { message: "Dashboard measurement with ID 999 not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(dashboardMeasurementService.delete(id)).rejects.toThrow(
        "Not found"
      );
      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/dashboard-measurements/999"
      );
    });

    it("should handle network errors", async () => {
      const id = 1;
      const error = new Error("Network error");

      mockApiClient.delete.mockRejectedValue(error);

      await expect(dashboardMeasurementService.delete(id)).rejects.toThrow(
        "Network error"
      );
    });
  });
});
