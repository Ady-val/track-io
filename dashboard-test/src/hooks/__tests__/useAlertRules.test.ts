import React from "react";
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { waitFor, renderHook } from "@testing-library/react";

import alertRuleService from "@/lib/services/alertRule.service";
import { createMockAlertRule } from "@/test-utils/mock-data";
import { renderHookWithQuery } from "@/test-utils/render-hook-with-query";

import {
  useAlertRules,
  useAlertRule,
  useCreateAlertRule,
  useUpdateAlertRule,
  useToggleAlertRule,
  useDeleteAlertRule,
} from "../useAlertRules";

// Mock del servicio
jest.mock("@/lib/services/alertRule.service", () => ({
  __esModule: true,
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    toggle: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockAlertRuleService = alertRuleService as jest.Mocked<
  typeof alertRuleService
>;

describe("useAlertRules hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useAlertRules", () => {
    it("should fetch alert rules successfully", async () => {
      const mockAlertRules = [createMockAlertRule()];

      mockAlertRuleService.getAll.mockResolvedValue(mockAlertRules);

      const { result } = renderHookWithQuery(() => useAlertRules());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockAlertRules);
      expect(result.current.data).toHaveLength(1);
    });

    it("should fetch alert rules with filters", async () => {
      const mockAlertRules = [createMockAlertRule({ isEnabled: true })];

      mockAlertRuleService.getAll.mockResolvedValue(mockAlertRules);

      const filters = { isEnabled: true };

      const { result } = renderHookWithQuery(() => useAlertRules(filters));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.getAll).toHaveBeenCalledWith(filters);
      expect(result.current.data?.[0]?.isEnabled).toBe(true);
    });

    it("should handle errors when fetching alert rules", async () => {
      const error = new Error("Network error");

      mockAlertRuleService.getAll.mockRejectedValue(error);

      const { result } = renderHookWithQuery(() => useAlertRules());

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useAlertRule", () => {
    it("should fetch single alert rule by id", async () => {
      const mockAlertRule = createMockAlertRule({ id: "rule-123" });

      mockAlertRuleService.getById.mockResolvedValue(mockAlertRule);

      const { result } = renderHookWithQuery(() => useAlertRule("rule-123"));

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.getById).toHaveBeenCalledWith("rule-123");
      expect(result.current.data).toEqual(mockAlertRule);
    });

    it("should not fetch when id is empty", () => {
      const { result } = renderHookWithQuery(() => useAlertRule(""));

      expect(result.current.isFetching).toBe(false);
      expect(mockAlertRuleService.getById).not.toHaveBeenCalled();
    });
  });

  describe("useCreateAlertRule", () => {
    it("should create alert rule successfully", async () => {
      const newAlertRule = createMockAlertRule({ id: "rule-new" });

      mockAlertRuleService.create.mockResolvedValue(newAlertRule);

      const { result } = renderHookWithQuery(() => useCreateAlertRule());

      const createData = {
        name: "New Alert Rule",
        measurementId: 1,
        mode: "setpoint" as const,
        operator: ">",
        setpoint: 100,
      };

      result.current.mutate(createData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.create).toHaveBeenCalledWith(createData);
      expect(result.current.data).toEqual(newAlertRule);
    });

    it("should invalidate alertRules query on success", async () => {
      const newAlertRule = createMockAlertRule();

      mockAlertRuleService.create.mockResolvedValue(newAlertRule);

      // Crear un QueryClient para verificar invalidaciones
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(() => useCreateAlertRule(), { wrapper });

      result.current.mutate({
        name: "New Rule",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verificar que se invalidó la query de alertRules
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRules"],
      });
    });

    it("should handle errors when creating alert rule", async () => {
      const error = new Error("Validation error");

      mockAlertRuleService.create.mockRejectedValue(error);

      const { result } = renderHookWithQuery(() => useCreateAlertRule());

      result.current.mutate({
        name: "",
        measurementId: 1,
        mode: "setpoint",
        operator: ">",
        setpoint: 100,
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeDefined();
    });
  });

  describe("useUpdateAlertRule", () => {
    it("should update alert rule successfully", async () => {
      const updatedAlertRule = createMockAlertRule({
        id: "rule-123",
        name: "Updated Rule",
      });

      mockAlertRuleService.update.mockResolvedValue(updatedAlertRule);

      const { result } = renderHookWithQuery(() => useUpdateAlertRule());

      const updateData = {
        id: "rule-123",
        data: { name: "Updated Rule" },
      };

      result.current.mutate(updateData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.update).toHaveBeenCalledWith("rule-123", {
        name: "Updated Rule",
      });
      expect(result.current.data).toEqual(updatedAlertRule);
    });

    it("should invalidate queries on success", async () => {
      const updatedAlertRule = createMockAlertRule({ id: "rule-123" });

      mockAlertRuleService.update.mockResolvedValue(updatedAlertRule);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(() => useUpdateAlertRule(), { wrapper });

      result.current.mutate({
        id: "rule-123",
        data: { name: "Updated" },
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Debe invalidar tanto alertRules como alertRule específico
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRules"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRule", "rule-123"],
      });
    });
  });

  describe("useToggleAlertRule", () => {
    it("should toggle alert rule successfully", async () => {
      const toggledAlertRule = createMockAlertRule({
        id: "rule-123",
        isEnabled: false,
      });

      mockAlertRuleService.toggle.mockResolvedValue(toggledAlertRule);

      const { result } = renderHookWithQuery(() => useToggleAlertRule());

      result.current.mutate("rule-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.toggle).toHaveBeenCalledWith("rule-123");
      expect(result.current.data?.isEnabled).toBe(false);
    });

    it("should invalidate queries on success", async () => {
      const toggledAlertRule = createMockAlertRule({ id: "rule-123" });

      mockAlertRuleService.toggle.mockResolvedValue(toggledAlertRule);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(() => useToggleAlertRule(), { wrapper });

      result.current.mutate("rule-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRules"],
      });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRule", "rule-123"],
      });
    });
  });

  describe("useDeleteAlertRule", () => {
    it("should delete alert rule successfully", async () => {
      mockAlertRuleService.delete.mockResolvedValue(undefined);

      const { result } = renderHookWithQuery(() => useDeleteAlertRule());

      result.current.mutate("rule-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockAlertRuleService.delete).toHaveBeenCalledWith("rule-123");
    });

    it("should invalidate alertRules query on success", async () => {
      mockAlertRuleService.delete.mockResolvedValue(undefined);

      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      const invalidateQueriesSpy = jest.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: ReactNode }) =>
        React.createElement(
          QueryClientProvider,
          { client: queryClient },
          children
        );

      const { result } = renderHook(() => useDeleteAlertRule(), { wrapper });

      result.current.mutate("rule-123");

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ["alertRules"],
      });
    });

    it("should handle errors when deleting alert rule", async () => {
      const error = new Error("Not found");

      mockAlertRuleService.delete.mockRejectedValue(error);

      const { result } = renderHookWithQuery(() => useDeleteAlertRule());

      result.current.mutate("non-existent");

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeDefined();
    });
  });
});
