import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { FaFloppyDisk, FaXmark } from "react-icons/fa6";

import {
  Button,
  Input,
  Select,
  ErrorMessage,
  ValidationErrorList,
  Label,
} from "@components/atoms";
import { FieldError } from "@components/molecules";
import { Modal } from "./Modal";

import { useFormValidation } from "@/hooks/useFormValidation";
import {
  updateDashboardMeasurementWithMeasurementSchema,
} from "@/lib/validations/schemas";
import type {
  UpdateDashboardMeasurementWithMeasurementData,
} from "@/types/dashboard-measurement";
import type { DashboardMeasurement } from "@/types/dashboard";
import type { MeasurementType } from "@/types/dashboard";
import { useDashboardMeasurementGroups } from "@/hooks/useDashboardMeasurementGroups";

type FormMeasurementType = "temperature" | "humidity" | "dew_point" | "ppm" | "pressure" | "level" | "flow" | "vibration" | "status";

const measurementTypeOptions = [
  { value: "temperature", label: "Temperatura" },
  { value: "humidity", label: "Humedad" },
  { value: "dew_point", label: "Dew Point" },
  { value: "ppm", label: "PPM" },
  { value: "pressure", label: "Presión" },
  { value: "level", label: "Nivel" },
  { value: "flow", label: "Flujo" },
  { value: "vibration", label: "Vibración" },
  { value: "status", label: "Estado (ON/OFF)" },
];

export interface EditDashboardMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    id: number,
    data: UpdateDashboardMeasurementWithMeasurementData
  ) => Promise<void>;
  isLoading?: boolean;
  dashboard: DashboardMeasurement | null;
}

export const EditDashboardMeasurementModal: React.FC<
  EditDashboardMeasurementModalProps
