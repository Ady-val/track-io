import type {
  EscalationConfig,
  EscalationMessage,
  Torreta,
  Receptor,
  TorretaColor,
  Email,
} from "../../types/escalation";

import apiClient from "../api";

export class EscalationService {
  static async getEscalationConfig(
    deviceId: number,
    deviceSignalId: number
  ): Promise<EscalationConfig | null> {
    try {
      const response = await apiClient.get<EscalationConfig>(
        `/alert-escalation-configs/device/${deviceId}/signal/${deviceSignalId}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching escalation config:", error);

      return null;
    }
  }

  static async getEscalationMessages(
    deviceId: number,
    deviceSignalId: number
  ): Promise<EscalationMessage[]> {
    try {
      const response = await apiClient.get<EscalationMessage[]>(
        `/alert-escalation-messages/device/${deviceId}/signal/${deviceSignalId}`
      );

      return response.data;
    } catch (error) {
      console.error("Error fetching escalation messages:", error);

      return [];
    }
  }

  static async saveEscalationConfig(
    config: EscalationConfig,
    messages?: EscalationMessage[]
  ): Promise<EscalationConfig | null> {
    try {
      const payload = {
        deviceId: config.deviceId,
        deviceSignalId: config.deviceSignalId,
        warningDelayMinutes: config.warningDelayMinutes,
        escalation1DelayMinutes: config.escalation1DelayMinutes,
        escalation2DelayMinutes: config.escalation2DelayMinutes,
        escalation3DelayMinutes: config.escalation3DelayMinutes,
        isActive: config.isActive,
        messages: messages
          ? messages.map((msg) => ({
              level: msg.level,
              messageType: msg.messageType,
              targetId: msg.targetId,
              message: msg.message,
              deviceColorId: msg.color,
            }))
          : [],
      };

      const response = await apiClient.post<EscalationConfig>(
        "/alert-escalation-configs/save",
        payload
      );

      return response.data;
    } catch (error) {
      console.error("Error saving escalation config:", error);

      return null;
    }
  }

  static async createEscalationMessage(
    message: EscalationMessage
  ): Promise<EscalationMessage | null> {
    try {
      const response = await apiClient.post<EscalationMessage>(
        "/alert-escalation-messages",
        message
      );

      return response.data;
    } catch (error) {
      console.error("Error creating escalation message:", error);

      return null;
    }
  }

  static async updateEscalationMessage(
    id: number,
    message: EscalationMessage
  ): Promise<EscalationMessage | null> {
    try {
      const response = await apiClient.put<EscalationMessage>(
        `/alert-escalation-messages/${id}`,
        message
      );

      return response.data;
    } catch (error) {
      console.error("Error updating escalation message:", error);

      return null;
    }
  }

  static async deleteEscalationMessage(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/alert-escalation-messages/${id}`);

      return true;
    } catch (error) {
      console.error("Error deleting escalation message:", error);

      return false;
    }
  }

  static async getTorretas(): Promise<Torreta[]> {
    try {
      const response = await apiClient.get<{
        message: string;
        data: Torreta[];
      }>("/torretas");

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching torretas:", error);

      return [];
    }
  }

  static async getReceptors(): Promise<Receptor[]> {
    try {
      const response = await apiClient.get<{
        message: string;
        data: Receptor[];
      }>("/receptors");

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching receptors:", error);

      return [];
    }
  }

  static async getTorretaColors(): Promise<TorretaColor[]> {
    try {
      const response = await apiClient.get<{
        message: string;
        data: TorretaColor[];
      }>("/torreta-colors");

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching torreta colors:", error);

      return [];
    }
  }

  static async getEmails(): Promise<Email[]> {
    try {
      const response = await apiClient.get<{ message: string; data: Email[] }>(
        "/emails"
      );

      return response.data.data || [];
    } catch (error) {
      console.error("Error fetching emails:", error);

      return [];
    }
  }
}
