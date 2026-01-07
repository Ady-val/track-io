import React from "react";

import { Outlet } from "react-router-dom";

import { usePermissions } from "@/contexts/PermissionsContext";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { useLayoutConfig } from "@/hooks/useLayoutConfig";

import Sidebar from "../molecules/Sidebar";
import { Spinner } from "../atoms";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  compactPadding?: boolean;
}

export function DashboardLayout({
  children,
  compactPadding,
}: DashboardLayoutProps) {
  const { isLoading } = usePermissions();
  const { compactPadding: autoCompactPadding } = useLayoutConfig();
  const shouldUseCompactPadding = compactPadding ?? autoCompactPadding;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-900">
        <Spinner color="primary" size="lg" />
      </div>
    );
  }

  return (
    <WebSocketProvider>
      <div className="flex h-full bg-slate-900">
        <Sidebar />
        <main className="h-full w-full overflow-hidden">
          <div
            className={`h-full ${
              shouldUseCompactPadding ? "px-6 py-4" : "max-w-6xl mx-auto p-6"
            }`}
          >
            {children ?? <Outlet />}
          </div>
        </main>
      </div>
    </WebSocketProvider>
  );
}
