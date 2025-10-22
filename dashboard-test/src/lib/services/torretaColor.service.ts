import apiClient from "../api";
import type { TorretaColor, TorretaColorsResponse } from "@/types/alertRule";

class TorretaColorService {
  private readonly baseUrl = "/torreta-colors";

  async getAll(): Promise<TorretaColor[]> {
    const response = await apiClient.get<TorretaColorsResponse>(this.baseUrl);
    return response.data.data;
  }

  async getById(id: number): Promise<TorretaColor> {
    const response = await apiClient.get<{
      message: string;
      data: TorretaColor;
    }>(`${this.baseUrl}/${id}`);
    return response.data.data;
  }
}

const torretaColorService = new TorretaColorService();
export default torretaColorService;
