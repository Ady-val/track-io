import React from "react";
import {
  FaDatabase,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { Button, Text } from "@components/atoms";

interface DataEmptyStateProps {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  action?: {
    label: string;
    onClick: () => void;
    variant?: "primary" | "secondary" | "flat";
  };
  type?: "empty" | "error" | "info";
}

export const DataEmptyState: React.FC<DataEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  type = "empty",
}) => {
  const getIcon = () => {
    if (icon) {
      const IconComponent = icon;
      return <IconComponent className="w-16 h-16 mx-auto mb-4 text-gray-400" />;
    }

    switch (type) {
      case "error":
        return (
          <FaExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        );
      case "info":
        return (
          <FaInfoCircle className="w-16 h-16 mx-auto mb-4 text-blue-400" />
        );
      default:
        return <FaDatabase className="w-16 h-16 mx-auto mb-4 text-gray-400" />;
    }
  };

  const getTextColor = () => {
    switch (type) {
      case "error":
        return "text-red-400";
      case "info":
        return "text-blue-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {getIcon()}
      <Text variant="h3" className={`mb-2 ${getTextColor()}`}>
        {title}
      </Text>
      <Text variant="body" className="mb-6 max-w-md" color="muted">
        {description}
      </Text>
      {action && (
        <Button variant={action.variant || "primary"} onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
};

