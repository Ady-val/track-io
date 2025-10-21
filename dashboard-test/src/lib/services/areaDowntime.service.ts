import apiClient from "../api";
import type {
  AreaDowntimesResponse,
  AreaDowntimeFilters,
} from "@/types/areaDowntime";

class AreaDowntimeService {
  private readonly baseUrl = "/area-downtime";

  async getAll(filters?: AreaDowntimeFilters): Promise<AreaDowntimesResponse> {
    const params = new URLSearchParams();

    if (filters?.areaId) params.append("areaId", filters.areaId.toString());
    if (filters?.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.limit) params.append("limit", filters.limit.toString());
    if (filters?.offset) params.append("offset", filters.offset.toString());

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<AreaDowntimesResponse>(url);
    return response.data;
  }

  async getDowntimeEvents(downtimeId: number) {
    const response = await apiClient.get(
      `${this.baseUrl}/${downtimeId}/events`
    );
    return response.data;
  }
}

const areaDowntimeService = new AreaDowntimeService();
export default areaDowntimeService;

