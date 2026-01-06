import type { Device } from "../../types/device";
import type { DeviceSignal } from "../../types/device-signal";

import React, { useEffect, useRef } from "react";

import { Controller } from "react-hook-form";
import { FaMicrochip } from "react-icons/fa";

import { useDepartments, type Department } from "../../hooks/useCatalogs";
import { useFormValidation } from "../../hooks/useFormValidation";
import deviceSignalService from "../../lib/services/device-signal.service";
import { updateDeviceSignalSchema } from "../../lib/validations/schemas";
import {
  Button,
  Input,
  Select,
  ErrorMessage,
  ValidationErrorList,
} from "../atoms";
import { FieldError } from "../molecules";

import { Modal } from "./Modal";

interface EditSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signal: DeviceSignal | null;
  device: Device | null;
}

export const EditSignalModal: React.FC<EditSignalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  signal,
  device,
}) => {
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data ?? [];

  const { form, modalError, handleBackendError, resetForm, toast } =
    useFormValidation({
      schema: updateDeviceSignalSchema,
      defaultValues: {
        name: signal?.name ?? "",
        externalValueId: signal?.externalValueId ?? "",
        departmentId: signal?.departmentId ?? undefined,
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Señal actualizada exitosamente",
    });

  const prevIsOpenRef = useRef(isOpen);

  // Actualizar valores cuando se abre el modal
  useEffect(() => {
    if (signal && isOpen && !prevIsOpenRef.current) {
      resetForm({
        name: signal.name,
        externalValueId: signal.externalValueId,
        departmentId: signal.departmentId,
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [signal, isOpen, resetForm]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!signal) return;

    try {
      await deviceSignalService.update(signal.id, {
        name: data.name?.trim() ?? signal.name,
        externalValueId: data.externalValueId?.trim() ?? signal.externalValueId,
        departmentId: data.departmentId ?? signal.departmentId,
      });
      toast.success("Señal actualizada exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  if (!signal || !device) return null;

  return (
    <Modal
      data-cy="edit-signal-modal"
      isOpen={isOpen}
      size="md"
      title="Editar Señal"
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
            isServerError={modalError.parsedError?.isServerError ?? false}
            message={modalError.serverError}
            type="server"
          />
        )}

        <div className="flex items-center space-x-2 mb-4">
          <FaMicrochip className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-slate-200">
            Editar Señal de {device.name}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
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
                    id="edit-signal-name"
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!fieldState.error}
                    label="Nombre del Botón"
                    labelPlacement="outside"
                    placeholder="Ej: Botón 1"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="edit-signal-name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={form.control}
              name="externalValueId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    id="edit-signal-external-value"
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!fieldState.error}
                    label="External Value ID"
                    labelPlacement="outside"
                    placeholder="Ej: 432"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="edit-signal-external-value"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={form.control}
              name="departmentId"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="edit-signal-department"
                  >
                    Departamento
                  </label>
                  <Select
                    id="edit-signal-department"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar departamento</option>
                    {departments.map((dept: Department) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="edit-signal-department"
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
            Guardar Cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
};
