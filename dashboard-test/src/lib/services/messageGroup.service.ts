import apiClient from "../api";
import type { GrupoMensaje, MessageGroupsResponse } from "@/types/alertRule";

class MessageGroupService {
  private readonly baseUrl = "/message-groups";

  async getAll(): Promise<GrupoMensaje[]> {
    const response = await apiClient.get<MessageGroupsResponse>(this.baseUrl);
    return response.data.data;
  }

  async getById(id: number): Promise<GrupoMensaje> {
    const response = await apiClient.get<{
      message: string;
      data: GrupoMensaje;
    }>(`${this.baseUrl}/${id}`);
    return response.data.data;
  }
}

const messageGroupService = new MessageGroupService();
export default messageGroupService;

