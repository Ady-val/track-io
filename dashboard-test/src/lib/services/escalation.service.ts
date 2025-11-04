import type {
  EscalationConfig,
  EscalationMessage,
  Torreta,
  Receptor,
  TorretaColor,
  Email,
} from "../../types/escalation";

const API_BASE_URL = "http://localhost:3000";

export class EscalationService {
  static async getEscalationConfig(
    deviceId: number,
    deviceSignalId: number
  ): Promise<EscalationConfig | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/alert-escalation-configs/device/${deviceId}/signal/${deviceSignalId}`
      );

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          return data;
        } else {
          return null;
        }
      }
      return null;
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
      const response = await fetch(
        `${API_BASE_URL}/alert-escalation-messages/device/${deviceId}/signal/${deviceSignalId}`
      );
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return await response.json();
        }
      }
      return [];
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
      const url = `${API_BASE_URL}/alert-escalation-configs/save`;

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

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        return null;
      }
    } catch (error) {
      console.error("Error saving escalation config:", error);
      return null;
    }
  }

  static async createEscalationMessage(
    message: EscalationMessage
  ): Promise<EscalationMessage | null> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/alert-escalation-messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
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
      const response = await fetch(
        `${API_BASE_URL}/alert-escalation-messages/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(message),
        }
      );

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error("Error updating escalation message:", error);
      return null;
    }
  }

  static async deleteEscalationMessage(id: number): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/alert-escalation-messages/${id}`,
        {
          method: "DELETE",
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Error deleting escalation message:", error);
      return false;
    }
  }

  static async getTorretas(): Promise<Torreta[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/torretas`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          return result.data || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching torretas:", error);
      return [];
    }
  }

  static async getReceptors(): Promise<Receptor[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/receptors`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          return result.data || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching receptors:", error);
      return [];
    }
  }

  static async getTorretaColors(): Promise<TorretaColor[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/torreta-colors`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          return result.data || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching torreta colors:", error);
      return [];
    }
  }

  static async getEmails(): Promise<Email[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/emails`);
      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const result = await response.json();
          return result.data || [];
        }
      }
      return [];
    } catch (error) {
      console.error("Error fetching emails:", error);
      return [];
    }
  }
}
