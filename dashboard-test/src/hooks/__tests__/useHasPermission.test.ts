import React from "react";
import type { ReactNode } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";

import { type Action, type Module } from "@/constants/permissions";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

import { useHasPermission } from "../useHasPermission";

// Mock del contexto de permisos
const mockHasPermission = jest.fn();

jest.mock("@/contexts/PermissionsContext", () => {
  const actual = jest.requireActual("@/contexts/PermissionsContext");

  return {
    ...actual,
    usePermissions: () => ({
      hasPermission: mockHasPermission,
      permissions: [],
      isLoading: false,
      error: null,
    }),
  };
});

// Mock de AuthContext
jest.mock("@/contexts/AuthContext", () => {
  const actual = jest.requireActual("@/contexts/AuthContext");

  return {
    ...actual,
    useAuth: () => ({
      token: "mock-token",
      isAuthenticated: true,
      user: { id: 1, name: "Test User", username: "testuser" },
    }),
  };
});

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const TestWrapper = ({ children }: { children: ReactNode }) => {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(
        AuthProvider,
        null,
        React.createElement(PermissionsProvider, null, children)
      )
    );
  };

  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
};

describe("useHasPermission", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when user has permission", () => {
    mockHasPermission.mockReturnValue(true);

    const { result } = renderHook(() => useHasPermission("devices", "read"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith("devices", "read");
  });

  it("should return false when user does not have permission", () => {
    mockHasPermission.mockReturnValue(false);

    const { result } = renderHook(() => useHasPermission("devices", "write"), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBe(false);
    expect(mockHasPermission).toHaveBeenCalledWith("devices", "write");
  });

  it("should work with different modules", () => {
    mockHasPermission.mockReturnValue(true);

    const { result: result1 } = renderHook(
      () => useHasPermission("devices", "read"),
      { wrapper: createWrapper() }
    );

    const { result: result2 } = renderHook(
      () => useHasPermission("alertRules", "read"),
      { wrapper: createWrapper() }
    );

    expect(result1.current).toBe(true);
    expect(result2.current).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith("devices", "read");
    expect(mockHasPermission).toHaveBeenCalledWith("alertRules", "read");
  });

  it("should work with different actions", () => {
    mockHasPermission
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    const { result: result1 } = renderHook(
      () => useHasPermission("devices", "read"),
      { wrapper: createWrapper() }
    );

    const { result: result2 } = renderHook(
      () => useHasPermission("devices", "write"),
      { wrapper: createWrapper() }
    );

    const { result: result3 } = renderHook(
      () => useHasPermission("devices", "delete"),
      { wrapper: createWrapper() }
    );

    expect(result1.current).toBe(true);
    expect(result2.current).toBe(false);
    expect(result3.current).toBe(true);
  });

  it("should handle string module and action types", () => {
    mockHasPermission.mockReturnValue(true);

    const { result } = renderHook(
      () =>
        useHasPermission(
          "custom-module" as Module | string,
          "custom-action" as Action | string
        ),
      { wrapper: createWrapper() }
    );

    expect(result.current).toBe(true);
    expect(mockHasPermission).toHaveBeenCalledWith(
      "custom-module",
      "custom-action"
    );
  });
});
