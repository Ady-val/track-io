import type React from "react";

export interface TwoColumnLayoutProps {
  header?: React.ReactNode;
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  footer?: React.ReactNode;
  sidebarWidth?: "1/3" | "1/4" | "1/5";
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  header,
  sidebar,
  mainContent,
  footer,
  sidebarWidth = "1/3",
}) => {
  const sidebarColSpan =
    sidebarWidth === "1/4" ? "lg:col-span-1" : "lg:col-span-1";
  const mainColSpan =
    sidebarWidth === "1/4" ? "lg:col-span-3" : "lg:col-span-2";

  return (
    <div className="bg-slate-900 p-4 h-full flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-3">
        {header && <div className="flex-shrink-0">{header}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-grow overflow-hidden">
          <div className={`${sidebarColSpan} h-full overflow-hidden`}>
            {sidebar}
          </div>

          <div className={`${mainColSpan} h-full overflow-hidden`}>
            {mainContent}
          </div>
        </div>

        {footer && <div className="flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
