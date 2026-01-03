import type React from "react";
import { useEffect } from "react";
import { Controller } from "react-hook-form";

import {
  FaFloppyDisk,
  FaXmark,
  FaTag,
  FaLocationDot,
  FaDesktop,
} from "react-icons/fa6";

import {
  Button,
  Input,
  Select,
  Text,
  Checkbox,
  ErrorMessage,
  ValidationErrorList,
} from "@components/atoms";
import { FieldError } from "@components/molecules";

import { useAreas } from "@/hooks/useAreas";
import { useFormValidation } from "@/hooks/useFormValidation";
import { createDeviceSchema } from "@/lib/validations/schemas";
import type { CreateDeviceData } from "@/types/device";

export interface CreateDeviceFormProps {
  externalId: string;
  onSubmit: (data: CreateDeviceData) => Promise<void> | void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateDeviceForm: React.FC<CreateDeviceFormProps> = ({
  externalId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { areas, loading: areasLoading } = useAreas();
  const { form, modalError, handleBackendError, clearAllErrors } =
    useFormValidation({
      schema: createDeviceSchema,
      defaultValues: {
        name: "",
        areaId: undefined,
        externalId,
        isVirtualDevice: false,
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Dispositivo creado exitosamente",
    });

  // Establecer el primer área como valor por defecto si hay áreas disponibles
  useEffect(() => {
    if (areas.length > 0 && !form.getValues("areaId")) {
      form.setValue("areaId", areas[0]?.id ?? 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areas]);

  // Limpiar errores cuando se desmonta el componente
  useEffect(() => {
    return () => {
      clearAllErrors();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      clearAllErrors();
      await onSubmit({
        externalId: data.externalId,
        name: data.name.trim(),
        areaId: data.areaId,
        isVirtualDevice: data.isVirtualDevice ?? false,
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

      {/* External ID Display */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FaTag className="text-blue-400 text-sm" />
          <Text color="secondary" variant="small">
            External ID
          </Text>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
          <Text className="font-mono font-medium">{externalId}</Text>
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
                label="Nombre del Dispositivo"
                labelPlacement="outside"
                placeholder="Ej: Sensor Principal de Temperatura"
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

      {/* Area Select */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <FaLocationDot className="text-green-400 text-sm" />
          <Text color="secondary" variant="small">
            Área
          </Text>
        </div>
        <Controller
          name="areaId"
          control={form.control}
          render={({ field, fieldState }) => (
            <>
              <Select
                {...field}
                fullWidth
                disabled={isLoading || areasLoading}
                isInvalid={!!fieldState.error}
                value={String(field.value ?? "")}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
              {areasLoading && (
                <Text className="mt-1" color="muted" variant="caption">
                  Cargando áreas...
                </Text>
              )}
              <FieldError error={fieldState.error?.message} fieldId="areaId" />
            </>
          )}
        />
      </div>

      {/* Virtual Device Checkbox */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaDesktop className="text-purple-400 text-sm" />
          <Text color="secondary" variant="small">
            Tipo de Dispositivo
          </Text>
        </div>
        <Controller
          name="isVirtualDevice"
          control={form.control}
          render={({ field }) => (
            <Checkbox
              color="primary"
              isSelected={field.value ?? false}
              size="md"
              onValueChange={field.onChange}
            >
              <Text color="secondary" variant="small">
                Dispositivo Virtual (para computadora)
              </Text>
            </Checkbox>
          )}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-600">
        <Button
          color="default"
          disabled={isLoading}
          size="md"
          variant="solid"
          onPress={onCancel}
          className="px-6 py-2 font-semibold"
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
          className="px-6 py-2 font-semibold"
        >
          <FaFloppyDisk className="mr-2" />
          Crear Dispositivo
        </Button>
      </div>
    </form>
  );
};
