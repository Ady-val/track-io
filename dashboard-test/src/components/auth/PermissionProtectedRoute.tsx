import type React from "react";

import { Navigate, useLocation } from "react-router-dom";

import { type Module, type Action } from "@/constants/permissions";
import { useHasPermission } from "@/hooks/useHasPermission";

interface PermissionProtectedRouteProps {
  children: React.ReactNode;
  module: Module | string;
  action: Action | string;
  fallbackPath?: string;
}

export function PermissionProtectedRoute({
  children,
  module,
  action,
  fallbackPath = "/dashboard/industrial",
}: PermissionProtectedRouteProps) {
  const hasPermission = useHasPermission(module, action);
  const location = useLocation();

  if (!hasPermission) {
    return <Navigate replace state={{ from: location }} to={fallbackPath} />;
  }

  return children;
}
