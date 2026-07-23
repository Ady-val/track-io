import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { ModuleType, usePermissions } from "@/contexts/PermissionsContext";
import insightsService from "@/lib/services/insights.service";
import type { InsightAnalysisResult } from "@/types/insights";
import type { GroupBy } from "@/types/report";

import { Button } from "../../atoms";

import { InsightsResultModal } from "./InsightsResultModal";

export interface InsightsButtonProps {
  areaId?: number;
  from: string;
  to: string;
  groupBy: GroupBy;
  disabled?: boolean;
}

export type InsightsRequestStatus = "idle" | "loading" | "success" | "error";

function errorMessageFor(error: unknown): string {
  const status = (error as { response?: { status?: number } })?.response
    ?.status;

  if (status === 503) {
    return "El módulo de análisis con IA no está configurado en este servidor.";
  }
  if (status === 429) {
    return "Se alcanzó el límite de solicitudes a la IA. Intenta de nuevo en unos minutos.";
  }
  if (status === 400) {
    return "El rango de fechas seleccionado no es válido para el análisis.";
  }

  return "No se pudo generar el análisis, intenta de nuevo.";
}

export function InsightsButton({
  areaId,
  from,
  to,
  groupBy,
  disabled,
}: InsightsButtonProps) {
  const { hasModule } = usePermissions();
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<InsightsRequestStatus>("idle");
  const [result, setResult] = useState<InsightAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: health } = useQuery({
    queryKey: ["insights", "health"],
    queryFn: () => insightsService.getHealth(),
    enabled: hasModule(ModuleType.INSIGHTS),
    retry: false,
    staleTime: 60_000,
  });

  const available = hasModule(ModuleType.INSIGHTS) && Boolean(health?.enabled);

  if (!available) {
    return null;
  }

  const handleAnalyze = async () => {
    setIsOpen(true);
    setStatus("loading");
    setErrorMessage(null);
    try {
      const analysis = await insightsService.analyze({
        startDate: from,
        endDate: to,
        groupBy,
        ...(areaId !== undefined && { areaId }),
      });

      setResult(analysis);
      setStatus("success");
    } catch (error) {
      setErrorMessage(errorMessageFor(error));
      setStatus("error");
    }
  };

  return (
    <>
      <Button
        className="text-white"
        color="secondary"
        isDisabled={disabled || !health?.modelConfigured}
        variant="solid"
        onPress={handleAnalyze}
      >
        Analizar patrones con IA
      </Button>

      <InsightsResultModal
        errorMessage={errorMessage}
        from={from}
        groupBy={groupBy}
        isOpen={isOpen}
        result={result}
        status={status}
        to={to}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
