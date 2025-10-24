import type { IconType } from "react-icons";

import React from "react";

import { Text } from "@components/atoms";

export interface EmptyStateProps {
  icon: IconType;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center">
      <div className="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        {React.createElement(icon, { className: "text-slate-400 w-8 h-8" })}
      </div>
      <Text className="mb-2" variant="h4">
        {title}
      </Text>
      {description && (
        <Text color="muted" variant="body">
          {description}
        </Text>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
