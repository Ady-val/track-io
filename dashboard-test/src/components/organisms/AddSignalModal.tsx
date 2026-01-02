import type { Device } from "../../types/device";

import React, { useEffect, useMemo, useRef } from "react";
import { Controller } from "react-hook-form";

import { FaMicrochip } from "react-icons/fa";

import { useDepartments } from "../../hooks/useCatalogs";
import { useFormValidation } from "../../hooks/useFormValidation";
import { createDeviceSignalSchema } from "../../lib/validations/schemas";
import deviceSignalService from "../../lib/services/device-signal.service";
import {
  Button,
  Input,
  Select,
  ErrorMessage,
  ValidationErrorList,
} from "../atoms";
import { FieldError } from "../molecules";

import { Modal } from "./Modal";

interface AddSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: Device | null;
}

export const AddSignalModal: React.FC<AddSignalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const { data: departmentsData } = useDepartments();
  const departments = useMemo(
    () => departmentsData?.data ?? [],
    [departmentsData?.data]
  );

  const { form, modalError, handleBackendError, resetForm, toast } =
    useFormValidation({
      schema: createDeviceSignalSchema,
      defaultValues: {
        name: "",
        deviceId: device?.id ?? 0,
        departmentId: undefined,
        externalValueId: "",
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Señal creada exitosamente",
    });

  const prevIsOpenRef = useRef(isOpen);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && device && !prevIsOpenRef.current) {
      resetForm({
        name: "",
        deviceId: device.id,
        departmentId: departments[0]?.id ?? undefined,
        externalValueId: "",
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, device, departments, resetForm]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!device) return;

    try {
      await deviceSignalService.create({
        name: data.name.trim(),
        deviceId: data.deviceId,
        departmentId: data.departmentId,
        externalValueId: data.externalValueId,
      });
      toast.success("Señal creada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  if (!device) return null;

  return (
    <Modal
      data-cy="add-signal-modal"
      isOpen={isOpen}
      size="md"
      title="Agregar Señal al Dispositivo"
      onClose={onClose}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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

        <div className="flex items-center space-x-2 mb-4">
          <FaMicrochip className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-slate-200">
            Nueva Señal para {device.name}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    id="signal-name"
                    label="Nombre del Botón"
                    labelPlacement="outside"
                    placeholder="Ej: Botón 1"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="signal-name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              name="externalValueId"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    isInvalid={!!fieldState.error}
                    errorMessage={fieldState.error?.message}
                    id="signal-external-value"
                    label="External Value ID"
                    labelPlacement="outside"
                    placeholder="Ej: 432"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="signal-external-value"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              name="departmentId"
              control={form.control}
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="signal-department"
                  >
                    Departamento
                  </label>
                  <Select
                    id="signal-department"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar departamento</option>
                    {departments.map((dept: { id: number; name: string }) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="signal-department"
                  />
                </>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
            disabled={form.formState.isSubmitting}
            size="md"
            type="button"
            variant="solid"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="px-6 py-2 font-semibold"
            color="primary"
            disabled={form.formState.isSubmitting}
            isLoading={form.formState.isSubmitting}
            size="md"
            type="submit"
            variant="solid"
          >
            Crear Señal
          </Button>
        </div>
      </form>
    </Modal>
  );
};
