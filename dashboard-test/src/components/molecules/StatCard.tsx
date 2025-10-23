import type { IconType } from "react-icons";

import React from "react";

import { Card, CardBody, Text } from "@components/atoms";

export interface StatCardProps {
  icon: IconType;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value: string | number;
  valueClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconColor = "text-blue-400",
  iconBgColor = "bg-blue-500/20",
  label,
  value,
  valueClassName = "",
}) => {
  return (
    <Card>
      <CardBody className="p-2">
        <div className="flex items-center gap-2">
          <div className={`${iconBgColor} p-1.5 rounded`}>
            {React.createElement(icon, { className: iconColor, size: 16 })}
          </div>
          <div className="min-w-0 flex-1">
            <Text color="muted" variant="small">
              {label}
            </Text>
            <Text
              className={`font-semibold truncate ${valueClassName}`}
              variant="caption"
            >
              {value}
            </Text>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
