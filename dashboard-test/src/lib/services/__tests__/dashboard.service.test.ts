import { AxiosError, type AxiosResponse } from "axios";

import type {
  DashboardResponse,
  EventsResponse,
  DashboardStatus,
} from "@/types/dashboard";

import apiClient from "../../api";
import DashboardService from "../dashboard.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("DashboardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAreasData", () => {
    it("should fetch dashboard areas data", async () => {
      const mockResponse: DashboardResponse = {
        success: true,
        data: [],
        headers: [],
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getAreasData();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/areas-data"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching areas data", async () => {
      const error = new Error("Internal server error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getAreasData()).rejects.toThrow(
        "Internal server error"
      );
    });
  });

  describe("getOpenEvents", () => {
    it("should fetch open events", async () => {
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getOpenEvents();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/events/open"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching open events", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getOpenEvents()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getInProgressEvents", () => {
    it("should fetch in progress events", async () => {
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getInProgressEvents();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/events/in-progress"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching in progress events", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getInProgressEvents()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getClosedEvents", () => {
    it("should fetch closed events", async () => {
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getClosedEvents();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/events/closed"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching closed events", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getClosedEvents()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getRecentClosedEvents", () => {
    it("should fetch recent closed events", async () => {
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getRecentClosedEvents();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/events/closed/recent"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching recent closed events", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getRecentClosedEvents()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getAllEvents", () => {
    it("should fetch all events", async () => {
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getAllEvents();

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/api/dashboard/events/all"
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching all events", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getAllEvents()).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("getEventsByArea", () => {
    it("should fetch events by area id", async () => {
      const areaId = 1;
      const mockResponse: EventsResponse = {
        success: true,
        data: [],
        total: 0,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<DashboardResponse | EventsResponse | DashboardStatus>);

      const result = await DashboardService.getEventsByArea(areaId);

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/api/dashboard/events/area/${areaId}`
      );
      expect(result).toEqual(mockResponse);
    });

    it("should handle errors when fetching events by area", async () => {
      const error = new AxiosError("Area not found");
      error.response = {
        status: 404,
        data: { message: "Area not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getEventsByArea(999)).rejects.toThrow(
        "Area not found"
      );
    });
  });

  describe("getDashboardStatus", () => {
    it("should fetch dashboard status", async () => {
      const mockStatus: DashboardStatus = {
        success: true,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      };

      mockApiClient.get.mockResolvedValue({
        data: mockStatus,
      } as AxiosResponse<DashboardStatus>);

      const result = await DashboardService.getDashboardStatus();

      expect(mockApiClient.get).toHaveBeenCalledWith("/api/dashboard/status");
      expect(result).toEqual(mockStatus);
    });

    it("should handle errors when fetching dashboard status", async () => {
      const error = new Error("Internal server error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(DashboardService.getDashboardStatus()).rejects.toThrow(
        "Internal server error"
      );
    });
  });
});
