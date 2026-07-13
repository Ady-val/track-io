import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

import AuthService from "@/lib/services/auth.service";

export interface User {
  id: number;
  name: string;
  username: string;
}

interface Permission {
  id: number;
  module: string;
  action: string;
  description?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  permissions: Permission[];
  hasVirtualDeviceAccess: boolean;
  login: (token: string, user: User) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const TOKEN_KEY = "vd_token";
export const USER_KEY = "vd_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = () => {
    setToken(null);
    setUser(null);
    setPermissions([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedToken || !storedUser) {
      setIsLoading(false);
      return;
    }

    try {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } catch (_error) {
      clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncPermissions = async () => {
      if (!token) {
        setPermissions([]);
        return;
      }

      try {
        const me = await AuthService.me();
        setPermissions(me.data.permissions ?? []);
      } catch (_error) {
        clearSession();
      }
    };

    void syncPermissions();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      if (token) {
        await AuthService.logout();
      }
    } catch (_error) {
      // Ignore logout network issues and clear local session anyway
    } finally {
      clearSession();
    }
  };

  const hasVirtualDeviceAccess = useMemo(
    () =>
      permissions.some((permission) => permission.module === "virtual-device"),
    [permissions],
  );

  const value: AuthContextType = {
    user,
    token,
    permissions,
    hasVirtualDeviceAccess,
    login,
    logout,
    isAuthenticated: !!token,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
