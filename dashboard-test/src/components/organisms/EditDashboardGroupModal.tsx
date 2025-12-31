import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";

import { FaFloppyDisk, FaXmark, FaTrash, FaGaugeHigh } from "react-icons/fa6";

import { Button, Input, Select, Text } from "@components/atoms";
import { CollapsibleSection } from "@components/molecules";

import { useAvailableDashboardMeasurements } from "@/hooks/useDashboardMeasurements";
import type { DashboardMeasurement } from "@/types/dashboard";
import type {
  DashboardMeasurementGroup,
  UpdateDashboardMeasurementGroupData,
} from "@/types/dashboard-measurement-group";

import { Modal } from "./Modal";

export interface EditDashboardGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: number,
    data: UpdateDashboardMeasurementGroupData
  ) => Promise<void>;
  group: DashboardMeasurementGroup | null;
  isLoading?: boolean;
}

export const EditDashboardGroupModal: React.FC<
  EditDashboardGroupModalProps
> = ({ isOpen, onClose, onSubmit, group, isLoading = false }) => {
  const [groupName, setGroupName] = useState<string>("");
  const [selectedDashboardMeasurementIds, setSelectedDashboardMeasurementIds] =
    useState<number[]>([]);
  const [selectedMeasurementId, setSelectedMeasurementId] =
    useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [chartTimeRange, setChartTimeRange] = useState<string>("");
  const [chartMinValue, setChartMinValue] = useState<string>("");
  const [chartMaxValue, setChartMaxValue] = useState<string>("");
  const [chartMeasurementIds, setChartMeasurementIds] = useState<number[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    data: availableDashboardMeasurements = [],
    loading: measurementsLoading,
  } = useAvailableDashboardMeasurements();

  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name);
      setSelectedDashboardMeasurementIds(
        group.dashboardMeasurements.map((dm) => dm.id)
      );
      setSelectedMeasurementId("");
      setChartTimeRange(group.chartTimeRange?.toString() ?? "");
      setChartMinValue(group.chartMinValue?.toString() ?? "");
      setChartMaxValue(group.chartMaxValue?.toString() ?? "");
      setChartMeasurementIds(group.chartMeasurementIds ?? []);
      setErrors({});
    }
  }, [group, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setGroupName("");
      setSelectedDashboardMeasurementIds([]);
      setSelectedMeasurementId("");
      setErrors({});
      setChartTimeRange("");
      setChartMinValue("");
      setChartMaxValue("");
      setChartMeasurementIds([]);
    }
  }, [isOpen]);

  const selectedDashboardMeasurements = useMemo(() => {
    const allAvailable = [...availableDashboardMeasurements];

    if (group) {
      group.dashboardMeasurements.forEach((dm) => {
        if (!allAvailable.find((a) => a.id === dm.id)) {
          allAvailable.push({
            id: dm.id,
            measurementId: dm.measurementId,
            minValue: dm.minValue,
            maxValue: dm.maxValue,
            measurement: dm.measurement,
          } as DashboardMeasurement);
        }
      });
    }

    return allAvailable.filter((dm) =>
      selectedDashboardMeasurementIds.includes(dm.id)
    );
  }, [availableDashboardMeasurements, selectedDashboardMeasurementIds, group]);

  const availableForSelect = useMemo(() => {
    const allAvailable = [...availableDashboardMeasurements];

    if (group) {
      group.dashboardMeasurements.forEach((dm) => {
        if (!allAvailable.find((a) => a.id === dm.id)) {
          allAvailable.push({
            id: dm.id,
            measurementId: dm.measurementId,
            minValue: dm.minValue,
            maxValue: dm.maxValue,
            measurement: dm.measurement,
          } as DashboardMeasurement);
        }
      });
    }

    return allAvailable.filter(
      (dm) => !selectedDashboardMeasurementIds.includes(dm.id)
    );
  }, [availableDashboardMeasurements, selectedDashboardMeasurementIds, group]);

  const handleRemoveMeasurement = (id: number) => {
    setSelectedDashboardMeasurementIds(
      selectedDashboardMeasurementIds.filter(
        (measurementId) => measurementId !== id
      )
    );
    const removedMeasurement = selectedDashboardMeasurements.find(
      (dm) => dm.id === id
    );

    if (removedMeasurement) {
      setChartMeasurementIds(
        chartMeasurementIds.filter(
          (measurementId) => measurementId !== removedMeasurement.measurementId
        )
      );
    }
  };

  const formatMeasurementDisplay = (dm: DashboardMeasurement): string => {
    return `${dm.measurement.name} - ${dm.measurement.externalId} | ${dm.measurement.type} | ${dm.minValue ?? 0} - ${dm.maxValue ?? 100}`;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!groupName.trim()) {
      newErrors.name = "El nombre del grupo es requerido";
    }

    if (selectedDashboardMeasurementIds.length === 0) {
      newErrors.measurements =
        "Debes seleccionar al menos un dashboard measurement";
    }

    if (
      chartTimeRange ||
      chartMinValue ||
      chartMaxValue ||
      chartMeasurementIds.length > 0
    ) {
      if (!chartTimeRange) {
        newErrors.chartTimeRange = "El tiempo del eje X es requerido";
      }

      if (!chartMinValue) {
        newErrors.chartMinValue = "El valor mínimo del eje Y es requerido";
      } else if (isNaN(Number(chartMinValue))) {
        newErrors.chartMinValue = "El valor mínimo debe ser un número";
      }

      if (!chartMaxValue) {
        newErrors.chartMaxValue = "El valor máximo del eje Y es requerido";
      } else if (isNaN(Number(chartMaxValue))) {
        newErrors.chartMaxValue = "El valor máximo debe ser un número";
      }

      if (
        chartMinValue &&
        chartMaxValue &&
        Number(chartMinValue) >= Number(chartMaxValue)
      ) {
        newErrors.chartRange = "El valor mínimo debe ser menor que el máximo";
      }

      if (chartMeasurementIds.length === 0) {
        newErrors.chartMeasurements =
          "Debes seleccionar al menos un measurement para el chart";
      }
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!group || !validateForm()) {
      return;
    }

    const data: UpdateDashboardMeasurementGroupData = {
      name: groupName.trim(),
      dashboardMeasurements: selectedDashboardMeasurementIds.map((id) => ({
        dashboardMeasurementId: id,
      })),
      chartTimeRange:
        chartTimeRange && chartTimeRange !== ""
          ? Number(chartTimeRange)
          : undefined,
      chartMinValue:
        chartMinValue && chartMinValue !== ""
          ? Number(chartMinValue)
          : undefined,
      chartMaxValue:
        chartMaxValue && chartMaxValue !== ""
          ? Number(chartMaxValue)
          : undefined,
      chartMeasurementIds:
        chartMeasurementIds.length > 0 ? chartMeasurementIds : undefined,
    };

    await onSubmit(group.id, data);
    handleClose();
  };

  const handleClose = () => {
    if (group) {
      setGroupName(group.name);
      setSelectedDashboardMeasurementIds(
        group.dashboardMeasurements.map((dm) => dm.id)
      );
      setSelectedMeasurementId("");
      setChartTimeRange(group.chartTimeRange?.toString() ?? "");
      setChartMinValue(group.chartMinValue?.toString() ?? "");
      setChartMaxValue(group.chartMaxValue?.toString() ?? "");
      setChartMeasurementIds(group.chartMeasurementIds ?? []);
    } else {
      setGroupName("");
      setSelectedDashboardMeasurementIds([]);
      setSelectedMeasurementId("");
      setChartTimeRange("");
      setChartMinValue("");
      setChartMaxValue("");
      setChartMeasurementIds([]);
    }
    setErrors({});
    onClose();
  };

  const handleChartMeasurementToggle = (measurementId: number) => {
    setChartMeasurementIds((prev) =>
      prev.includes(measurementId)
        ? prev.filter((id) => id !== measurementId)
        : [...prev, measurementId]
    );
  };

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Editar Grupo de Dashboard Measurements"
      onClose={handleClose}
    >
      <div className="max-h-[calc(85vh-220px)] overflow-y-auto overflow-x-hidden pr-2 -mr-2">
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="mb-6">
            <Input
              autoFocus
              fullWidth
              required
              isDisabled={isLoading}
              label="Nombre del Grupo"
              labelPlacement="outside"
              placeholder="Ej: Grupo de Temperaturas"
              size="md"
              startContent={<FaGaugeHigh className="text-slate-400" />}
              type="text"
              value={groupName}
              variant="bordered"
              onChange={(e) => setGroupName(e.target.value)}
            />
            {errors.name && (
              <Text className="mt-1" color="danger" variant="caption">
                {errors.name}
              </Text>
            )}
          </div>

          <div className="mb-6">
            <Text className="mb-4" color="secondary" variant="small">
              Dashboard Measurements del Grupo
            </Text>

            {selectedDashboardMeasurements.length > 0 && (
              <div className="mb-4 space-y-2">
                {selectedDashboardMeasurements.map((dm) => (
                  <div
                    key={dm.id}
                    className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 flex items-center justify-between"
                  >
                    <Text className="text-slate-200" variant="small">
                      {formatMeasurementDisplay(dm)}
                    </Text>
                    <Button
                      isIconOnly
                      color="danger"
                      size="sm"
                      type="button"
                      variant="flat"
                      onPress={() => handleRemoveMeasurement(dm.id)}
                    >
                      <FaTrash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Select
              fullWidth
              disabled={isLoading || measurementsLoading}
              value={selectedMeasurementId}
              onChange={(e) => {
                const value = e.target.value;

                setSelectedMeasurementId(value);
                if (value) {
                  const id = Number(value);

                  if (!selectedDashboardMeasurementIds.includes(id)) {
                    setSelectedDashboardMeasurementIds([
                      ...selectedDashboardMeasurementIds,
                      id,
                    ]);
                    setSelectedMeasurementId("");
                  }
                }
              }}
            >
              <option value="">Seleccionar dashboard measurement...</option>
              {availableForSelect.map((dm) => (
                <option key={dm.id} value={String(dm.id)}>
                  {formatMeasurementDisplay(dm)}
                </option>
              ))}
            </Select>
            {errors.measurements && (
              <Text className="mt-1" color="danger" variant="caption">
                {errors.measurements}
              </Text>
            )}
          </div>

          <div className="mb-6">
            <CollapsibleSection title="Configuración de Gráfica en Tiempo Real">
              <div className="space-y-4">
                <div>
                  <Text className="mb-2 text-sm text-slate-300" variant="small">
                    Tiempo del Eje X (Rango de datos)
                  </Text>
                  <Select
                    fullWidth
                    value={chartTimeRange}
                    onChange={(e) => setChartTimeRange(e.target.value)}
                  >
                    <option value="">Seleccionar tiempo...</option>
                    <option value="1">1 minuto</option>
                    <option value="10">10 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="120">2 horas</option>
                    <option value="240">4 horas</option>
                    <option value="480">8 horas</option>
                  </Select>
                  {errors.chartTimeRange && (
                    <Text className="mt-1" color="danger" variant="caption">
                      {errors.chartTimeRange}
                    </Text>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Input
                      fullWidth
                      isDisabled={isLoading}
                      label="Valor Mínimo (Eje Y)"
                      labelPlacement="outside"
                      placeholder="0"
                      size="md"
                      type="number"
                      value={chartMinValue}
                      variant="bordered"
                      onChange={(e) => setChartMinValue(e.target.value)}
                    />
                    {errors.chartMinValue && (
                      <Text className="mt-1" color="danger" variant="caption">
                        {errors.chartMinValue}
                      </Text>
                    )}
                  </div>
                  <div>
                    <Input
                      fullWidth
                      isDisabled={isLoading}
                      label="Valor Máximo (Eje Y)"
                      labelPlacement="outside"
                      placeholder="100"
                      size="md"
                      type="number"
                      value={chartMaxValue}
                      variant="bordered"
                      onChange={(e) => setChartMaxValue(e.target.value)}
                    />
                    {errors.chartMaxValue && (
                      <Text className="mt-1" color="danger" variant="caption">
                        {errors.chartMaxValue}
                      </Text>
                    )}
                  </div>
                </div>

                {errors.chartRange && (
                  <Text color="danger" variant="caption">
                    {errors.chartRange}
                  </Text>
                )}

                <div>
                  <Text className="mb-2 text-sm text-slate-300" variant="small">
                    Measurements para el Chart
                  </Text>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 max-h-48 overflow-y-auto">
                    {selectedDashboardMeasurements.map((dm) => {
                      const measurementId = dm.measurementId;

                      return (
                        <label
                          key={dm.id}
                          className="flex items-center gap-2 p-2 hover:bg-slate-600/50 rounded cursor-pointer"
                        >
                          <input
                            checked={chartMeasurementIds.includes(
                              measurementId
                            )}
                            className="w-4 h-4 text-primary bg-slate-700 border-slate-600 rounded focus:ring-primary focus:ring-2"
                            type="checkbox"
                            onChange={() =>
                              handleChartMeasurementToggle(measurementId)
                            }
                          />
                          <Text variant="small">
                            {dm.measurement.name} ({dm.measurement.externalId})
                          </Text>
                        </label>
                      );
                    })}
                    {selectedDashboardMeasurements.length === 0 && (
                      <Text color="muted" variant="small">
                        Agrega dashboard measurements al grupo primero
                      </Text>
                    )}
                  </div>
                  {errors.chartMeasurements && (
                    <Text className="mt-1" color="danger" variant="caption">
                      {errors.chartMeasurements}
                    </Text>
                  )}
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </form>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 pb-2 border-t border-slate-600 flex-shrink-0">
        <Button
          className="px-6 py-2 font-semibold"
          color="default"
          disabled={isLoading}
          size="md"
          variant="solid"
          onPress={handleClose}
        >
          <FaXmark className="mr-2" />
          Cancelar
        </Button>
        <Button
          className="px-6 py-2 font-semibold"
          color="primary"
          disabled={isLoading}
          isLoading={isLoading}
          size="md"
          variant="solid"
          onPress={() => {
            if (formRef.current) {
              formRef.current.requestSubmit();
            }
          }}
        >
          <FaFloppyDisk className="mr-2" />
          Guardar Cambios
        </Button>
      </div>
    </Modal>
  );
};
