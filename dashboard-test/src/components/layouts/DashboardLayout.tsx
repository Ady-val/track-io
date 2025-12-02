import React from "react";

import { Outlet } from "react-router-dom";

import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { useLayoutConfig } from "@/hooks/useLayoutConfig";

import Sidebar from "../molecules/Sidebar";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  compactPadding?: boolean;
}

export function DashboardLayout({
  children,
  compactPadding,
}: DashboardLayoutProps) {
  const { compactPadding: autoCompactPadding } = useLayoutConfig();
  const shouldUseCompactPadding = compactPadding ?? autoCompactPadding;

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
