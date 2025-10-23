import type { AlertMessage } from "@/types/alertRule";

import apiClient from "../api";

interface CreateAlertMessageData {
  tipoReceptor: "reloj" | "correo" | "torreta";
  receptor: string;
  receptorNombre?: string;
  message: string;
  grupo: string;
  status: "warning" | "alert" | "critical";
}

interface UpdateAlertMessageData {
  tipoReceptor?: "reloj" | "correo" | "torreta";
  receptor?: string;
  receptorNombre?: string;
  message?: string;
  grupo?: string;
  status?: "warning" | "alert" | "critical";
}

interface AlertMessageResponse {
  message: string;
  data: AlertMessage;
}

class AlertMessageService {
  private readonly baseUrl = "/alert-messages";

  async create(
    alertRuleId: string,
    data: CreateAlertMessageData
  ): Promise<AlertMessage> {
    const response = await apiClient.post<AlertMessageResponse>(
      `${this.baseUrl}/rule/${alertRuleId}`,
      data
    );

    return response.data.data;
  }

  async update(
    alertRuleId: string,
    messageId: number,
    data: UpdateAlertMessageData
  ): Promise<AlertMessage> {
    const response = await apiClient.put<AlertMessageResponse>(
      `${this.baseUrl}/rule/${alertRuleId}/${messageId}`,
      data
    );

    return response.data.data;
  }

  async delete(alertRuleId: string, messageId: number): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/rule/${alertRuleId}/${messageId}`);
  }

  async duplicate(
    alertRuleId: string,
    messageId: number
  ): Promise<AlertMessage> {
    const response = await apiClient.post<AlertMessageResponse>(
      `${this.baseUrl}/rule/${alertRuleId}/${messageId}/duplicate`
    );

    return response.data.data;
  }
}

const alertMessageService = new AlertMessageService();

export default alertMessageService;
