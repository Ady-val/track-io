import React from "react";

import { DashboardLayout } from "./DashboardLayout";

interface IndustrialDashboardLayoutProps {
  children: React.ReactNode;
}

export function IndustrialDashboardLayout({
  children,
}: IndustrialDashboardLayoutProps) {
  return <DashboardLayout compactPadding>{children}</DashboardLayout>;
}
