import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { FaFloppyDisk, FaXmark } from "react-icons/fa6";

import {
  Button,
  Input,
  Select,
  Text,
  ErrorMessage,
  ValidationErrorList,
  Label,
} from "@components/atoms";
import { FieldError } from "@components/molecules";
import { Modal } from "./Modal";

import { useFormValidation } from "@/hooks/useFormValidation";
import {
  createDashboardMeasurementWithMeasurementSchema,
} from "@/lib/validations/schemas";
import type {
  CreateDashboardMeasurementWithMeasurementData,
} from "@/types/dashboard-measurement";
import type { MeasurementType } from "@/types/dashboard";
import { useDashboardMeasurementGroups } from "@/hooks/useDashboardMeasurementGroups";

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

export interface CreateDashboardMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: CreateDashboardMeasurementWithMeasurementData
  ) => Promise<void>;
  isLoading?: boolean;
}

export const CreateDashboardMeasurementModal: React.FC<
  CreateDashboardMeasurementModalProps
> = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
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
    schema: createDashboardMeasurementWithMeasurementSchema,
    defaultValues: {
      externalId: "",
      name: "",
      type: "status",
      groupId: null,
      minValue: 0,
      maxValue: 100,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Dashboard measurement creado exitosamente",
  });

  const prevIsOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      resetForm({
        externalId: "",
        name: "",
        type: "status",
        groupId: null,
        minValue: 0,
        maxValue: 100,
      });
      setMinValueInput("0");
      setMaxValueInput("100");
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, resetForm]);

  // Helper function to format number without unnecessary decimals
  const formatNumberValue = (value: number | undefined): string => {
    if (value === undefined || value === null) return "";
    // Check if the number is an integer
    if (Number.isInteger(value)) {
      return String(value);
    }
    // Otherwise return with decimals
    return String(value);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      clearAllErrors();
      const payload: CreateDashboardMeasurementWithMeasurementData = {
        externalId: data.externalId.trim(),
        name: data.name.trim(),
        type: data.type,
        groupId:
          data.groupId === null || data.groupId === undefined
            ? null
            : Number(data.groupId),
        minValue: Number(data.minValue),
        maxValue: Number(data.maxValue),
      };
      await onSubmit(payload);
      toast.success("Dashboard measurement creado exitosamente");
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  const handleClose = () => {
    resetForm({
      externalId: "",
      name: "",
      type: "status",
      groupId: null,
      minValue: 0,
      maxValue: 100,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Crear Dashboard Measurement"
      onClose={handleClose}
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
                    value={field.value}
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
                        field.onChange(0);
                      } else {
                        const num = Number(value);
                        if (!Number.isNaN(num)) {
                          // Format without unnecessary decimals
                          setMinValueInput(formatNumberValue(num));
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
                        field.onChange(100);
                      } else {
                        const num = Number(value);
                        if (!Number.isNaN(num)) {
                          // Format without unnecessary decimals
                          setMaxValueInput(formatNumberValue(num));
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
            Crear
          </Button>
        </div>
      </form>
    </Modal>
  );
};


