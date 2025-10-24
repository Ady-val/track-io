import type React from "react";

export interface TwoColumnLayoutProps {
  header?: React.ReactNode;
  sidebar: React.ReactNode;
  mainContent: React.ReactNode;
  footer?: React.ReactNode;
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({
  header,
  sidebar,
  mainContent,
  footer,
}) => {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="w-full flex flex-col h-full gap-3 overflow-hidden">
        {header && <div className="flex-shrink-0">{header}</div>}

        <div className="flex w-full gap-4 flex-1 overflow-hidden min-h-0">
          <div className="w-[16rem] flex flex-col overflow-hidden">
            {sidebar}
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {mainContent}
          </div>
        </div>

        {footer && <div className="flex-shrink-0">{footer}</div>}
      </div>
    </div>
  );
};
