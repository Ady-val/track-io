import type React from "react";

import {
  FaCircleInfo,
  FaTriangleExclamation,
  FaCircleExclamation,
} from "react-icons/fa6";

import type { InsightFinding, InsightSeverity } from "@/types/insights";

import { Chip, Text } from "../../atoms";

const SEVERITY_META: Record<
  InsightSeverity,
  {
    color: "default" | "warning" | "danger";
    icon: React.ReactNode;
    label: string;
  }
> = {
  info: {
    color: "default",
    icon: <FaCircleInfo className="text-sky-400" />,
    label: "Info",
  },
  warning: {
    color: "warning",
    icon: <FaTriangleExclamation className="text-amber-400" />,
    label: "Atención",
  },
  critical: {
    color: "danger",
    icon: <FaCircleExclamation className="text-red-400" />,
    label: "Crítico",
  },
};

export interface InsightFindingCardProps {
  finding: InsightFinding;
}

export function InsightFindingCard({ finding }: InsightFindingCardProps) {
  const severity = SEVERITY_META[finding.severity];

  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-lg">{severity.icon}</span>
        <div className="flex-1">
          <Text className="font-semibold text-white">{finding.title}</Text>
          <Text className="text-sm text-slate-300 mt-1">
            {finding.description}
          </Text>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pl-7">
        <Chip color={severity.color} size="sm" variant="solid">
          {severity.label}
        </Chip>
        <Chip color="primary" size="sm" variant="solid">
          {finding.supportingMetric.label}: {finding.supportingMetric.value}
        </Chip>
        {finding.supportingMetric.comparison && (
          <Chip color="secondary" size="sm" variant="solid">
            {finding.supportingMetric.comparison}
          </Chip>
        )}
      </div>
    </div>
  );
}
