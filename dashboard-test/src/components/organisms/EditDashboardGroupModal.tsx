import type React from "react";
import { useState, useEffect } from "react";

import {
  FaFloppyDisk,
  FaXmark,
  FaPlus,
  FaTrash,
  FaGaugeHigh,
} from "react-icons/fa6";

import { Button, Input, Select, Text } from "@components/atoms";

import { useMeasurements } from "@/hooks/useMeasurements";
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

interface MeasurementItem {
  id?: number;
  measurementId: string;
  minValue: string;
  maxValue: string;
}

export const EditDashboardGroupModal: React.FC<
  EditDashboardGroupModalProps
> = ({ isOpen, onClose, onSubmit, group, isLoading = false }) => {
  const [groupName, setGroupName] = useState<string>("");
  const [measurements, setMeasurements] = useState<MeasurementItem[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: availableMeasurements = [], isLoading: measurementsLoading } =
    useMeasurements();

  useEffect(() => {
    if (group && isOpen) {
      setGroupName(group.name);
      setMeasurements(
        group.dashboardMeasurements.map((dm) => ({
          measurementId: dm.measurementId.toString(),
          minValue: dm.minValue.toString(),
          maxValue: dm.maxValue.toString(),
        }))
      );
      setErrors({});
    }
  }, [group, isOpen]);

  const handleAddMeasurement = () => {
    const tempId =
      measurements.length > 0
        ? Math.min(...measurements.map((m) => m.id || 0)) - 1
        : -1;
    setMeasurements([
      ...measurements,
      { id: tempId, measurementId: "", minValue: "", maxValue: "" },
    ]);
  };

  const handleRemoveMeasurement = (index: number) => {
    if (measurements.length > 1) {
      setMeasurements(measurements.filter((_, i) => i !== index));
    }
  };

  const handleMeasurementChange = (
    index: number,
    field: "measurementId" | "minValue" | "maxValue",
    value: string
  ) => {
    const updated = [...measurements];
    const currentItem = updated[index];

    updated[index] = {
      ...currentItem,
      [field]: value,
    } as MeasurementItem;
    setMeasurements(updated);

    const errorKey = `${index}-${field}`;

    if (errors[errorKey]) {
      const newErrors = { ...errors };

      delete newErrors[errorKey];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!groupName.trim()) {
      newErrors.name = "El nombre del grupo es requerido";
    }

    measurements.forEach((measurement, index) => {
      if (!measurement.measurementId) {
        newErrors[`${index}-measurementId`] = "Selecciona un measurement";
      }

      if (!measurement.minValue) {
        newErrors[`${index}-minValue`] = "El valor mínimo es requerido";
      } else if (isNaN(Number(measurement.minValue))) {
        newErrors[`${index}-minValue`] = "El valor mínimo debe ser un número";
      }

      if (!measurement.maxValue) {
        newErrors[`${index}-maxValue`] = "El valor máximo es requerido";
      } else if (isNaN(Number(measurement.maxValue))) {
        newErrors[`${index}-maxValue`] = "El valor máximo debe ser un número";
      }

      if (
        measurement.minValue &&
        measurement.maxValue &&
        Number(measurement.minValue) >= Number(measurement.maxValue)
      ) {
        newErrors[`${index}-range`] =
          "El valor mínimo debe ser menor que el máximo";
      }
    });

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!group || !validateForm()) {
      return;
    }

    const data: UpdateDashboardMeasurementGroupData = {
      name: groupName.trim(),
      dashboardMeasurements: measurements.map((m) => ({
        measurementId: Number(m.measurementId),
        minValue: Number(m.minValue),
        maxValue: Number(m.maxValue),
      })),
    };

    await onSubmit(group.id, data);
    handleClose();
  };

  const handleClose = () => {
    if (group) {
      setGroupName(group.name);
      setMeasurements(
        group.dashboardMeasurements.map((dm) => ({
          id: dm.id,
          measurementId: dm.measurementId.toString(),
          minValue: dm.minValue.toString(),
          maxValue: dm.maxValue.toString(),
        }))
      );
    } else {
      setGroupName("");
      setMeasurements([]);
    }
    setErrors({});
    onClose();
  };

  if (!group) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Editar Grupo de Dashboard Measurements"
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="flex flex-col h-full">
        {/* Scrollable Content Area */}
        <div
          className="overflow-y-auto overflow-x-hidden pr-2 -mr-2 pb-4"
          style={{ maxHeight: "calc(85vh - 280px)" }}
        >
          {/* Group Name */}
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

          {/* Measurements List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Text color="secondary" variant="small">
                Measurements del Grupo
              </Text>
              <Button
                color="primary"
                size="sm"
                type="button"
                variant="flat"
                onPress={handleAddMeasurement}
              >
                <FaPlus className="mr-2" />
                Agregar Measurement
              </Button>
            </div>

            <div className="space-y-4">
              {measurements.map((measurement, index) => (
                <div
                  key={measurement.id ?? `temp-${index}`}
                  className="bg-slate-700/50 rounded-lg p-4 border border-slate-600"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Text color="secondary" variant="small">
                      Measurement {index + 1}
                    </Text>
                    {measurements.length > 1 && (
                      <Button
                        color="danger"
                        size="sm"
                        type="button"
                        variant="flat"
                        onPress={() => handleRemoveMeasurement(index)}
                      >
                        <FaTrash className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {/* Measurement Select */}
                    <div>
                      <Text
                        className="mb-2 text-sm text-slate-300"
                        variant="small"
                      >
                        Measurement
                      </Text>
                      <Select
                        fullWidth
                        required
                        disabled={isLoading || measurementsLoading}
                        value={measurement.measurementId}
                        onChange={(e) =>
                          handleMeasurementChange(
                            index,
                            "measurementId",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Seleccionar...</option>
                        {availableMeasurements.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.externalId}) - {m.type}
                          </option>
                        ))}
                      </Select>
                      {errors[`${index}-measurementId`] && (
                        <Text className="mt-1" color="danger" variant="caption">
                          {errors[`${index}-measurementId`]}
                        </Text>
                      )}
                    </div>

                    {/* Min and Max Values */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Input
                          fullWidth
                          required
                          isDisabled={isLoading}
                          label="Valor Mínimo"
                          labelPlacement="outside"
                          placeholder="0"
                          size="md"
                          type="number"
                          value={measurement.minValue}
                          variant="bordered"
                          onChange={(e) =>
                            handleMeasurementChange(
                              index,
                              "minValue",
                              e.target.value
                            )
                          }
                        />
                        {errors[`${index}-minValue`] && (
                          <Text
                            className="mt-1"
                            color="danger"
                            variant="caption"
                          >
                            {errors[`${index}-minValue`]}
                          </Text>
                        )}
                      </div>

                      <div>
                        <Input
                          fullWidth
                          required
                          isDisabled={isLoading}
                          label="Valor Máximo"
                          labelPlacement="outside"
                          placeholder="100"
                          size="md"
                          type="number"
                          value={measurement.maxValue}
                          variant="bordered"
                          onChange={(e) =>
                            handleMeasurementChange(
                              index,
                              "maxValue",
                              e.target.value
                            )
                          }
                        />
                        {errors[`${index}-maxValue`] && (
                          <Text
                            className="mt-1"
                            color="danger"
                            variant="caption"
                          >
                            {errors[`${index}-maxValue`]}
                          </Text>
                        )}
                      </div>
                    </div>

                    {errors[`${index}-range`] && (
                      <Text color="danger" variant="caption">
                        {errors[`${index}-range`]}
                      </Text>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Actions Footer */}
        <div className="flex items-center justify-end gap-2 pt-4 pb-2 border-t border-slate-600 flex-shrink-0 mt-auto">
          <Button
            color="default"
            disabled={isLoading}
            size="md"
            variant="flat"
            onPress={handleClose}
          >
            <FaXmark className="mr-2" />
            Cancelar
          </Button>
          <Button
            color="primary"
            disabled={isLoading}
            isLoading={isLoading}
            size="md"
            type="submit"
            variant="solid"
          >
            <FaFloppyDisk className="mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};
