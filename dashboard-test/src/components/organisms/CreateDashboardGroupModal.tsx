import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Controller, useFieldArray } from "react-hook-form";
import { FaFloppyDisk, FaXmark, FaTrash, FaGaugeHigh } from "react-icons/fa6";

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
import { createDashboardMeasurementGroupSchema } from "@/lib/validations/schemas";
import type { DashboardMeasurement } from "@/types/dashboard";
import type { CreateDashboardMeasurementGroupData } from "@/types/dashboard-measurement-group";

import { Modal } from "./Modal";

export interface CreateDashboardGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDashboardMeasurementGroupData) => Promise<void>;
  isLoading?: boolean;
}

export const CreateDashboardGroupModal: React.FC<
  CreateDashboardGroupModalProps
> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
  const {
    data: availableDashboardMeasurements = [],
    loading: measurementsLoading,
    error: measurementsError,
  } = useAvailableDashboardMeasurements();

  const {
    form,
    modalError,
    handleBackendError,
    clearAllErrors,
    toast,
    resetForm,
  } = useFormValidation({
    schema: createDashboardMeasurementGroupSchema,
    defaultValues: {
      name: "",
      dashboardMeasurements: [],
      chartTimeRange: undefined,
      chartMinValue: undefined,
      chartMaxValue: undefined,
      chartMeasurementIds: [],
      chart2TimeRange: undefined,
      chart2MinValue: undefined,
      chart2MaxValue: undefined,
      chart2MeasurementIds: [],
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Grupo creado exitosamente",
  });

  const { append, remove } = useFieldArray({
    control: form.control,
    name: "dashboardMeasurements",
  });

  const prevIsOpenRef = useRef(isOpen);

  // Estados locales para los inputs numéricos (mejor UX)
  const [minValueInput, setMinValueInput] = useState<string>("");
  const [maxValueInput, setMaxValueInput] = useState<string>("");
  const [minValue2Input, setMinValue2Input] = useState<string>("");
  const [maxValue2Input, setMaxValue2Input] = useState<string>("");

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      resetForm({
        name: "",
        dashboardMeasurements: [],
        chartTimeRange: undefined,
        chartMinValue: undefined,
        chartMaxValue: undefined,
        chartMeasurementIds: [],
        chart2TimeRange: undefined,
        chart2MinValue: undefined,
        chart2MaxValue: undefined,
        chart2MeasurementIds: [],
      });
      // Limpiar estados locales
      setMinValueInput("");
      setMaxValueInput("");
      setMinValue2Input("");
      setMaxValue2Input("");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, resetForm]);

  const selectedDashboardMeasurements = useMemo(() => {
    const selectedIds = form
      .watch("dashboardMeasurements")
      .map((dm) => dm.dashboardMeasurementId);

    return availableDashboardMeasurements.filter((dm) =>
      selectedIds.includes(dm.id)
    );
  }, [availableDashboardMeasurements, form.watch("dashboardMeasurements")]);

  const availableForSelect = useMemo(() => {
    const selectedIds = form
      .watch("dashboardMeasurements")
      .map((dm) => dm.dashboardMeasurementId);

    return availableDashboardMeasurements.filter(
      (dm) => !selectedIds.includes(dm.id)
    );
  }, [availableDashboardMeasurements, form.watch("dashboardMeasurements")]);

  const formatMeasurementDisplay = (dm: DashboardMeasurement): string => {
    return `${dm.measurement.name} - ${dm.measurement.externalId} | ${dm.measurement.type} | ${dm.minValue ?? 0} - ${dm.maxValue ?? 100}`;
  };

  const handleAddMeasurement = (measurementId: number) => {
    append({ dashboardMeasurementId: measurementId });
  };

  const handleRemoveMeasurement = (index: number) => {
    remove(index);
    const removedId = selectedDashboardMeasurements[index]?.measurementId;

    if (removedId) {
      const currentChartIds = form.getValues("chartMeasurementIds") ?? [];
      const currentChart2Ids = form.getValues("chart2MeasurementIds") ?? [];

      form.setValue(
        "chartMeasurementIds",
        currentChartIds.filter((id) => id !== removedId)
      );
      form.setValue(
        "chart2MeasurementIds",
        currentChart2Ids.filter((id) => id !== removedId)
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

  const handleChart2MeasurementToggle = (measurementId: number) => {
    const currentIds = form.getValues("chart2MeasurementIds") ?? [];

    if (currentIds.includes(measurementId)) {
      form.setValue(
        "chart2MeasurementIds",
        currentIds.filter((id) => id !== measurementId)
      );
    } else {
      form.setValue("chart2MeasurementIds", [...currentIds, measurementId]);
    }
  };

  const chartTimeRangeValue = form.watch("chartTimeRange");
  const chartMinValueValue = form.watch("chartMinValue");
  const chartMaxValueValue = form.watch("chartMaxValue");
  const chartMeasurementIdsValue = form.watch("chartMeasurementIds");
  const chart2TimeRangeValue = form.watch("chart2TimeRange");
  const chart2MinValueValue = form.watch("chart2MinValue");
  const chart2MaxValueValue = form.watch("chart2MaxValue");
  const chart2MeasurementIdsValue = form.watch("chart2MeasurementIds");

  const hasChartConfig =
    chartTimeRangeValue !== undefined ||
    chartMinValueValue !== undefined ||
    chartMaxValueValue !== undefined ||
    (chartMeasurementIdsValue?.length ?? 0) > 0;
  const hasChart2Config =
    chart2TimeRangeValue !== undefined ||
    chart2MinValueValue !== undefined ||
    chart2MaxValueValue !== undefined ||
    (chart2MeasurementIdsValue?.length ?? 0) > 0;

  const handleClearChartConfig = () => {
    form.setValue("chartTimeRange", undefined);
    form.setValue("chartMinValue", undefined);
    form.setValue("chartMaxValue", undefined);
    form.setValue("chartMeasurementIds", []);
    setMinValueInput("");
    setMaxValueInput("");
  };

  const handleClearChart2Config = () => {
    form.setValue("chart2TimeRange", undefined);
    form.setValue("chart2MinValue", undefined);
    form.setValue("chart2MaxValue", undefined);
    form.setValue("chart2MeasurementIds", []);
    setMinValue2Input("");
    setMaxValue2Input("");
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      clearAllErrors();

      const hasChartConfig =
        data.chartTimeRange !== undefined ||
        data.chartMinValue !== undefined ||
        data.chartMaxValue !== undefined ||
        (data.chartMeasurementIds && data.chartMeasurementIds.length > 0);
      const hasChart2Config =
        data.chart2TimeRange !== undefined ||
        data.chart2MinValue !== undefined ||
        data.chart2MaxValue !== undefined ||
        (data.chart2MeasurementIds && data.chart2MeasurementIds.length > 0);

      const submitData: CreateDashboardMeasurementGroupData = {
        name: data.name.trim(),
        dashboardMeasurements: data.dashboardMeasurements,
        ...(hasChartConfig
          ? {
              chartTimeRange: data.chartTimeRange,
              chartMinValue: data.chartMinValue,
              chartMaxValue: data.chartMaxValue,
              chartMeasurementIds: data.chartMeasurementIds,
            }
          : {}),
        ...(hasChart2Config
          ? {
              chart2TimeRange: data.chart2TimeRange,
              chart2MinValue: data.chart2MinValue,
              chart2MaxValue: data.chart2MaxValue,
              chart2MeasurementIds: data.chart2MeasurementIds,
            }
          : {}),
      };

      await onSubmit(submitData);
      toast.success("Grupo creado exitosamente");
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  const handleClose = () => {
    resetForm({
      name: "",
      dashboardMeasurements: [],
      chartTimeRange: undefined,
      chartMinValue: undefined,
      chartMaxValue: undefined,
      chartMeasurementIds: [],
      chart2TimeRange: undefined,
      chart2MinValue: undefined,
      chart2MaxValue: undefined,
      chart2MeasurementIds: [],
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Crear Grupo de Dashboard Measurements"
      onClose={handleClose}
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
              <option value="">
                {measurementsLoading
                  ? "Cargando measurements..."
                  : measurementsError
                    ? "Error al cargar measurements"
                    : availableForSelect.length === 0
                      ? "No hay measurements disponibles"
                      : "Seleccionar dashboard measurement..."}
              </option>
              {availableForSelect.map((dm) => (
                <option key={dm.id} value={String(dm.id)}>
                  {formatMeasurementDisplay(dm)}
                </option>
              ))}
            </Select>
            {measurementsError && (
              <Text className="mt-1" color="danger" variant="caption">
                Error: {measurementsError}
              </Text>
            )}
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
                    control={form.control}
                    name="chartTimeRange"
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          fullWidth
                          value={field.value ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
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

          <div className="mb-6">
            <CollapsibleSection title="Configuración de Gráfica 2 en Tiempo Real">
              <div className="space-y-4">
                <div>
                  <Text className="mb-2 text-sm text-slate-300" variant="small">
                    Tiempo del Eje X (Rango de datos)
                  </Text>
                  <Controller
                    control={form.control}
                    name="chart2TimeRange"
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          fullWidth
                          value={field.value ? String(field.value) : ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number(e.target.value)
                                : undefined
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
                          fieldId="chart2TimeRange"
                        />
                      </>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Controller
                      control={form.control}
                      name="chart2MinValue"
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
                            value={minValue2Input}
                            variant="bordered"
                            onBlur={(e) => {
                              field.onBlur();
                              const value = e.target.value.trim();

                              if (value === "" || value === "-") {
                                setMinValue2Input("");
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);

                                if (!isNaN(numValue) && isFinite(numValue)) {
                                  setMinValue2Input(String(numValue));
                                  field.onChange(numValue);
                                } else {
                                  setMinValue2Input(
                                    field.value != null
                                      ? String(field.value)
                                      : ""
                                  );
                                }
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;

                              setMinValue2Input(value);
                              if (value === "" || value === "-") {
                                field.onChange(undefined);
                              } else {
                                const trimmedValue = value.trim();

                                if (
                                  trimmedValue === "" ||
                                  trimmedValue === "-"
                                ) {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(trimmedValue);

                                  if (
                                    !isNaN(numValue) &&
                                    isFinite(numValue) &&
                                    trimmedValue !== ""
                                  ) {
                                    field.onChange(numValue);
                                  }
                                }
                              }
                            }}
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId="chart2MinValue"
                          />
                        </>
                      )}
                    />
                  </div>
                  <div>
                    <Controller
                      control={form.control}
                      name="chart2MaxValue"
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
                            value={maxValue2Input}
                            variant="bordered"
                            onBlur={(e) => {
                              field.onBlur();
                              const value = e.target.value.trim();

                              if (value === "" || value === "-") {
                                setMaxValue2Input("");
                                field.onChange(undefined);
                              } else {
                                const numValue = Number(value);

                                if (!isNaN(numValue) && isFinite(numValue)) {
                                  setMaxValue2Input(String(numValue));
                                  field.onChange(numValue);
                                } else {
                                  setMaxValue2Input(
                                    field.value != null
                                      ? String(field.value)
                                      : ""
                                  );
                                }
                              }
                            }}
                            onChange={(e) => {
                              const value = e.target.value;

                              setMaxValue2Input(value);
                              if (value === "" || value === "-") {
                                field.onChange(undefined);
                              } else {
                                const trimmedValue = value.trim();

                                if (
                                  trimmedValue === "" ||
                                  trimmedValue === "-"
                                ) {
                                  field.onChange(undefined);
                                } else {
                                  const numValue = Number(trimmedValue);

                                  if (
                                    !isNaN(numValue) &&
                                    isFinite(numValue) &&
                                    trimmedValue !== ""
                                  ) {
                                    field.onChange(numValue);
                                  }
                                }
                              }
                            }}
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId="chart2MaxValue"
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
                          form.watch("chart2MeasurementIds") ?? [];

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
                                handleChart2MeasurementToggle(measurementId)
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
                {hasChart2Config && (
                  <div className="flex justify-end pt-2">
                    <Button
                      className="px-6 py-2 font-semibold"
                      color="danger"
                      size="md"
                      type="button"
                      variant="solid"
                      onPress={handleClearChart2Config}
                    >
                      Limpiar configuración
                    </Button>
                  </div>
                )}
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
            Crear Grupo
          </Button>
        </div>
      </div>
    </Modal>
  );
};
