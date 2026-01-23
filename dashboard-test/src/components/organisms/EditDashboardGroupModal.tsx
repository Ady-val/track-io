import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Controller, useFieldArray } from "react-hook-form";
import {
  FaArrowDown,
  FaArrowUp,
  FaFloppyDisk,
  FaGaugeHigh,
  FaTrash,
  FaXmark,
} from "react-icons/fa6";

import {
  Button,
  Input,
  Select,
  Text,
  ErrorMessage,
  ValidationErrorList,
} from "@components/atoms";
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

interface SortableMeasurementItemProps {
  measurement: DashboardMeasurement;
  displayText: string;
  onRemove: (dashboardMeasurementId: number) => void;
}

const SortableMeasurementItem: React.FC<SortableMeasurementItemProps> = ({
  measurement,
  displayText,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: measurement.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-700/50 rounded-lg p-3 border border-slate-600 flex items-center justify-between ${
        isDragging ? "opacity-50" : ""
      }`}
      style={style}
    >
      <div className="flex items-center gap-2 min-w-0">
        <button
          ref={setActivatorNodeRef}
          aria-label="Reordenar"
          className="flex flex-col items-center justify-center text-slate-400 hover:text-slate-200 cursor-grab active:cursor-grabbing"
          type="button"
          {...attributes}
          {...listeners}
        >
          <FaArrowUp className="w-3 h-3" />
          <FaArrowDown className="w-3 h-3 -mt-1" />
        </button>
        <Text className="text-slate-200" variant="small">
          {displayText}
        </Text>
      </div>
      <Button
        isIconOnly
        color="danger"
        size="sm"
        type="button"
        variant="flat"
        onPress={() => onRemove(measurement.id)}
      >
        <FaTrash className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const EditDashboardGroupModal: React.FC<
  EditDashboardGroupModalProps
> = ({ isOpen, onClose, onSubmit, group, isLoading = false }) => {
  const {
    data: availableDashboardMeasurements = [],
    loading: measurementsLoading,
  } = useAvailableDashboardMeasurements();

  const {
    form,
    modalError,
    handleBackendError,
    clearAllErrors,
    toast,
    resetForm,
  } = useFormValidation({
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

  const { append, remove, move } = useFieldArray({
    control: form.control,
    name: "dashboardMeasurements",
  });

  const prevGroupIdRef = useRef<number | null>(null);
  const prevIsOpenRef = useRef(isOpen);

  // Estados locales para los inputs numéricos (mejor UX)
  const [minValueInput, setMinValueInput] = useState<string>("");
  const [maxValueInput, setMaxValueInput] = useState<string>("");
  const [isChartConfigCleared, setIsChartConfigCleared] = useState(false);

  // Actualizar valores cuando cambia el group o se abre el modal
  useEffect(() => {
    if (group && isOpen) {
      const groupId = group.id;
      const shouldReset =
        !prevIsOpenRef.current || prevGroupIdRef.current !== groupId;

      if (shouldReset) {
        // Asegurar que los valores numéricos sean números, no strings
        const minValue =
          group.chartMinValue != null
            ? typeof group.chartMinValue === "number"
              ? group.chartMinValue
              : Number(group.chartMinValue)
            : undefined;
        const maxValue =
          group.chartMaxValue != null
            ? typeof group.chartMaxValue === "number"
              ? group.chartMaxValue
              : Number(group.chartMaxValue)
            : undefined;

        resetForm({
          name: group.name,
          dashboardMeasurements: group.dashboardMeasurements.map((dm) => ({
            dashboardMeasurementId: dm.id,
          })),
          chartTimeRange: group.chartTimeRange,
          chartMinValue: minValue,
          chartMaxValue: maxValue,
          chartMeasurementIds: group.chartMeasurementIds ?? [],
        });
        // Sincronizar estados locales con valores numéricos convertidos
        setMinValueInput(
          minValue != null && !isNaN(minValue) ? String(minValue) : ""
        );
        setMaxValueInput(
          maxValue != null && !isNaN(maxValue) ? String(maxValue) : ""
        );
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

    const selectedIds =
      form
        .watch("dashboardMeasurements")
        ?.map((dm) => dm.dashboardMeasurementId) ?? [];

    return selectedIds
      .map((id) => allAvailable.find((dm) => dm.id === id))
      .filter((dm): dm is DashboardMeasurement => dm !== undefined);
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

    const selectedIds =
      form
        .watch("dashboardMeasurements")
        ?.map((dm) => dm.dashboardMeasurementId) ?? [];

    return allAvailable.filter((dm) => !selectedIds.includes(dm.id));
  }, [
    availableDashboardMeasurements,
    form.watch("dashboardMeasurements"),
    group,
  ]);

  const chartTimeRangeValue = form.watch("chartTimeRange");
  const chartMinValueValue = form.watch("chartMinValue");
  const chartMaxValueValue = form.watch("chartMaxValue");
  const chartMeasurementIdsValue = form.watch("chartMeasurementIds");

  const hasChartConfig =
    chartTimeRangeValue !== undefined ||
    chartMinValueValue !== undefined ||
    chartMaxValueValue !== undefined ||
    (chartMeasurementIdsValue?.length ?? 0) > 0;

  useEffect(() => {
    if (hasChartConfig && isChartConfigCleared) {
      setIsChartConfigCleared(false);
    }
  }, [hasChartConfig, isChartConfigCleared]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatMeasurementDisplay = (dm: DashboardMeasurement): string => {
    return `${dm.measurement.name} - ${dm.measurement.externalId} | ${dm.measurement.type} | ${dm.minValue ?? 0} - ${dm.maxValue ?? 100}`;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const currentMeasurements = form.getValues("dashboardMeasurements") ?? [];
    const oldIndex = currentMeasurements.findIndex(
      (dm) => dm.dashboardMeasurementId === Number(active.id)
    );
    const newIndex = currentMeasurements.findIndex(
      (dm) => dm.dashboardMeasurementId === Number(over.id)
    );

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    move(oldIndex, newIndex);
  };

  const handleAddMeasurement = (measurementId: number) => {
    append({ dashboardMeasurementId: measurementId });
  };

  const handleRemoveMeasurement = (dashboardMeasurementId: number) => {
    const currentMeasurements = form.getValues("dashboardMeasurements") ?? [];
    const indexToRemove = currentMeasurements.findIndex(
      (dm) => dm.dashboardMeasurementId === dashboardMeasurementId
    );

    if (indexToRemove !== -1) {
      const removedMeasurement = selectedDashboardMeasurements.find(
        (dm) => dm.id === dashboardMeasurementId
      );

      remove(indexToRemove);
      
      if (removedMeasurement) {
        const currentChartIds = form.getValues("chartMeasurementIds") ?? [];

        form.setValue(
          "chartMeasurementIds",
          currentChartIds.filter((id) => id !== removedMeasurement.measurementId)
        );
      }
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

  const handleClearChartConfig = () => {
    form.setValue("chartTimeRange", undefined);
    form.setValue("chartMinValue", undefined);
    form.setValue("chartMaxValue", undefined);
    form.setValue("chartMeasurementIds", []);
    setMinValueInput("");
    setMaxValueInput("");
    setIsChartConfigCleared(true);
  };

  const handleSubmit = form.handleSubmit(
    async (data) => {
      if (!group) return;

      try {
        clearAllErrors();

      // Preparar valores de gráfica solo si alguno tiene valor
      const chartTimeRangeValue =
        typeof data.chartTimeRange === "number"
          ? data.chartTimeRange
          : data.chartTimeRange
            ? Number(data.chartTimeRange)
            : undefined;

      const chartMinValue =
        typeof data.chartMinValue === "number" ? data.chartMinValue : undefined;
      const chartMaxValue =
        typeof data.chartMaxValue === "number" ? data.chartMaxValue : undefined;
      const chartMeasurementIds =
        data.chartMeasurementIds && data.chartMeasurementIds.length > 0
          ? data.chartMeasurementIds
          : undefined;

      // Solo incluir campos de gráfica si al menos uno tiene valor
      const hasChartConfig =
        chartTimeRangeValue !== undefined ||
        chartMinValue !== undefined ||
        chartMaxValue !== undefined ||
        chartMeasurementIds !== undefined;

      const submitData: UpdateDashboardMeasurementGroupData = {
        ...(data.name?.trim() ? { name: data.name.trim() } : {}),
        ...(data.dashboardMeasurements &&
        data.dashboardMeasurements.length > 0
          ? { dashboardMeasurements: data.dashboardMeasurements }
          : {}),
        ...(isChartConfigCleared
          ? {
              chartTimeRange: null,
              chartMinValue: null,
              chartMaxValue: null,
              chartMeasurementIds: [],
            }
          : hasChartConfig
            ? {
                ...(chartTimeRangeValue !== undefined
                  ? { chartTimeRange: chartTimeRangeValue }
                  : {}),
                ...(chartMinValue !== undefined
                  ? { chartMinValue }
                  : {}),
                ...(chartMaxValue !== undefined ? { chartMaxValue } : {}),
                ...(chartMeasurementIds !== undefined
                  ? { chartMeasurementIds }
                  : {}),
              }
            : {}),
      };

        await onSubmit(group.id, submitData);
        toast.success("Grupo actualizado exitosamente");
        onClose();
      } catch (error) {
        handleBackendError(error);
      }
    },
    (errors) => {
      // Manejar errores de validación del formulario
      console.error("Errores de validación:", errors);
      // Los errores ya se muestran automáticamente por react-hook-form
    }
  );

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
      footer={
        <div className="flex items-center justify-end gap-2">
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
      }
    >
      <div className="flex flex-col flex-1 min-h-0">
        <form
          className="flex-1 min-h-0 overflow-y-auto"
          onSubmit={handleSubmit}
        >
          {/* Errores de validación generales */}
          {modalError.validationErrors.length > 0 && (
            <ValidationErrorList errors={modalError.validationErrors} />
          )}

          {/* Error del servidor */}
          {modalError.serverError && (
            <ErrorMessage
              isServerError={modalError.parsedError?.isServerError ?? false}
              message={modalError.serverError}
              type="server"
            />
          )}

          <div className="mb-6">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre del Grupo"
                    labelPlacement="outside"
                    placeholder="Ej: Grupo de Temperaturas"
                    size="md"
                    startContent={<FaGaugeHigh className="text-slate-400" />}
                    type="text"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div className="mb-6">
            <Text className="mb-4" color="secondary" variant="small">
              Dashboard Measurements del Grupo
            </Text>

            {selectedDashboardMeasurements.length > 0 && (
              <DndContext
                collisionDetection={closestCenter}
                sensors={sensors}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedDashboardMeasurements.map((dm) => dm.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="mb-4 space-y-2 overflow-x-hidden">
                    {selectedDashboardMeasurements.map((dm) => (
                      <SortableMeasurementItem
                        key={dm.id}
                        measurement={dm}
                        displayText={formatMeasurementDisplay(dm)}
                        onRemove={handleRemoveMeasurement}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
            <CollapsibleSection
              title="Configuración de Gráfica en Tiempo Real"
              defaultExpanded={hasChartConfig}
              forceExpanded={hasChartConfig}
            >
              <div className="space-y-4">
                <div>
                  <Text className="mb-2 text-sm text-slate-300" variant="small">
                    Tiempo del Eje X (Rango de datos)
                  </Text>
                  <Controller
                    control={form.control}
                    name="chartTimeRange"
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          fullWidth
                          name={field.name}
                          value={field.value ? String(field.value) : ""}
                          onBlur={field.onBlur}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Convertir string vacío a undefined explícitamente
                            field.onChange(
                              value && value !== "" ? Number(value) : undefined
                            );
                          }}
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
                      control={form.control}
                      name="chartMinValue"
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            fullWidth
                            errorMessage={fieldState.error?.message}
                            isDisabled={isLoading}
                            isInvalid={!!fieldState.error}
                            label="Valor Mínimo (Eje Y)"
                            labelPlacement="outside"
                            name={field.name}
                            placeholder="0"
                            size="md"
                            type="number"
                            value={minValueInput}
                            variant="bordered"
                            onBlur={(e) => {
                              field.onBlur();
                              // Asegurar que el valor esté sincronizado al perder el foco
                              const value = e.target.value.trim();

                              if (value === "" || value === "-") {
                                setMinValueInput("");
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);

                                if (!isNaN(numValue) && isFinite(numValue)) {
                                  setMinValueInput(String(numValue));
                                  field.onChange(numValue);
                                } else {
                                  // Si no es válido, restaurar el valor anterior del form
                                  setMinValueInput(
                                    field.value != null
                                      ? String(field.value)
                                      : ""
                                  );
                                }
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;

                              setMinValueInput(value);
                              // Solo actualizar el form si el valor está completamente vacío o es un número válido
                              if (value === "" || value === "-") {
                                field.onChange(undefined);
                              } else {
                                // Intentar convertir a número solo si el string completo es un número válido
                                const trimmedValue = value.trim();

                                if (
                                  trimmedValue === "" ||
                                  trimmedValue === "-"
                                ) {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(trimmedValue);

                                  // Solo actualizar si es un número válido (no NaN) y el string original es válido
                                  if (
                                    !isNaN(numValue) &&
                                    isFinite(numValue) &&
                                    trimmedValue !== ""
                                  ) {
                                    field.onChange(numValue);
                                  }
                                  // Si no es válido, no actualizar el form (mantener el valor anterior)
                                }
                              }
                            }}
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
                      control={form.control}
                      name="chartMaxValue"
                      render={({ field, fieldState }) => (
                        <>
                          <Input
                            fullWidth
                            errorMessage={fieldState.error?.message}
                            isDisabled={isLoading}
                            isInvalid={!!fieldState.error}
                            label="Valor Máximo (Eje Y)"
                            labelPlacement="outside"
                            name={field.name}
                            placeholder="100"
                            size="md"
                            type="number"
                            value={maxValueInput}
                            variant="bordered"
                            onBlur={(e) => {
                              field.onBlur();
                              // Asegurar que el valor esté sincronizado al perder el foco
                              const value = e.target.value.trim();

                              if (value === "" || value === "-") {
                                setMaxValueInput("");
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);

                                if (!isNaN(numValue) && isFinite(numValue)) {
                                  setMaxValueInput(String(numValue));
                                  field.onChange(numValue);
                                } else {
                                  // Si no es válido, restaurar el valor anterior del form
                                  setMaxValueInput(
                                    field.value != null
                                      ? String(field.value)
                                      : ""
                                  );
                                }
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;

                              setMaxValueInput(value);
                              // Solo actualizar el form si el valor está completamente vacío o es un número válido
                              if (value === "" || value === "-") {
                                field.onChange(undefined);
                              } else {
                                // Intentar convertir a número solo si el string completo es un número válido
                                const trimmedValue = value.trim();

                                if (
                                  trimmedValue === "" ||
                                  trimmedValue === "-"
                                ) {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(trimmedValue);

                                  // Solo actualizar si es un número válido (no NaN) y el string original es válido
                                  if (
                                    !isNaN(numValue) &&
                                    isFinite(numValue) &&
                                    trimmedValue !== ""
                                  ) {
                                    field.onChange(numValue);
                                  }
                                  // Si no es válido, no actualizar el form (mantener el valor anterior)
                                }
                              }
                            }}
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
                        const chartIds =
                          form.watch("chartMeasurementIds") ?? [];

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
                              {dm.measurement.name} ({dm.measurement.externalId}
                              )
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
                {hasChartConfig && (
                  <div className="flex justify-end pt-2">
                    <Button
                      className="px-6 py-2 font-semibold"
                      color="danger"
                      size="md"
                      type="button"
                      variant="solid"
                      onPress={handleClearChartConfig}
                    >
                      Limpiar configuración
                    </Button>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        </form>
      </div>
    </Modal>
  );
};
