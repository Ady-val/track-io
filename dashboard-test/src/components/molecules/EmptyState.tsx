import type React from "react";
import { Text, Icon } from "@components/atoms";
import type { IconType } from "react-icons";

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
    <div className="text-center py-12">
      <div className="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <Icon className="text-slate-400" icon={icon} size="xl" />
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
