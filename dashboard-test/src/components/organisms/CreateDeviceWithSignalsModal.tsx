import type {
  CreateDeviceData,
  CreateDeviceSignalData,
} from "../../types/device";

import React, { useEffect, useRef } from "react";
import { Controller, useFieldArray } from "react-hook-form";

import { FaMicrochip, FaPlus, FaTrash, FaDesktop } from "react-icons/fa";

import { useAreas } from "../../hooks/useAreas";
import { useDepartments } from "../../hooks/useCatalogs";
import { useFormValidation } from "../../hooks/useFormValidation";
import { createDeviceWithSignalsSchema } from "../../lib/validations/schemas";
import deviceSignalService from "../../lib/services/device-signal.service";
import deviceService from "../../lib/services/device.service";
import {
  Button,
  Checkbox,
  Input,
  Select,
  ErrorMessage,
  ValidationErrorList,
} from "../atoms";
import { FieldError } from "../molecules";

import { Modal } from "./Modal";

interface CreateDeviceWithSignalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateDeviceWithSignalsModal: React.FC<
  CreateDeviceWithSignalsModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const { areas } = useAreas();
  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data ?? [];

  const { form, modalError, handleBackendError, resetForm, toast } =
    useFormValidation({
      schema: createDeviceWithSignalsSchema,
      defaultValues: {
        name: "",
        externalId: "",
        areaId: areas[0]?.id?.toString() ?? "",
        isVirtualDevice: false,
        signals: [{ name: "", externalValueId: "", departmentId: "" }],
      },
      showToastOnError: true,
      showToastOnSuccess: true,
      successMessage: "Dispositivo y señales creados exitosamente",
    });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "signals",
  });

  const prevIsOpenRef = useRef(isOpen);

  // Resetear formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      resetForm({
        name: "",
        externalId: "",
        areaId: areas[0]?.id?.toString() ?? "",
        isVirtualDevice: false,
        signals: [{ name: "", externalValueId: "", departmentId: "" }],
      });
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, areas, resetForm]);

  const addSignal = () => {
    append({ name: "", externalValueId: "", departmentId: "" });
  };

  const removeSignal = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Crear dispositivo
      const deviceData: CreateDeviceData = {
        name: data.name.trim(),
        externalId: data.externalId.trim(),
        areaId: data.areaId,
        isVirtualDevice: data.isVirtualDevice ?? false,
      };

      const newDevice = await deviceService.create(deviceData);

      if (!newDevice) {
        throw new Error("No se pudo crear el dispositivo");
      }

      // Crear señales
      const validSignals = data.signals.filter(
        (signal) => signal.name && signal.externalValueId && signal.departmentId
      );

      for (const signal of validSignals) {
        const signalData: CreateDeviceSignalData = {
          name: signal.name.trim(),
          deviceId: newDevice.id,
          departmentId: signal.departmentId,
          externalValueId: signal.externalValueId.trim(),
        };

        await deviceSignalService.create(signalData);
      }

      toast.success("Dispositivo y señales creados exitosamente");
      onSuccess();
      onClose();
    } catch (error) {
      handleBackendError(error);
    }
  });

  return (
    <Modal
      data-cy="create-device-modal"
      isOpen={isOpen}
      size="lg"
      title="Agregar Dispositivo y Señales"
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

          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FaMicrochip className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-slate-200">
                Información del Dispositivo
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        id="device-name"
                        label="Nombre del Dispositivo"
                        labelPlacement="outside"
                        placeholder="Ej: Controlador Principal"
                        size="md"
                        variant="bordered"
                      />
                      <FieldError
                        error={fieldState.error?.message}
                        fieldId="device-name"
                      />
                    </>
                  )}
                />
              </div>

              <div>
                <Controller
                  name="externalId"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <Input
                        {...field}
                        fullWidth
                        isInvalid={!!fieldState.error}
                        errorMessage={fieldState.error?.message}
                        id="device-external-id"
                        label="External ID"
                        labelPlacement="outside"
                        placeholder="Ej: CTR-1433"
                        size="md"
                        variant="bordered"
                      />
                      <FieldError
                        error={fieldState.error?.message}
                        fieldId="device-external-id"
                      />
                    </>
                  )}
                />
              </div>
            </div>

            <div>
              <Controller
                name="areaId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <>
                    <label
                      className="block text-sm font-medium text-slate-300 mb-2"
                      htmlFor="device-area"
                    >
                      Área
                    </label>
                    <Select
                      id="device-area"
                      isInvalid={!!fieldState.error}
                      value={String(field.value ?? "")}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">Seleccionar área</option>
                      {areas.map((area: { id: number; name: string }) => (
                        <option key={area.id} value={area.id}>
                          {area.name}
                        </option>
                      ))}
                    </Select>
                    <FieldError
                      error={fieldState.error?.message}
                      fieldId="device-area"
                    />
                  </>
                )}
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
                name="isVirtualDevice"
                control={form.control}
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FaMicrochip className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-slate-200">
                  Señales del Dispositivo
                </h3>
              </div>
              <Button
                className="flex items-center space-x-2 font-semibold"
                color="primary"
                size="md"
                type="button"
                variant="solid"
                onPress={addSignal}
              >
                <FaPlus className="w-4 h-4" />
                <span>Agregar Señal</span>
              </Button>
            </div>

            {fields.map((field, index) => (
              <div
                key={field.id}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-slate-200">
                    Señal {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <Button
                      className="flex items-center space-x-1 font-semibold"
                      color="danger"
                      size="md"
                      type="button"
                      variant="solid"
                      onPress={() => removeSignal(index)}
                    >
                      <FaTrash className="w-3 h-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="min-w-0">
                    <Controller
                      name={`signals.${index}.name`}
                      control={form.control}
                      render={({ field: signalField, fieldState }) => (
                        <>
                          <label
                            className="block text-sm font-medium text-slate-300 mb-2"
                            htmlFor={`signal-name-${index}`}
                          >
                            Nombre del Botón
                          </label>
                          <Input
                            {...signalField}
                            className="w-full"
                            id={`signal-name-${index}`}
                            isInvalid={!!fieldState.error}
                            placeholder="Ej: Botón 1"
                            size="md"
                            variant="bordered"
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId={`signal-name-${index}`}
                          />
                        </>
                      )}
                    />
                  </div>

                  <div className="min-w-0">
                    <Controller
                      name={`signals.${index}.externalValueId`}
                      control={form.control}
                      render={({ field: signalField, fieldState }) => (
                        <>
                          <label
                            className="block text-sm font-medium text-slate-300 mb-2"
                            htmlFor={`signal-external-value-${index}`}
                          >
                            External Value ID
                          </label>
                          <Input
                            {...signalField}
                            className="w-full"
                            id={`signal-external-value-${index}`}
                            isInvalid={!!fieldState.error}
                            placeholder="Ej: 432"
                            size="md"
                            variant="bordered"
                          />
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId={`signal-external-value-${index}`}
                          />
                        </>
                      )}
                    />
                  </div>

                  <div className="min-w-0">
                    <Controller
                      name={`signals.${index}.departmentId`}
                      control={form.control}
                      render={({ field: signalField, fieldState }) => (
                        <>
                          <label
                            className="block text-sm font-medium text-slate-300 mb-2"
                            htmlFor={`signal-department-${index}`}
                          >
                            Departamento
                          </label>
                          <Select
                            className="w-full"
                            id={`signal-department-${index}`}
                            isInvalid={!!fieldState.error}
                            value={String(signalField.value ?? "")}
                            onChange={(e) =>
                              signalField.onChange(e.target.value)
                            }
                          >
                            <option value="">Seleccionar departamento</option>
                            {departments.map(
                              (dept: { id: number; name: string }) => (
                                <option key={dept.id} value={dept.id}>
                                  {dept.name}
                                </option>
                              )
                            )}
                          </Select>
                          <FieldError
                            error={fieldState.error?.message}
                            fieldId={`signal-department-${index}`}
                          />
                        </>
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Mostrar errores de validación de señales si existen */}
            {form.formState.errors.signals && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                <p className="text-red-300 text-sm">
                  {form.formState.errors.signals.message ||
                    "Hay errores en las señales"}
                </p>
              </div>
            )}
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
              Crear Dispositivo
            </Button>
          </div>
        </form>
    </Modal>
  );
};
