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
  return (
    <div className="bg-slate-900 p-4 h-full flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-3">
        {header && <div className="flex-shrink-0">{header}</div>}

        <div className="flex w-full gap-4 flex-grow overflow-hidden">
          <div className="w-[16rem] h-full overflow-hidden">{sidebar}</div>

          <div className="w-full h-full overflow-hidden">{mainContent}</div>
        </div>

        {footer && <div className="flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
