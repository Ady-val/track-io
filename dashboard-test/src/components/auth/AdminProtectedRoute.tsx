import type React from "react";

import { Navigate, useLocation } from "react-router-dom";

import { ADMIN_USERNAME } from "@/constants/permissions";
import { useAuth } from "@/contexts/AuthContext";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

export function AdminProtectedRoute({
  children,
  fallbackPath = "/dashboard/industrial",
}: AdminProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  const isAdmin = user?.username === ADMIN_USERNAME;

  if (!isAdmin) {
    return <Navigate replace state={{ from: location }} to={fallbackPath} />;
  }

  return children;
}
