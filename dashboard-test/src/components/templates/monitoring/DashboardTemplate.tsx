import type React from "react";

export interface DashboardTemplateProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardTemplate: React.FC<DashboardTemplateProps> = ({
  children,
  className = "",
}) => {
  return (
    <div className={`bg-slate-900 p-6 min-h-screen ${className}`}>
      <div className="max-w-6xl mx-auto space-y-8 pb-20">{children}</div>
    </div>
  );
};
