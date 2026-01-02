import type React from "react";

import { renderHook } from "@testing-library/react";

import { ToastProvider } from "@/components/providers/ToastProvider";

import { useToast } from "../useToast";

// Mock de useNotifications
const mockShowSuccess = jest.fn();
const mockShowError = jest.fn();
const mockShowWarning = jest.fn();
const mockShowInfo = jest.fn();

jest.mock("../useNotifications", () => ({
  useNotifications: jest.fn(() => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
    showWarning: mockShowWarning,
    showInfo: mockShowInfo,
  })),
}));

describe("useToast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("with ToastProvider", () => {
    it("should have all toast methods defined", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>
          <div>{children}</div>
        </ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.success).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.warning).toBeDefined();
      expect(result.current.info).toBeDefined();
    });

    it("should call toast methods without errors", () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>
          <div>{children}</div>
        </ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      expect(() => {
        result.current.success("Test message");
        result.current.success("Test message", "Test title");
        result.current.error("Test message");
        result.current.warning("Test message");
        result.current.info("Test message");
      }).not.toThrow();
    });
  });

  describe("without ToastProvider (fallback to useNotifications)", () => {
    it("should use useNotifications as fallback when context is not available", () => {
      // Renderizar sin wrapper para que no haya ToastProvider
      const { result } = renderHook(() => useToast());

      expect(result.current).toBeDefined();
      expect(result.current.success).toBeDefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.warning).toBeDefined();
      expect(result.current.info).toBeDefined();
    });

    it("should call success method and use useNotifications", () => {
      const { result } = renderHook(() => useToast());

      result.current.success("Test message");

      expect(mockShowSuccess).toHaveBeenCalledWith("Éxito", "Test message");
    });

    it("should call error method and use useNotifications", () => {
      const { result } = renderHook(() => useToast());

      result.current.error("Test message");

      expect(mockShowError).toHaveBeenCalledWith("Error", "Test message");
    });

    it("should call warning method and use useNotifications", () => {
      const { result } = renderHook(() => useToast());

      result.current.warning("Test message");

      expect(mockShowWarning).toHaveBeenCalledWith("Advertencia", "Test message");
    });

    it("should call info method and use useNotifications", () => {
      const { result } = renderHook(() => useToast());

      result.current.info("Test message");

      expect(mockShowInfo).toHaveBeenCalledWith("Información", "Test message");
    });

    it("should use custom title when provided", () => {
      const { result } = renderHook(() => useToast());

      result.current.success("Test message", "Custom Title");

      expect(mockShowSuccess).toHaveBeenCalledWith("Custom Title", "Test message");
    });
  });
});