> = ({ isOpen, onClose, onSubmit, isLoading = false, dashboard }) => {
  const { groups } = useDashboardMeasurementGroups();
  const [minValueInput, setMinValueInput] = useState<string>("");
  const [maxValueInput, setMaxValueInput] = useState<string>("");

  const {
    form,
    modalError,
    handleBackendError,
    clearAllErrors,
    toast,
    resetForm,
  } = useFormValidation({
    schema: updateDashboardMeasurementWithMeasurementSchema,
    defaultValues: {
      externalId: dashboard?.measurement?.externalId ?? "",
      name: dashboard?.measurement?.name ?? "",
      type: (dashboard?.measurement?.type ?? "status") as FormMeasurementType,
      groupId: (dashboard as DashboardMeasurement & { groupId?: number | null })?.groupId ?? null,
      minValue: dashboard?.minValue ?? undefined,
      maxValue: dashboard?.maxValue ?? undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Dashboard measurement actualizado exitosamente",
  });

  const prevIsOpenRef = useRef(isOpen);

  // Helper function to format number without unnecessary decimals
  const formatNumberValue = (value: number | undefined | null): string => {
    if (value === undefined || value === null) return "";
    // Convert to number to handle string inputs
    const num = Number(value);
    if (Number.isNaN(num)) return "";
    
    // Check if the number is effectively an integer (handles 0.0, 1.0, etc.)
    // Use a small epsilon to handle floating point precision issues
    if (Math.abs(num % 1) < 0.0001) {
      return String(Math.round(num));
    }
    // Otherwise return with decimals (only if it actually has decimals)
    return String(value);
  };

  useEffect(() => {
    if (dashboard && isOpen && !prevIsOpenRef.current) {
      resetForm({
        externalId: dashboard.measurement.externalId,
        name: dashboard.measurement.name,
        type: dashboard.measurement.type as FormMeasurementType,
        groupId: (dashboard as DashboardMeasurement & { groupId?: number | null }).groupId ?? null,
        minValue: dashboard.minValue,
        maxValue: dashboard.maxValue,
      });
      // Format numbers without unnecessary decimals
      // Force formatting by converting to number first to handle cases like 0.0, 1.0
      const minVal = dashboard.minValue != null ? Number(dashboard.minValue) : null;
      const maxVal = dashboard.maxValue != null ? Number(dashboard.maxValue) : null;
      
      setMinValueInput(minVal != null ? formatNumberValue(minVal) : "");
      setMaxValueInput(maxVal != null ? formatNumberValue(maxVal) : "");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, dashboard, resetForm]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!dashboard) return;
    try {
      clearAllErrors();
      const payload: UpdateDashboardMeasurementWithMeasurementData = {
        externalId: data.externalId?.trim() || undefined,
        name: data.name?.trim() || undefined,
        type: data.type,
        groupId:
          data.groupId === null || data.groupId === undefined
            ? null
            : Number(data.groupId),
        minValue:
          data.minValue !== undefined ? Number(data.minValue) : undefined,
        maxValue:
          data.maxValue !== undefined ? Number(data.maxValue) : undefined,
      };
      await onSubmit(dashboard.id, payload);
      toast.success("Dashboard measurement actualizado exitosamente");
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  if (!dashboard) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Editar Dashboard Measurement"
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {modalError.validationErrors.length > 0 && (
          <ValidationErrorList errors={modalError.validationErrors} />
        )}
        {modalError.serverError && (
          <ErrorMessage
            isServerError={modalError.parsedError?.isServerError ?? false}
            message={modalError.serverError}
            type="server"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Controller
              control={form.control}
              name="externalId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    label="External ID"
                    labelPlacement="outside"
                    placeholder="TEST-001"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="externalId"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Secadora 4"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError error={fieldState.error?.message} fieldId="name" />
                </>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <>
                  <Label htmlFor="type" className="mb-1">
                    Tipo de Measurement
                  </Label>
                  <Select
                    fullWidth
                    id="type"
                    isInvalid={!!fieldState.error}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value as MeasurementType)}
                  >
                    {measurementTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                  <FieldError error={fieldState.error?.message} fieldId="type" />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={form.control}
              name="groupId"
              render={({ field }) => (
                <>
                  <Label htmlFor="groupId" className="mb-1">
                    Grupo
                  </Label>
                  <Select
                    fullWidth
                    id="groupId"
                    value={
                      field.value === null || field.value === undefined
                        ? ""
                        : String(field.value)
                    }
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!value) {
                        field.onChange(null);
                      } else {
                        field.onChange(Number(value));
                      }
                    }}
                  >
                    <option value="">Sin grupo</option>
                    {groups.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name}
                      </option>
                    ))}
                  </Select>
                </>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Controller
              control={form.control}
              name="minValue"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    fullWidth
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    label="Valor Mínimo"
                    labelPlacement="outside"
                    placeholder="0"
                    size="md"
                    type="number"
                    step="1"
                    value={minValueInput}
                    variant="bordered"
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === "" || value === "-") {
                        setMinValueInput("");
                        field.onChange(undefined);
                      } else {
                        const num = Number(value);
                        if (!Number.isNaN(num)) {
                          // Format the value to remove unnecessary decimals
                          const formatted = formatNumberValue(num);
                          setMinValueInput(formatted);
                          field.onChange(num);
                        }
                      }
                    }}
                    onChange={(e) => {
                      setMinValueInput(e.target.value);
                      const num = Number(e.target.value);
                      if (!Number.isNaN(num)) field.onChange(num);
                    }}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="minValue"
                  />
                </>
              )}
            />
          </div>
          <div>
            <Controller
              control={form.control}
              name="maxValue"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    fullWidth
                    isDisabled={isLoading}
                    isInvalid={!!fieldState.error}
                    label="Valor Máximo"
                    labelPlacement="outside"
                    placeholder="100"
                    size="md"
                    type="number"
                    step="1"
                    value={maxValueInput}
                    variant="bordered"
                    onBlur={(e) => {
                      const value = e.target.value.trim();
                      if (value === "" || value === "-") {
                        setMaxValueInput("");
                        field.onChange(undefined);
                      } else {
                        const num = Number(value);
                        if (!Number.isNaN(num)) {
                          // Format the value to remove unnecessary decimals
                          const formatted = formatNumberValue(num);
                          setMaxValueInput(formatted);
                          field.onChange(num);
                        }
                      }
                    }}
                    onChange={(e) => {
                      setMaxValueInput(e.target.value);
                      const num = Number(e.target.value);
                      if (!Number.isNaN(num)) field.onChange(num);
                    }}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="maxValue"
                  />
                </>
              )}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
            disabled={form.formState.isSubmitting}
            size="md"
            variant="solid"
            onPress={onClose}
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
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
};


