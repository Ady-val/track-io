import type {
  DashboardResponse,
  EventsResponse,
  DashboardStatus,
} from "../../types/dashboard";

import apiClient from "../api";

class DashboardService {
  static async getAreasData(): Promise<DashboardResponse> {
    const response = await apiClient.get("/api/dashboard/areas-data");

    return response.data;
  }

  static async getOpenEvents(): Promise<EventsResponse> {
    const response = await apiClient.get("/api/dashboard/events/open");

    return response.data;
  }

  static async getInProgressEvents(): Promise<EventsResponse> {
    const response = await apiClient.get("/api/dashboard/events/in-progress");

    return response.data;
  }

  static async getClosedEvents(): Promise<EventsResponse> {
    const response = await apiClient.get("/api/dashboard/events/closed");

    return response.data;
  }

  static async getRecentClosedEvents(): Promise<EventsResponse> {
    const response = await apiClient.get("/api/dashboard/events/closed/recent");

    return response.data;
  }

  static async getAllEvents(): Promise<EventsResponse> {
    const response = await apiClient.get("/api/dashboard/events/all");

    return response.data;
  }

  static async getEventsByArea(areaId: number): Promise<EventsResponse> {
    const response = await apiClient.get(
      `/api/dashboard/events/area/${areaId}`
    );

    return response.data;
  }

  static async getDashboardStatus(): Promise<DashboardStatus> {
    const response = await apiClient.get("/api/dashboard/status");

    return response.data;
  }
}

export default DashboardService;
