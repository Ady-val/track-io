import type React from "react";
import { useEffect, useMemo } from "react";
import { Controller } from "react-hook-form";

import {
  FaFloppyDisk,
  FaXmark,
  FaTag,
  FaCubesStacked,
  FaUsers,
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

import { useDepartments, type Department } from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createDeviceSignalSchema } from "@/lib/validations/schemas";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceSignalFormProps {
  deviceId: number;
  deviceName: string;
  externalValueId: string;
  onSubmit: (data: CreateDeviceSignalData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateDeviceSignalForm: React.FC<CreateDeviceSignalFormProps> = ({
  deviceId,
  deviceName,
  externalValueId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();

  const departments = useMemo(
    () => departmentsData?.data ?? [],
    [departmentsData?.data]
  );

  const { form, modalError, handleBackendError, clearAllErrors } =
    useFormValidation({
      schema: createDeviceSignalSchema,
      defaultValues: {
        name: "",
        deviceId,
        departmentId: undefined,
        externalValueId,
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Señal creada exitosamente",
    });

  // Establecer el primer departamento como valor por defecto si hay departamentos disponibles
  useEffect(() => {
    if (departments.length > 0 && !form.getValues("departmentId")) {
      form.setValue("departmentId", departments[0]?.id ?? 0);
    }
  }, [departments, form]);

  // Limpiar errores cuando se cancela
  useEffect(() => {
    return () => {
      clearAllErrors();
    };
  }, [clearAllErrors]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      clearAllErrors();
      await onSubmit({
        name: data.name.trim(),
        deviceId: data.deviceId,
        departmentId: data.departmentId,
        externalValueId: data.externalValueId,
      });
    } catch (error) {
      handleBackendError(error);
    }
  });

  return (
    <form onSubmit={handleSubmit}>
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

      {/* Device Info Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FaCubesStacked className="text-blue-400 text-sm" />
          <Text color="secondary" variant="small">
            Dispositivo
          </Text>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <Text className="font-medium">{deviceName}</Text>
          <Text color="muted" variant="caption">
            ID: #{deviceId}
          </Text>
        </div>
      </div>

      {/* External Value ID Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FaTag className="text-purple-400 text-sm" />
          <Text color="secondary" variant="small">
            External Value ID
          </Text>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <Text className="font-mono font-medium">{externalValueId}</Text>
        </div>
      </div>

      {/* Name Input */}
      <div className="mb-4">
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
                label="Nombre de la Señal"
                labelPlacement="outside"
                placeholder="Ej: Temperatura Principal"
                size="md"
                startContent={<FaTag className="text-slate-400" />}
                type="text"
                variant="bordered"
              />
              <FieldError error={fieldState.error?.message} fieldId="name" />
            </>
          )}
        />
      </div>

      {/* Department Select */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaUsers className="text-green-400 text-sm" />
          <Text color="secondary" variant="small">
            Departamento
          </Text>
        </div>
        <Controller
          name="departmentId"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Select
                {...field}
                fullWidth
                disabled={isLoading || departmentsLoading}
                isInvalid={!!fieldState.error}
                value={String(field.value ?? "")}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                {departments.map((department: Department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </Select>
              {departmentsLoading && (
                <Text className="mt-1" color="muted" variant="caption">
                  Cargando departamentos...
                </Text>
              )}
              <FieldError
                error={fieldState.error?.message}
                fieldId="departmentId"
              />
            </>
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-600">
        <Button
          className="px-6 py-2 font-semibold"
          color="default"
          disabled={isLoading}
          size="md"
          variant="solid"
          onPress={onCancel}
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
          type="submit"
          variant="solid"
        >
          <FaFloppyDisk className="mr-2" />
          Crear Señal
        </Button>
      </div>
    </form>
  );
};
