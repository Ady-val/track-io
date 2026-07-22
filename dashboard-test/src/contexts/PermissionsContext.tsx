import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import apiClient from "../lib/api";

import { useAuth } from "./AuthContext";

export enum ModuleType {
  SIGNALS = "signals",
  MEASUREMENTS = "measurements",
  INSIGHTS = "insights",
}

export interface UserModulesType {
  [ModuleType.SIGNALS]: boolean;
  [ModuleType.MEASUREMENTS]: boolean;
  [ModuleType.INSIGHTS]: boolean;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  description?: string;
}

export interface UserPermissions {
  user: {
    id: number;
    name: string;
    username: string;
  };
  permissions: Permission[];
  modules: {
    signals: boolean;
    measurements: boolean;
    insights: boolean;
  };
}

interface PermissionsContextType {
  permissions: Permission[];
  user: UserPermissions["user"] | null;
  modules: UserPermissions["modules"];
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
  hasModule: (module: ModuleType) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(
  undefined
);

export function PermissionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, isAuthenticated } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [user, setUser] = useState<UserPermissions["user"] | null>(null);
  const [modules, setModules] = useState<UserModulesType>({
    [ModuleType.SIGNALS]: false,
    [ModuleType.MEASUREMENTS]: false,
    [ModuleType.INSIGHTS]: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    if (!token || !isAuthenticated) {
      setPermissions([]);
      setUser(null);
      setIsLoading(false);

      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const { data: response } = await apiClient.get<{
        message: string;
        data: UserPermissions;
      }>("/auth/me");
      const { user, permissions, modules } = response.data;

      setPermissions(permissions);
      setUser(user);
      setModules({
        [ModuleType.SIGNALS]: modules.signals,
        [ModuleType.MEASUREMENTS]: modules.measurements,
        [ModuleType.INSIGHTS]: modules.insights,
      });
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error).message ||
        "Error al cargar permisos";

      setError(errorMessage);
      setPermissions([]);
      setUser(null);
      setModules({
        [ModuleType.SIGNALS]: false,
        [ModuleType.MEASUREMENTS]: false,
        [ModuleType.INSIGHTS]: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (module: string, action: string): boolean => {
      if (!permissions || permissions.length === 0) {
        return false;
      }

      return permissions.some(
        (perm) => perm.module === module && perm.action === action
      );
    },
    [permissions]
  );

  const hasModule = useCallback(
    (module: ModuleType): boolean => {
      return modules[module];
    },
    [modules]
  );

  const value: PermissionsContextType = {
    permissions,
    user,
    modules,
    isLoading,
    error,
    refreshPermissions: fetchPermissions,
    hasPermission,
    hasModule,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);

  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionsProvider");
  }

  return context;
}
