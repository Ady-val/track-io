import type React from "react";

import { Sidebar } from "@/components/molecules";

export interface DashboardTemplateProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`bg-slate-900 h-screen flex overflow-hidden ${className}`}>
      <Sidebar />
      <div className="flex-grow ml-16 overflow-auto">
        <div className="max-w-6xl mx-auto space-y-8 p-6 pb-20">{children}</div>
      </div>
    </div>
  );
};
