import { useMemo } from "react";

import {
  FaTemperatureHalf,
  FaDroplet,
  FaWeightHanging,
  FaWater,
  FaWaveSquare,
  FaArrowsLeftRightToLine,
  FaCalculator,
} from "react-icons/fa6";

import type { SensorType } from "@/types/alertRule";

import { useAlertRules } from "./useAlertRules";
import { useMeasurements } from "./useMeasurements";
import { useMessageGroups } from "./useMessageGroups";
import { useReceptors } from "./useReceptors";
import { useTorretaColors } from "./useTorretaColors";

export const useMonitoringConditions = () => {
  const {
    data: alertRules = [],
    isLoading: alertRulesLoading,
    error: alertRulesError,
  } = useAlertRules();
  const {
    data: measurements = [],
    isLoading: measurementsLoading,
    error: measurementsError,
  } = useMeasurements();
  const {
    data: receptors = [],
    isLoading: receptorsLoading,
    error: receptorsError,
  } = useReceptors();
  const {
    data: messageGroups = [],
    isLoading: messageGroupsLoading,
    error: messageGroupsError,
  } = useMessageGroups();
  const {
    data: torretaColors = [],
    isLoading: torretaColorsLoading,
    error: torretaColorsError,
  } = useTorretaColors();

  const isLoading =
    alertRulesLoading ||
    measurementsLoading ||
    receptorsLoading ||
    messageGroupsLoading ||
    torretaColorsLoading;

  const error =
    alertRulesError ??
    measurementsError ??
    receptorsError ??
    messageGroupsError ??
    torretaColorsError;

  const coloresTorreta = useMemo(() => {
    return torretaColors.map((color) => color.name);
  }, [torretaColors]);

  const getColorValue = useMemo(() => {
    return (colorName: string): string => {
      const color = torretaColors.find((c) => c.name === colorName);

      return color?.htmlColor || color?.hexCode || "#6b7280";
    };
  }, [torretaColors]);

  const sensorTypes: SensorType[] = useMemo(
    () => [
      {
        value: "temperature",
        label: "Temperatura",
        icon: FaTemperatureHalf,
        color: "text-red-400",
      },
      {
        value: "humidity",
        label: "Humedad",
        icon: FaDroplet,
        color: "text-blue-400",
      },
      {
        value: "dew_point",
        label: "Dew Point",
        icon: FaTemperatureHalf,
        color: "text-blue-400",
      },
      {
        value: "ppm",
        label: "PPM",
        icon: FaDroplet,
        color: "text-blue-400",
      },
      {
        value: "pressure",
        label: "Presión",
        icon: FaWeightHanging,
        color: "text-purple-400",
      },
      {
        value: "level",
        label: "Nivel",
        icon: FaWater,
        color: "text-cyan-400",
      },
      {
        value: "vibration",
        label: "Vibración",
        icon: FaWaveSquare,
        color: "text-orange-400",
      },
      {
        value: "flow",
        label: "Flujo",
        icon: FaArrowsLeftRightToLine,
        color: "text-green-400",
      },
      {
        value: "totalizador",
        label: "Totalizador",
        icon: FaCalculator,
        color: "text-yellow-400",
      },
      {
        value: "shape",
        label: "Shape",
        icon: FaWaveSquare,
        color: "text-indigo-400",
      },
    ],
    []
  );

  const operators = useMemo(
    () => [
      { value: ">", label: "Mayor que (>)" },
      { value: ">=", label: "Mayor o igual (>=)" },
      { value: "<", label: "Menor que (<)" },
      { value: "<=", label: "Menor o igual (<=)" },
      { value: "==", label: "Igual (==)" },
      { value: "!=", label: "Diferente (!=)" },
    ],
    []
  );

  const sensors = useMemo(() => {
    return measurements.map((measurement) => ({
      id: measurement.id,
      externalId: measurement.externalId,
      name: measurement.name,
      type: measurement.type,
      area: measurement.area ?? "Sin área asignada",
      status: measurement.status,
    }));
  }, [measurements]);

  return {
    alertRules,
    sensors,
    receptors,
    messageGroups,
    coloresTorreta,
    sensorTypes,
    operators,
    getColorValue,
    isLoading,
    error,
    alertRulesLoading,
    measurementsLoading,
    receptorsLoading,
    messageGroupsLoading,
    torretaColorsLoading,
  };
};
