import type { ButtonProps } from "@components/atoms";

import type React from "react";

import { Card, CardBody, Text, Button } from "@components/atoms";

export interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  } & Partial<ButtonProps>;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  action,
}) => {
  return (
    <Card>
      <CardBody className="py-3 px-3">
        <div className="flex items-center justify-between">
          <div className="gap-1">
            <Text className="" variant="h3">
              {title}
            </Text>
            {description && (
              <Text color="muted" variant="body">
                {description}
              </Text>
            )}
          </div>
          {action && (
            <Button
              {...action}
              color={action.color ?? "primary"}
              size={action.size ?? "lg"}
              startContent={action.icon}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
