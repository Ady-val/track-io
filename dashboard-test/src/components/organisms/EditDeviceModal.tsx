import type { Device, UpdateDeviceData } from "../../types/device";

import React, { useEffect, useRef } from "react";

import { Controller } from "react-hook-form";
import { FaMicrochip, FaDesktop } from "react-icons/fa";

import { useFormValidation } from "../../hooks/useFormValidation";
import deviceService from "../../lib/services/device.service";
import { updateDeviceSchema } from "../../lib/validations/schemas";
import {
  Button,
  Checkbox,
  Input,
  ErrorMessage,
  ValidationErrorList,
} from "../atoms";
import { FieldError } from "../molecules";

import { Modal } from "./Modal";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: Device | null;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const { form, modalError, handleBackendError, resetForm, toast } =
    useFormValidation({
      schema: updateDeviceSchema,
      defaultValues: {
        name: device?.name ?? "",
        externalId: device?.externalId ?? "",
        isVirtualDevice: device?.isVirtualDevice ?? false,
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Dispositivo actualizado exitosamente",
    });

  const prevIsOpenRef = useRef(isOpen);

  // Actualizar valores cuando se abre el modal
  useEffect(() => {
    if (device && isOpen && !prevIsOpenRef.current) {
      resetForm({
        name: device.name,
        externalId: device.externalId,
        isVirtualDevice: device.isVirtualDevice,
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, device, resetForm]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!device) return;

    try {
      const deviceData: UpdateDeviceData = {
        name: data.name?.trim() ?? device.name,
        externalId: data.externalId?.trim() ?? device.externalId,
        isVirtualDevice: data.isVirtualDevice ?? device.isVirtualDevice,
      };

      await deviceService.update(device.id, deviceData);
      toast.success("Dispositivo actualizado exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  if (!device) return null;

  return (
    <Modal
      data-cy="edit-device-modal"
      isOpen={isOpen}
      size="md"
      title="Editar Dispositivo"
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
          <FaMicrochip className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-200">
            Información del Dispositivo
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
                    id="edit-device-name"
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!fieldState.error}
                    label="Nombre del Dispositivo"
                    labelPlacement="outside"
                    placeholder="Ej: Controlador Principal"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="edit-device-name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={form.control}
              name="externalId"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    id="edit-device-external-id"
                    isDisabled={form.formState.isSubmitting}
                    isInvalid={!!fieldState.error}
                    label="External ID"
                    labelPlacement="outside"
                    placeholder="Ej: CTR-1433"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="edit-device-external-id"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Input
              disabled
              fullWidth
              isDisabled
              id="edit-device-area"
              label="Área (No editable)"
              labelPlacement="outside"
              size="md"
              value={device.areaName}
              variant="bordered"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FaDesktop className="text-purple-400 text-sm" />
              <span className="text-sm font-medium text-slate-300">
                Tipo de Dispositivo
              </span>
            </div>
            <Controller
              control={form.control}
              name="isVirtualDevice"
              render={({ field }) => (
                <Checkbox
                  color="primary"
                  isSelected={field.value ?? false}
                  size="md"
                  onValueChange={field.onChange}
                >
                  <span className="text-sm text-slate-400">
                    Dispositivo Virtual (para computadora)
                  </span>
                </Checkbox>
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
