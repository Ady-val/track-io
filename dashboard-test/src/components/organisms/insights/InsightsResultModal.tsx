import type { InsightsRequestStatus } from "./InsightsButton";

import type { InsightAnalysisResult } from "@/types/insights";
import type { GroupBy } from "@/types/report";

import { Button, Chip, ErrorMessage, Spinner, Text } from "../../atoms";
import { Modal } from "../Modal";

import { InsightFindingCard } from "./InsightFindingCard";
import { InsightsEmptyState } from "./InsightsEmptyState";

export interface InsightsResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: InsightsRequestStatus;
  result: InsightAnalysisResult | null;
  errorMessage: string | null;
  from: string;
  to: string;
  groupBy: GroupBy;
}

const GROUP_BY_LABEL: Record<GroupBy, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
};

const dateFormatter = new Intl.DateTimeFormat("es-MX", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatRange(from: string, to: string): string {
  if (!from || !to) return "";
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return "";
  }

  return `${dateFormatter.format(fromDate)} – ${dateFormatter.format(toDate)}`;
}

function AnalysisScope({
  from,
  to,
  groupBy,
}: {
  from: string;
  to: string;
  groupBy: GroupBy;
}) {
  const range = formatRange(from, to);

  if (!range) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-300 bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2">
      <span className="text-slate-400">Periodo analizado:</span>
      <span className="font-medium text-white">{range}</span>
      <span className="text-slate-600">·</span>
      <span className="text-slate-400">Agrupación:</span>
      <span className="font-medium text-white">{GROUP_BY_LABEL[groupBy]}</span>
    </div>
  );
}

export function InsightsResultModal({
  isOpen,
  onClose,
  status,
  result,
  errorMessage,
  from,
  to,
  groupBy,
}: InsightsResultModalProps) {
  return (
    <Modal
      data-cy="insights-result-modal"
      isOpen={isOpen}
      size="2xl"
      title="Análisis de patrones con IA"
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <AnalysisScope from={from} groupBy={groupBy} to={to} />

        {status === "loading" && (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <Spinner size="lg" />
            <Text className="text-slate-300">
              Analizando eventos del periodo…
            </Text>
          </div>
        )}

        {status === "error" && (
          <div>
            <ErrorMessage
              isServerError
              message={errorMessage ?? "No se pudo generar el análisis"}
              type="server"
            />
            <div className="flex justify-end pt-6">
              <Button color="default" variant="solid" onPress={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {status === "success" && result && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <Chip
                color={result.meta.cached ? "secondary" : "success"}
                size="sm"
                variant="solid"
              >
                {result.meta.cached ? "Resultado en caché" : "Análisis nuevo"}
              </Chip>
              <span>{result.meta.totalEventsAnalyzed} eventos analizados</span>
              <span>·</span>
              <span>modelo {result.meta.model}</span>
            </div>

            {result.findings.length === 0 ? (
              <InsightsEmptyState />
            ) : (
              <div className="flex flex-col gap-3">
                {result.findings.map((finding) => (
                  <InsightFindingCard key={finding.id} finding={finding} />
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button color="default" variant="solid" onPress={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
