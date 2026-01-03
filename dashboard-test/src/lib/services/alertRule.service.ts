import type {
  AlertRule,
  AlertRuleResponse,
  AlertRuleSingleResponse,
  CreateAlertRuleData,
  UpdateAlertRuleData,
  AlertRuleFilters,
} from "@/types/alertRule";

import apiClient from "../api";

class AlertRuleService {
  private readonly baseUrl = "/alert-rules";

  async getAll(filters?: AlertRuleFilters): Promise<AlertRule[]> {
    const params = new URLSearchParams();

    if (filters?.measurementId)
      params.append("measurementId", filters.measurementId.toString());
    if (filters?.isEnabled !== undefined)
      params.append("isEnabled", filters.isEnabled.toString());
    if (filters?.mode) params.append("mode", filters.mode);

    const queryString = params.toString();
    const url = queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;

    const response = await apiClient.get<AlertRuleResponse>(url);

    return response.data.data;
  }

  async getById(id: string): Promise<AlertRule> {
    const response = await apiClient.get<AlertRuleSingleResponse>(
      `${this.baseUrl}/${id}`
    );

    const rule = response.data.data;
    
    // Normalize messages: ensure messageType is lowercase and map to mensajes for backward compatibility
    if (rule.messages) {
      rule.messages = rule.messages.map((msg: any) => ({
        ...msg,
        messageType: msg.messageType?.toLowerCase() || msg.messageType,
        alertRuleId: rule.id.toString(),
      }));
      if (!rule.mensajes) {
        rule.mensajes = rule.messages;
      }
    }
    
    return rule;
  }

  async create(data: CreateAlertRuleData): Promise<AlertRule> {
    const response = await apiClient.post<AlertRuleSingleResponse>(
      this.baseUrl,
      data
    );

    return response.data.data;
  }

  async update(id: string, data: UpdateAlertRuleData): Promise<AlertRule> {
    const response = await apiClient.put<AlertRuleSingleResponse>(
      `${this.baseUrl}/${id}`,
      data
    );

    return response.data.data;
  }

  async toggle(id: string): Promise<AlertRule> {
    const response = await apiClient.patch<AlertRuleSingleResponse>(
      `${this.baseUrl}/${id}/toggle`
    );

    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${this.baseUrl}/${id}`);
  }
}

const alertRuleService = new AlertRuleService();

export default alertRuleService;
