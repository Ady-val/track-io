import type React from "react";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useFieldArray } from "react-hook-form";

import { FaFloppyDisk, FaXmark, FaTrash, FaGaugeHigh } from "react-icons/fa6";

import { Button, Input, Select, Text, ErrorMessage, ValidationErrorList } from "@components/atoms";
import { FieldError } from "@components/molecules";
import { CollapsibleSection } from "@components/molecules";

import { useAvailableDashboardMeasurements } from "@/hooks/useDashboardMeasurements";
import { useFormValidation } from "@/hooks/useFormValidation";
import { updateDashboardMeasurementGroupSchema } from "@/lib/validations/schemas";
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
  const {
    data: availableDashboardMeasurements = [],
    loading: measurementsLoading,
  } = useAvailableDashboardMeasurements();

  const { form, modalError, handleBackendError, clearAllErrors, toast, resetForm } =
    useFormValidation({
      schema: updateDashboardMeasurementGroupSchema,
      defaultValues: {
        name: group?.name ?? "",
        dashboardMeasurements:
          group?.dashboardMeasurements.map((dm) => ({
            dashboardMeasurementId: dm.id,
          })) ?? [],
        chartTimeRange: group?.chartTimeRange,
        chartMinValue: group?.chartMinValue,
        chartMaxValue: group?.chartMaxValue,
        chartMeasurementIds: group?.chartMeasurementIds ?? [],
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Grupo actualizado exitosamente",
    });

  const { append, remove } = useFieldArray({
    control: form.control,
    name: "dashboardMeasurements",
  });

  const prevGroupIdRef = useRef<number | null>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Actualizar valores cuando cambia el group o se abre el modal
  useEffect(() => {
    if (group && isOpen) {
      const groupId = group.id;
      const shouldReset = 
        !prevIsOpenRef.current || 
        prevGroupIdRef.current !== groupId;
      
      if (shouldReset) {
        resetForm({
          name: group.name,
          dashboardMeasurements: group.dashboardMeasurements.map((dm) => ({
            dashboardMeasurementId: dm.id,
          })),
          chartTimeRange: group.chartTimeRange,
          chartMinValue: group.chartMinValue,
          chartMaxValue: group.chartMaxValue,
          chartMeasurementIds: group.chartMeasurementIds ?? [],
        });
        prevGroupIdRef.current = groupId;
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [group, isOpen, resetForm]);

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

    const selectedIds = form.watch("dashboardMeasurements")?.map(
      (dm) => dm.dashboardMeasurementId
    ) ?? [];

    return allAvailable.filter((dm) => selectedIds.includes(dm.id));
  }, [
    availableDashboardMeasurements,
    form.watch("dashboardMeasurements"),
    group,
  ]);

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

    const selectedIds = form.watch("dashboardMeasurements")?.map(
      (dm) => dm.dashboardMeasurementId
    ) ?? [];

    return allAvailable.filter((dm) => !selectedIds.includes(dm.id));
  }, [
    availableDashboardMeasurements,
    form.watch("dashboardMeasurements"),
    group,
  ]);

  const formatMeasurementDisplay = (dm: DashboardMeasurement): string => {
    return `${dm.measurement.name} - ${dm.measurement.externalId} | ${dm.measurement.type} | ${dm.minValue ?? 0} - ${dm.maxValue ?? 100}`;
  };

  const handleAddMeasurement = (measurementId: number) => {
    append({ dashboardMeasurementId: measurementId });
  };

  const handleRemoveMeasurement = (index: number) => {
    const removedMeasurement = selectedDashboardMeasurements[index];

    remove(index);
    if (removedMeasurement) {
      const currentChartIds = form.getValues("chartMeasurementIds") ?? [];

      form.setValue(
        "chartMeasurementIds",
        currentChartIds.filter(
          (id) => id !== removedMeasurement.measurementId
        )
      );
    }
  };

  const handleChartMeasurementToggle = (measurementId: number) => {
    const currentIds = form.getValues("chartMeasurementIds") ?? [];

    if (currentIds.includes(measurementId)) {
      form.setValue(
        "chartMeasurementIds",
        currentIds.filter((id) => id !== measurementId)
      );
    } else {
      form.setValue("chartMeasurementIds", [...currentIds, measurementId]);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!group) return;

    try {
      clearAllErrors();

      const submitData: UpdateDashboardMeasurementGroupData = {
        name: data.name?.trim() ?? group.name,
        dashboardMeasurements: data.dashboardMeasurements,
        chartTimeRange: data.chartTimeRange,
        chartMinValue: data.chartMinValue,
        chartMaxValue: data.chartMaxValue,
        chartMeasurementIds: data.chartMeasurementIds,
      };

      await onSubmit(group.id, submitData);
      toast.success("Grupo actualizado exitosamente");
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  const handleClose = () => {
    if (group) {
      resetForm({
        name: group.name,
        dashboardMeasurements: group.dashboardMeasurements.map((dm) => ({
          dashboardMeasurementId: dm.id,
        })),
        chartTimeRange: group.chartTimeRange,
        chartMinValue: group.chartMinValue,
        chartMaxValue: group.chartMaxValue,
        chartMeasurementIds: group.chartMeasurementIds ?? [],
      });
    }
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
      <div className="flex flex-col flex-1 min-h-0">
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto">
          {/* Errores de validación generales */}
          {modalError.validationErrors.length > 0 && (
            <ValidationErrorList errors={modalError.validationErrors} />
          )}

          {/* Error del servidor */}
          {modalError.serverError && (
            <ErrorMessage
              message={modalError.serverError}
              type="server"
              isServerError={modalError.parsedError?.isServerError ?? false}
            />
          )}

          <div className="mb-6">
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    label="Nombre del Grupo"
                    labelPlacement="outside"
                    placeholder="Ej: Grupo de Temperaturas"
                    size="md"
                    startContent={<FaGaugeHigh className="text-slate-400" />}
                    type="text"
                    variant="bordered"
                  />
                  <FieldError error={fieldState.error?.message} fieldId="name" />
                </>
              )}
            />
          </div>

          <div className="mb-6">
            <Text className="mb-4" color="secondary" variant="small">
              Dashboard Measurements del Grupo
            </Text>

            {selectedDashboardMeasurements.length > 0 && (
              <div className="mb-4 space-y-2">
                {selectedDashboardMeasurements.map((dm, index) => (
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
                      onPress={() => handleRemoveMeasurement(index)}
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
              value=""
              onChange={(e) => {
                const value = e.target.value;

                if (value) {
                  const id = Number(value);

                  handleAddMeasurement(id);
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
            {form.formState.errors.dashboardMeasurements && (
              <Text className="mt-1" color="danger" variant="caption">
                {form.formState.errors.dashboardMeasurements.message ||
                  "Debes seleccionar al menos un dashboard measurement"}
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
                  <Controller
                    name="chartTimeRange"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          {...field}
                          fullWidth
                          value={field.value ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined
                            )
                          }
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
                        <FieldError
                          error={fieldState.error?.message}
                          fieldId="chartTimeRange"
                        />
                      </>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Controller
                      name="chartMinValue"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            fullWidth
                            isDisabled={isLoading}
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            label="Valor Mínimo (Eje Y)"
                            labelPlacement="outside"
                            placeholder="0"
                            size="md"
                            type="number"
                            value={field.value ? String(field.value) : ""}
                            variant="bordered"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId="chartMinValue"
                          />
                        </>
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      name="chartMaxValue"
                      control={form.control}
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            {...field}
                            fullWidth
                            isDisabled={isLoading}
                            isInvalid={!!fieldState.error}
                            errorMessage={fieldState.error?.message}
                            label="Valor Máximo (Eje Y)"
                            labelPlacement="outside"
                            placeholder="100"
                            size="md"
                            type="number"
                            value={field.value ? String(field.value) : ""}
                            variant="bordered"
                            onChange={(e) =>
                              field.onChange(
                                e.target.value ? Number(e.target.value) : undefined
                              )
                            }
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId="chartMaxValue"
                          />
                        </>
                      )}
                    />
                  </div>
                </div>

                <div>
                  <Text className="mb-2 text-sm text-slate-300" variant="small">
                    Measurements para el Chart
                  </Text>
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 max-h-48 overflow-y-auto">
                    {selectedDashboardMeasurements
                      .filter((dm) => dm.measurement.type !== "status")
                      .map((dm) => {
                        const measurementId = dm.measurementId;
                        const chartIds = form.watch("chartMeasurementIds") ?? [];

                        return (
                          <label
                            key={dm.id}
                            className="flex items-center gap-2 p-2 hover:bg-slate-600/50 rounded cursor-pointer"
                          >
                            <input
                              checked={chartIds.includes(measurementId)}
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
                    {selectedDashboardMeasurements.filter(
                      (dm) => dm.measurement.type !== "status"
                    ).length === 0 && (
                      <Text color="muted" variant="small">
                        {selectedDashboardMeasurements.length === 0
                          ? "Agrega dashboard measurements al grupo primero"
                          : "No hay measurements disponibles para el chart (los measurements tipo 'status' no pueden agregarse al chart)"}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 pt-4 pb-2 border-t border-slate-600 flex-shrink-0">
        <Button
          className="px-6 py-2 font-semibold"
          color="default"
          disabled={form.formState.isSubmitting}
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
          disabled={form.formState.isSubmitting}
          isLoading={form.formState.isSubmitting}
          size="md"
          variant="solid"
          onPress={() => {
            void handleSubmit();
          }}
        >
          <FaFloppyDisk className="mr-2" />
          Guardar Cambios
        </Button>
        </div>
      </div>
    </Modal>
  );
};
