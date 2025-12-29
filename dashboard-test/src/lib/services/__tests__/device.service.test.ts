import { AxiosError, type AxiosResponse } from "axios";

import { createMockDevice } from "@/test-utils/mock-data";
import type { DevicesResponse, DeviceResponse } from "@/types/device";

import apiClient from "../../api";
import deviceService from "../device.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("DeviceService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all devices without filters", async () => {
      const mockDevices = [createMockDevice()];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?includeRelations=true"
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
    });

    it("should fetch devices with name filter", async () => {
      const mockDevices = [createMockDevice({ name: "Filtered Device" })];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getAll({ name: "Filtered Device" });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?name=Filtered+Device&includeRelations=true"
      );
      expect(result.data).toHaveLength(1);
      expect(result.data[0]?.name).toBe("Filtered Device");
    });

    it("should fetch devices with areaId filter", async () => {
      const mockDevices = [createMockDevice({ areaId: 5 })];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getAll({ areaId: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?areaId=5&includeRelations=true"
      );
      expect(result.data[0]?.areaId).toBe(5);
    });

    it("should fetch devices with pagination", async () => {
      const mockDevices = [createMockDevice()];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getAll({ limit: 10, offset: 0 });

      // Note: offset=0 is falsy in JavaScript, so it won't be added to URL
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?limit=10&includeRelations=true"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch devices with multiple filters", async () => {
      const mockDevices = [createMockDevice()];
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: mockDevices,
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getAll({
        name: "Test",
        areaId: 1,
        limit: 5,
        offset: 10,
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?name=Test&areaId=1&limit=5&offset=10&includeRelations=true"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching devices", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(deviceService.getAll()).rejects.toThrow("Network error");
      expect(mockApiClient.get).toHaveBeenCalled();
    });
  });

  describe("getById", () => {
    it("should fetch device by id", async () => {
      const mockDevice = createMockDevice({ id: 123 });
      const mockResponse: DeviceResponse = {
        message: "Device found",
        data: mockDevice,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.getById(123);

      expect(mockApiClient.get).toHaveBeenCalledWith("/devices/123");
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe(123);
    });

    it("should handle error when device not found", async () => {
      const error = new AxiosError("Device not found");
      error.response = {
        status: 404,
        data: { message: "Device not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.get.mockRejectedValue(error);

      await expect(deviceService.getById(999)).rejects.toThrow(
        "Device not found"
      );
      expect(mockApiClient.get).toHaveBeenCalledWith("/devices/999");
    });
  });

  describe("getByExternalId", () => {
    it("should fetch device by external id", async () => {
      const mockDevice = createMockDevice({ externalId: "DEV-123" });
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
        data: [mockDevice],
        total: 1,
        pagination: {
          limit: 1,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getByExternalId("DEV-123");

      // Note: offset=0 is falsy in JavaScript, so it won't be added to URL
      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/devices?externalId=DEV-123&limit=1&includeRelations=true"
      );
      expect(result).toEqual(mockDevice);
      expect(result?.externalId).toBe("DEV-123");
    });

    it("should return null when device not found", async () => {
      const mockResponse: DevicesResponse = {
        message: "Devices retrieved",
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
      } as AxiosResponse<DevicesResponse>);

      const result = await deviceService.getByExternalId("NON-EXISTENT");

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      // Mock console.error para evitar output en tests
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const result = await deviceService.getByExternalId("DEV-123");

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error fetching device by external ID:",
        error
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getCount", () => {
    it("should fetch device count", async () => {
      const mockResponse = {
        message: "Count retrieved",
        count: 42,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; count: number }>);

      const result = await deviceService.getCount();

      expect(mockApiClient.get).toHaveBeenCalledWith("/devices/count");
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(42);
    });

    it("should handle errors when fetching count", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(deviceService.getCount()).rejects.toThrow("Network error");
    });
  });

  describe("create", () => {
    it("should create a new device", async () => {
      const newDevice = createMockDevice({
        id: 999,
        name: "New Device",
        externalId: "DEV-NEW",
      });
      const mockResponse: DeviceResponse = {
        message: "Device created",
        data: newDevice,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.create({
        name: "New Device",
        externalId: "DEV-NEW",
        areaId: 1,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/devices", {
        name: "New Device",
        externalId: "DEV-NEW",
        areaId: 1,
      });
      expect(result).toEqual(newDevice);
      expect(result.name).toBe("New Device");
    });

    it("should create device with isVirtualDevice flag", async () => {
      const newDevice = createMockDevice({
        id: 1000,
        name: "Virtual Device",
        isVirtualDevice: true,
      });
      const mockResponse: DeviceResponse = {
        message: "Device created",
        data: newDevice,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.create({
        name: "Virtual Device",
        externalId: "DEV-VIRTUAL",
        areaId: 1,
        isVirtualDevice: true,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/devices", {
        name: "Virtual Device",
        externalId: "DEV-VIRTUAL",
        areaId: 1,
        isVirtualDevice: true,
      });
      expect(result.isVirtualDevice).toBe(true);
    });

    it("should handle errors when creating device", async () => {
      const error = new AxiosError("Validation error");
      error.response = {
        status: 400,
        data: { message: "Validation error" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(
        deviceService.create({
          name: "",
          externalId: "",
          areaId: 1,
        })
      ).rejects.toThrow("Validation error");
    });
  });

  describe("update", () => {
    it("should update device", async () => {
      const updatedDevice = createMockDevice({
        id: 123,
        name: "Updated Device",
      });
      const mockResponse: DeviceResponse = {
        message: "Device updated",
        data: updatedDevice,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.update(123, {
        name: "Updated Device",
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith("/devices/123", {
        name: "Updated Device",
      });
      expect(result.data.name).toBe("Updated Device");
    });

    it("should update device externalId", async () => {
      const updatedDevice = createMockDevice({
        id: 123,
        externalId: "DEV-UPDATED",
      });
      const mockResponse: DeviceResponse = {
        message: "Device updated",
        data: updatedDevice,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.update(123, {
        externalId: "DEV-UPDATED",
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith("/devices/123", {
        externalId: "DEV-UPDATED",
      });
      expect(result.data.externalId).toBe("DEV-UPDATED");
    });

    it("should handle errors when updating device", async () => {
      const error = new AxiosError("Device not found");
      error.response = {
        status: 404,
        data: { message: "Device not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        deviceService.update(999, { name: "Updated" })
      ).rejects.toThrow("Device not found");
    });
  });

  describe("delete", () => {
    it("should delete device", async () => {
      const mockResponse = {
        message: "Device deleted",
      };

      mockApiClient.delete.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string }>);

      const result = await deviceService.delete(123);

      expect(mockApiClient.delete).toHaveBeenCalledWith("/devices/123");
      expect(result.message).toBe("Device deleted");
    });

    it("should handle errors when deleting device", async () => {
      const error = new AxiosError("Device not found");
      error.response = {
        status: 404,
        data: { message: "Device not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(deviceService.delete(999)).rejects.toThrow(
        "Device not found"
      );
    });
  });

  describe("restore", () => {
    it("should restore deleted device", async () => {
      const restoredDevice = createMockDevice({
        id: 123,
        name: "Restored Device",
      });
      const mockResponse: DeviceResponse = {
        message: "Device restored",
        data: restoredDevice,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DeviceResponse>);

      const result = await deviceService.restore(123);

      expect(mockApiClient.patch).toHaveBeenCalledWith("/devices/123/restore");
      expect(result.data.name).toBe("Restored Device");
    });

    it("should handle errors when restoring device", async () => {
      const error = new AxiosError("Device not found");
      error.response = {
        status: 404,
        data: { message: "Device not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.patch.mockRejectedValue(error);

      await expect(deviceService.restore(999)).rejects.toThrow(
        "Device not found"
      );
    });
  });
});
