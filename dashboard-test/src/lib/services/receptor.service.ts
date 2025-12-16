import type { Receptor, ReceptorsResponse } from "@/types/alertRule";

import apiClient from "../api";

class ReceptorService {
  private readonly baseUrl = "/receptors";

  async getAll(): Promise<Receptor[]> {
    const response = await apiClient.get<ReceptorsResponse>(this.baseUrl);

    return response.data.data;
  }

  async getClockReceptors(): Promise<Receptor[]> {
    const response = await apiClient.get<ReceptorsResponse>(
      `${this.baseUrl}/clock`
    );

    return response.data.data;
  }

  async getByDepartment(department: string): Promise<Receptor[]> {
    const response = await apiClient.get<ReceptorsResponse>(
      `${this.baseUrl}?department=${department}`
    );

    return response.data.data;
  }
}

const receptorService = new ReceptorService();

export default receptorService;
