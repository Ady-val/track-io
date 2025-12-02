import type React from "react";

import { Navigate } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

interface PublicRouteProps {
  children: React.ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate replace to="/dashboard/industrial" />;
  }

  return children;
}
