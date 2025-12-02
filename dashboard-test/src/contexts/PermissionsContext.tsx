import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import apiClient from "../lib/api";

import { useAuth } from "./AuthContext";

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
}

interface PermissionsContextType {
  permissions: Permission[];
  user: UserPermissions["user"] | null;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
  hasPermission: (module: string, action: string) => boolean;
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
      const response = await apiClient.get<{
        message: string;
        data: UserPermissions;
      }>("/auth/me");

      const permissionsData = response.data.data.permissions || [];

      setPermissions(permissionsData);
      setUser(response.data.data.user);
    } catch (err) {
      const errorMessage =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err as Error).message ||
        "Error al cargar permisos";

      setError(errorMessage);
      setPermissions([]);
      setUser(null);
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

  const value: PermissionsContextType = {
    permissions,
    user,
    isLoading,
    error,
    refreshPermissions: fetchPermissions,
    hasPermission,
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
