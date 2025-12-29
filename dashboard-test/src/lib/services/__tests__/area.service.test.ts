import { AxiosError, type AxiosResponse } from "axios";

import type { AreasResponse, Area } from "@/types/area";

import apiClient from "../../api";
import areaService from "../area.service";

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

describe("AreaService", () => {
  const mockArea: Area = {
    id: 1,
    name: "Test Area",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all areas without filters", async () => {
      const mockResponse: AreasResponse = {
        message: "Areas retrieved",
        data: [mockArea],
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AreasResponse>);

      const result = await areaService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith("/areas");
      expect(result).toEqual(mockResponse);
      expect(result.data).toHaveLength(1);
    });

    it("should fetch areas with name filter", async () => {
      const filteredArea = { ...mockArea, name: "Filtered Area" };
      const mockResponse: AreasResponse = {
        message: "Areas retrieved",
        data: [filteredArea],
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AreasResponse>);

      const result = await areaService.getAll({ name: "Filtered Area" });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/areas?name=Filtered+Area"
      );
      expect(result.data[0]?.name).toBe("Filtered Area");
    });

    it("should fetch areas with pagination", async () => {
      const mockResponse: AreasResponse = {
        message: "Areas retrieved",
        data: [mockArea],
        total: 1,
        pagination: {
          limit: 10,
          offset: 0,
          total: 1,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AreasResponse>);

      const result = await areaService.getAll({ limit: 10, offset: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/areas?limit=10&offset=5"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching areas", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(areaService.getAll()).rejects.toThrow("Network error");
    });
  });

  describe("getById", () => {
    it("should fetch area by id", async () => {
      const mockResponse = {
        message: "Area found",
        data: mockArea,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Area }>);

      const result = await areaService.getById(1);

      expect(mockApiClient.get).toHaveBeenCalledWith("/areas/1");
      expect(result).toEqual(mockResponse);
      expect(result.data.id).toBe(1);
    });

    it("should handle error when area not found", async () => {
      const error = new AxiosError("Area not found");

      error.response = {
        status: 404,
        data: { message: "Area not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.get.mockRejectedValue(error);

      await expect(areaService.getById(999)).rejects.toThrow("Area not found");
    });
  });

  describe("getCount", () => {
    it("should fetch area count", async () => {
      const mockResponse = {
        message: "Count retrieved",
        count: 42,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; count: number }>);

      const result = await areaService.getCount();

      expect(mockApiClient.get).toHaveBeenCalledWith("/areas/count");
      expect(result).toEqual(mockResponse);
      expect(result.count).toBe(42);
    });

    it("should handle errors when fetching count", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(areaService.getCount()).rejects.toThrow("Network error");
    });
  });

  describe("create", () => {
    it("should create a new area", async () => {
      const newArea = { ...mockArea, id: 999, name: "New Area" };
      const mockResponse = {
        message: "Area created",
        data: newArea,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Area }>);

      const result = await areaService.create({ name: "New Area" });

      expect(mockApiClient.post).toHaveBeenCalledWith("/areas", {
        name: "New Area",
      });
      expect(result).toEqual(mockResponse);
      expect(result.data.name).toBe("New Area");
    });

    it("should handle errors when creating area", async () => {
      const error = new AxiosError("Validation error");

      error.response = {
        status: 400,
        data: { message: "Validation error" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(areaService.create({ name: "" })).rejects.toThrow(
        "Validation error"
      );
    });
  });

  describe("update", () => {
    it("should update area", async () => {
      const updatedArea = { ...mockArea, name: "Updated Area" };
      const mockResponse = {
        message: "Area updated",
        data: updatedArea,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Area }>);

      const result = await areaService.update(1, { name: "Updated Area" });

      expect(mockApiClient.patch).toHaveBeenCalledWith("/areas/1", {
        name: "Updated Area",
      });
      expect(result.data.name).toBe("Updated Area");
    });

    it("should handle errors when updating area", async () => {
      const error = new AxiosError("Area not found");

      error.response = {
        status: 404,
        data: { message: "Area not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.patch.mockRejectedValue(error);

      await expect(
        areaService.update(999, { name: "Updated" })
      ).rejects.toThrow("Area not found");
    });
  });

  describe("delete", () => {
    it("should delete area", async () => {
      const mockResponse = {
        message: "Area deleted",
      };

      mockApiClient.delete.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string }>);

      const result = await areaService.delete(1);

      expect(mockApiClient.delete).toHaveBeenCalledWith("/areas/1");
      expect(result.message).toBe("Area deleted");
    });

    it("should handle errors when deleting area", async () => {
      const error = new AxiosError("Area not found");

      error.response = {
        status: 404,
        data: { message: "Area not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(areaService.delete(999)).rejects.toThrow("Area not found");
    });
  });

  describe("restore", () => {
    it("should restore deleted area", async () => {
      const restoredArea = { ...mockArea, deletedAt: null };
      const mockResponse = {
        message: "Area restored",
        data: restoredArea,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<{ message: string; data: Area }>);

      const result = await areaService.restore(1);

      expect(mockApiClient.patch).toHaveBeenCalledWith("/areas/1/restore");
      expect(result.data.deletedAt).toBeNull();
      expect(result.message).toBe("Area restored");
    });

    it("should handle errors when restoring area", async () => {
      const error = new AxiosError("Area not found");

      error.response = {
        status: 404,
        data: { message: "Area not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.patch.mockRejectedValue(error);

      await expect(areaService.restore(999)).rejects.toThrow("Area not found");
    });
  });
});
