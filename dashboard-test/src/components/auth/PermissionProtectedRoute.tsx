import type React from "react";

import { Navigate, useLocation } from "react-router-dom";

import { type Module, type Action } from "@/constants/permissions";
import { type ModuleType } from "@/contexts/PermissionsContext";
import { useActiveModule } from "@/hooks/useActiveModule";
import { useHasPermission } from "@/hooks/useHasPermission";

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  module: Module | string;
  action: Action | string;
  moduleType?: ModuleType;
  fallbackPath?: string;
}

export function PermissionProtectedRoute({
  children,
  module,
  action,
  moduleType,
  fallbackPath = "/dashboard",
}: PermissionProtectedRouteProps) {
  const hasPermission = useHasPermission(module, action);
  const activeModule = useActiveModule(moduleType);
  const location = useLocation();

  if (!hasPermission || !activeModule) {
    return <Navigate replace state={{ from: location }} to={fallbackPath} />;
  }

  return children;
}
