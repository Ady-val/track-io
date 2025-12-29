import { AxiosError, type AxiosResponse } from "axios";

import { createMockAlertRule } from "@/test-utils/mock-data";
import type {
  AlertRuleResponse,
  AlertRuleSingleResponse,
} from "@/types/alertRule";

import apiClient from "../../api";
import alertRuleService from "../alertRule.service";

// Mock del apiClient
jest.mock("../../api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe("AlertRuleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAll", () => {
    it("should fetch all alert rules without filters", async () => {
      const mockAlertRules = [createMockAlertRule()];
      const mockResponse: AlertRuleResponse = {
        message: "Alert rules retrieved",
        data: mockAlertRules,
        total: mockAlertRules.length,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleResponse>);

      const result = await alertRuleService.getAll();

      expect(mockApiClient.get).toHaveBeenCalledWith("/alert-rules");
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockAlertRules[0]);
    });

    it("should fetch alert rules with measurementId filter", async () => {
      const mockAlertRules = [createMockAlertRule({ measurementId: 5 })];
      const mockResponse: AlertRuleResponse = {
        message: "Alert rules retrieved",
        data: mockAlertRules,
        total: mockAlertRules.length,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleResponse>);

      const result = await alertRuleService.getAll({ measurementId: 5 });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/alert-rules?measurementId=5"
      );
      expect(result[0]?.measurementId).toBe(5);
    });

    it("should fetch alert rules with isEnabled filter", async () => {
      const mockAlertRules = [createMockAlertRule({ isEnabled: true })];
      const mockResponse: AlertRuleResponse = {
        message: "Alert rules retrieved",
        data: mockAlertRules,
        total: mockAlertRules.length,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleResponse>);

      const result = await alertRuleService.getAll({ isEnabled: true });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/alert-rules?isEnabled=true"
      );
      expect(result[0]?.isEnabled).toBe(true);
    });

    it("should fetch alert rules with mode filter", async () => {
      const mockAlertRules = [createMockAlertRule({ mode: "window" })];
      const mockResponse: AlertRuleResponse = {
        message: "Alert rules retrieved",
        data: mockAlertRules,
        total: mockAlertRules.length,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleResponse>);

      const result = await alertRuleService.getAll({ mode: "window" });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        "/alert-rules?mode=window"
      );
      expect(result[0]?.mode).toBe("window");
    });

    it("should handle errors when fetching alert rules", async () => {
      const error = new Error("Network error");

      mockApiClient.get.mockRejectedValue(error);

      await expect(alertRuleService.getAll()).rejects.toThrow("Network error");
    });
  });

  describe("getById", () => {
    it("should fetch alert rule by id", async () => {
      const mockAlertRule = createMockAlertRule({ id: "rule-123" });
      const mockResponse: AlertRuleSingleResponse = {
        message: "Alert rule found",
        data: mockAlertRule,
      };

      mockApiClient.get.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleSingleResponse>);

      const result = await alertRuleService.getById("rule-123");

      expect(mockApiClient.get).toHaveBeenCalledWith("/alert-rules/rule-123");
      expect(result).toEqual(mockAlertRule);
      expect(result.id).toBe("rule-123");
    });

    it("should handle error when alert rule not found", async () => {
      const error = new AxiosError("Alert rule not found");
      error.response = {
        status: 404,
        data: { message: "Alert rule not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.get.mockRejectedValue(error);

      await expect(alertRuleService.getById("non-existent")).rejects.toThrow(
        "Alert rule not found"
      );
    });
  });

  describe("create", () => {
    it("should create a new alert rule with setpoint mode", async () => {
      const newAlertRule = createMockAlertRule({
        id: "rule-new",
        name: "New Alert Rule",
        mode: "setpoint",
      });
      const mockResponse: AlertRuleSingleResponse = {
        message: "Alert rule created",
        data: newAlertRule,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleSingleResponse>);

      const result = await alertRuleService.create({
        name: "New Alert Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/alert-rules", {
        name: "New Alert Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
      });
      expect(result).toEqual(newAlertRule);
      expect(result.mode).toBe("setpoint");
    });

    it("should create a new alert rule with window mode", async () => {
      const newAlertRule = createMockAlertRule({
        id: "rule-window",
        name: "Window Alert Rule",
        mode: "window",
      });
      const mockResponse: AlertRuleSingleResponse = {
        message: "Alert rule created",
        data: newAlertRule,
      };

      mockApiClient.post.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleSingleResponse>);

      const result = await alertRuleService.create({
        name: "Window Alert Rule",
        measurementId: 1,
        mode: "window",
        minValue: 50,
        maxValue: 150,
      });

      expect(mockApiClient.post).toHaveBeenCalledWith("/alert-rules", {
        name: "Window Alert Rule",
        measurementId: 1,
        mode: "window",
        minValue: 50,
        maxValue: 150,
      });
      expect(result).toEqual(newAlertRule);
      expect(result.mode).toBe("window");
    });

    it("should handle errors when creating alert rule", async () => {
      const error = new AxiosError("Validation error");
      error.response = {
        status: 400,
        data: { message: "Validation error" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.post.mockRejectedValue(error);

      await expect(
        alertRuleService.create({
          name: "",
          measurementId: 1,
          mode: "setpoint",
          operator: ">",
          setpoint: 100,
        })
      ).rejects.toThrow("Validation error");
    });
  });

  describe("update", () => {
    it("should update alert rule", async () => {
      const updatedAlertRule = createMockAlertRule({
        id: "rule-123",
        name: "Updated Alert Rule",
        mode: "window",
      });
      const mockResponse: AlertRuleSingleResponse = {
        message: "Alert rule updated",
        data: updatedAlertRule,
      };

      mockApiClient.put.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleSingleResponse>);

      const result = await alertRuleService.update("rule-123", {
        name: "Updated Alert Rule",
        mode: "window",
        minValue: 50,
        maxValue: 150,
      });

      expect(mockApiClient.put).toHaveBeenCalledWith("/alert-rules/rule-123", {
        name: "Updated Alert Rule",
        mode: "window",
        minValue: 50,
        maxValue: 150,
      });
      expect(result.name).toBe("Updated Alert Rule");
      expect(result.mode).toBe("window");
    });

    it("should handle errors when updating alert rule", async () => {
      const error = new AxiosError("Alert rule not found");
      error.response = {
        status: 404,
        data: { message: "Alert rule not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.put.mockRejectedValue(error);

      await expect(
        alertRuleService.update("non-existent", {
          name: "Updated",
        })
      ).rejects.toThrow("Alert rule not found");
    });
  });

  describe("toggle", () => {
    it("should toggle alert rule enabled state", async () => {
      const toggledAlertRule = createMockAlertRule({
        id: "rule-123",
        isEnabled: false,
      });
      const mockResponse: AlertRuleSingleResponse = {
        message: "Alert rule toggled",
        data: toggledAlertRule,
      };

      mockApiClient.patch.mockResolvedValue({
        data: mockResponse,
      } as AxiosResponse<AlertRuleSingleResponse>);

      const result = await alertRuleService.toggle("rule-123");

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        "/alert-rules/rule-123/toggle"
      );
      expect(result.isEnabled).toBe(false);
    });

    it("should handle errors when toggling alert rule", async () => {
      const error = new AxiosError("Alert rule not found");
      error.response = {
        status: 404,
        data: { message: "Alert rule not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.patch.mockRejectedValue(error);

      await expect(alertRuleService.toggle("non-existent")).rejects.toThrow(
        "Alert rule not found"
      );
    });
  });

  describe("delete", () => {
    it("should delete alert rule", async () => {
      mockApiClient.delete.mockResolvedValue({
        data: {},
      } as AxiosResponse<{ message?: string }>);

      await alertRuleService.delete("rule-123");

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        "/alert-rules/rule-123"
      );
    });

    it("should handle errors when deleting alert rule", async () => {
      const error = new AxiosError("Alert rule not found");
      error.response = {
        status: 404,
        data: { message: "Alert rule not found" },
      } as AxiosResponse<{ message: string }>;

      mockApiClient.delete.mockRejectedValue(error);

      await expect(alertRuleService.delete("non-existent")).rejects.toThrow(
        "Alert rule not found"
      );
    });
  });
});
