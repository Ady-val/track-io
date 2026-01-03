import type { AlertMessage } from "@/types/alertRule";

import apiClient from "../api";

interface CreateAlertMessageData {
  messageType: "torreta" | "receptor" | "email";
  targetId: string;
  message: string;
  color?: string;
  messageGroupId: number;
  status?: string;
}

interface UpdateAlertMessageData {
  messageType?: "torreta" | "receptor" | "email";
  targetId?: string;
  message?: string;
  color?: string;
  messageGroupId?: number;
  status?: string;
}

interface AlertMessageResponse {
  message: string;
  data: AlertMessage;
}

class AlertMessageService {
  async create(
    alertRuleId: string,
    data: CreateAlertMessageData
  ): Promise<AlertMessage> {
    const response = await apiClient.post<AlertMessageResponse>(
      `/alert-rules/${alertRuleId}/messages`,
      data
    );

    return response.data.data;
  }

  async update(
    _alertRuleId: string,
    messageId: number,
    data: UpdateAlertMessageData
  ): Promise<AlertMessage> {
    const response = await apiClient.put<AlertMessageResponse>(
      `/messages/${messageId}`,
      data
    );

    return response.data.data;
  }

  async delete(messageId: number): Promise<void> {
    await apiClient.delete(`/messages/${messageId}`);
  }

  async duplicate(
    _alertRuleId: string,
    messageId: number
  ): Promise<AlertMessage> {
    const response = await apiClient.post<AlertMessageResponse>(
      `/messages/${messageId}/duplicate`
    );

    return response.data.data;
  }
}

const alertMessageService = new AlertMessageService();

export default alertMessageService;
