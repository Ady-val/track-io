import type {
  CreateDeviceData,
  CreateDeviceSignalData,
} from "../../types/device";

import React, { useState, useEffect } from "react";

import { FaMicrochip, FaPlus, FaTrash, FaDesktop } from "react-icons/fa";

import { useAreas } from "../../hooks/useAreas";
import { useDepartments } from "../../hooks/useCatalogs";
import deviceSignalService from "../../lib/services/device-signal.service";
import deviceService from "../../lib/services/device.service";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

import { Modal } from "./Modal";

interface CreateDeviceWithSignalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SignalFormData {
  name: string;
  externalValueId: string;
  departmentId: string;
}

export const CreateDeviceWithSignalsModal: React.FC<
  CreateDeviceWithSignalsModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const [deviceName, setDeviceName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [isVirtualDevice, setIsVirtualDevice] = useState(false);
  const [signals, setSignals] = useState<SignalFormData[]>([
    { name: "", externalValueId: "", departmentId: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [serverError, setServerError] = useState<string>("");

  const { areas } = useAreas();
  const { data: departmentsData } = useDepartments();

  const departments = departmentsData?.data ?? [];

  useEffect(() => {
    if (isOpen) {
      setDeviceName("");
      setExternalId("");
      setAreaId(areas[0]?.id?.toString() ?? "");
      setIsVirtualDevice(false);
      setSignals([{ name: "", externalValueId: "", departmentId: "" }]);
      setValidationErrors([]);
      setServerError("");
    }
  }, [isOpen, areas]);

  const addSignal = () => {
    setSignals([
      ...signals,
      { name: "", externalValueId: "", departmentId: "" },
    ]);
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const removeSignal = (index: number) => {
    if (signals.length > 1) {
      setSignals(signals.filter((_, i) => i !== index));
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    }
  };

  const updateSignal = (
    index: number,
    field: keyof SignalFormData,
    value: string
  ) => {
    const newSignals = [...signals];
    const signal = newSignals[index];

    if (signal) {
      signal[field] = value;
      setSignals(newSignals);
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    }
  };

  const handleDeviceNameChange = (value: string) => {
    setDeviceName(value);
    if (serverError) {
      setServerError("");
    }
  };

  const handleExternalIdChange = (value: string) => {
    setExternalId(value);
    if (serverError) {
      setServerError("");
    }
  };

  const validateSignals = (): boolean => {
    const errors: string[] = [];
    const validSignals = signals.filter(
      (signal) => signal.name && signal.externalValueId && signal.departmentId
    );

    const names = validSignals.map((s) => s.name.trim().toLowerCase());
    const uniqueNames = new Set(names);

    if (names.length !== uniqueNames.size) {
      errors.push("No se pueden repetir nombres entre señales");
    }

    const externalValueIds = validSignals.map((s) => s.externalValueId.trim());
    const uniqueExternalValueIds = new Set(externalValueIds);

    if (externalValueIds.length !== uniqueExternalValueIds.size) {
      errors.push("No se pueden repetir External Value ID entre señales");
    }

    const departmentIds = validSignals.map((s) => s.departmentId);
    const uniqueDepartmentIds = new Set(departmentIds);

    if (departmentIds.length !== uniqueDepartmentIds.size) {
      errors.push("No se pueden repetir departamentos entre señales");
    }

    setValidationErrors(errors);

    return errors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName || !externalId || !areaId) return;

    if (!validateSignals()) {
      return;
    }

    setIsLoading(true);
    setServerError("");

    try {
      const deviceData: CreateDeviceData = {
        name: deviceName,
        externalId,
        areaId: Number(areaId),
        isVirtualDevice,
      };
      const newDevice = await deviceService.create(deviceData);

      const validSignals = signals.filter(
        (signal) => signal.name && signal.externalValueId && signal.departmentId
      );

      if (newDevice) {
        for (const signal of validSignals) {
          const signalData: CreateDeviceSignalData = {
            name: signal.name,
            deviceId: newDevice.id,
            departmentId: Number(signal.departmentId),
            externalValueId: signal.externalValueId,
          };

          await deviceSignalService.create(signalData);
        }
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.error("Error creating device with signals:", error);

      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response?: {
            status?: number;
            data?: { message?: string; error?: string };
          };
        };

        const serverMessage =
          apiError.response?.data?.message ??
          apiError.response?.data?.error ??
          "Error del servidor";

        if (apiError.response?.status === 409) {
          setServerError(serverMessage);
        } else if (apiError.response?.status === 400) {
          setServerError(serverMessage);
        } else {
          setServerError(serverMessage);
        }
      } else if (error && typeof error === "object" && "message" in error) {
        const errorWithMessage = error as { message: string };

        setServerError(`Error: ${errorWithMessage.message}`);
      } else {
        setServerError(
          "Error al crear el dispositivo. Por favor, intenta nuevamente."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Agregar Dispositivo y Señales"
      onClose={onClose}
      data-cy="create-device-modal"
    >
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {validationErrors.length > 0 && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <h4 className="text-red-400 font-semibold mb-2">
                Errores de validación:
              </h4>
              <ul className="text-red-300 text-sm space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {serverError && (
            <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4">
              <h4 className="text-red-400 font-semibold mb-2">
                Error del servidor:
              </h4>
              <p className="text-red-300 text-sm">{serverError}</p>
            </div>
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
                <label
                  className="block text-sm font-medium text-slate-300 mb-2"
                  htmlFor="device-name"
                >
                  Nombre del Dispositivo
                </label>
                <Input
                  autoFocus
                  required
                  id="device-name"
                  placeholder="Ej: Controlador Principal"
                  value={deviceName}
                  onChange={(e) => handleDeviceNameChange(e.target.value)}
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-slate-300 mb-2"
                  htmlFor="device-external-id"
                >
                  External ID
                </label>
                <Input
                  required
                  id="device-external-id"
                  placeholder="Ej: CTR-1433"
                  value={externalId}
                  onChange={(e) => handleExternalIdChange(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label
                className="block text-sm font-medium text-slate-300 mb-2"
                htmlFor="device-area"
              >
                Área
              </label>
              <Select
                required
                id="device-area"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              >
                <option value="">Seleccionar área</option>
                {areas.map((area: { id: number; name: string }) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <FaDesktop className="text-purple-400 text-sm" />
                <span className="text-sm font-medium text-slate-300">
                  Tipo de Dispositivo
                </span>
              </div>
              <Checkbox
                color="primary"
                isSelected={isVirtualDevice}
                size="md"
                onValueChange={setIsVirtualDevice}
              >
                <span className="text-sm text-slate-400">
                  Dispositivo Virtual (para computadora)
                </span>
              </Checkbox>
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

            {signals.map((signal, index) => (
              <div
                key={index}
                className="bg-slate-800/50 p-4 rounded-lg border border-slate-600"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-slate-200">
                    Señal {index + 1}
                  </h4>
                  {signals.length > 1 && (
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
                    <label
                      className="block text-sm font-medium text-slate-300 mb-2"
                      htmlFor={`signal-name-${index}`}
                    >
                      Nombre del Botón
                    </label>
                    <Input
                      className="w-full"
                      id={`signal-name-${index}`}
                      placeholder="Ej: Botón 1"
                      value={signal.name}
                      onChange={(e) =>
                        updateSignal(index, "name", e.target.value)
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      className="block text-sm font-medium text-slate-300 mb-2"
                      htmlFor={`signal-external-value-${index}`}
                    >
                      External Value ID
                    </label>
                    <Input
                      className="w-full"
                      id={`signal-external-value-${index}`}
                      placeholder="Ej: 432"
                      value={signal.externalValueId}
                      onChange={(e) =>
                        updateSignal(index, "externalValueId", e.target.value)
                      }
                    />
                  </div>

                  <div className="min-w-0">
                    <label
                      className="block text-sm font-medium text-slate-300 mb-2"
                      htmlFor={`signal-department-${index}`}
                    >
                      Departamento
                    </label>
                    <Select
                      className="w-full"
                      id={`signal-department-${index}`}
                      value={signal.departmentId}
                      onChange={(e) =>
                        updateSignal(index, "departmentId", e.target.value)
                      }
                    >
                      <option value="">Seleccionar departamento</option>
                      {departments.map((dept: { id: number; name: string }) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isLoading}
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
              disabled={isLoading || !deviceName || !externalId || !areaId}
              size="md"
              type="submit"
              variant="solid"
            >
              {isLoading ? "Creando..." : "Crear Dispositivo"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
