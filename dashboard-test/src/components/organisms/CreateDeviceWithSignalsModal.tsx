import type {
  CreateDeviceData,
  CreateDeviceSignalData,
} from "../../types/device";

import React, { useState, useEffect } from "react";

import { FaMicrochip, FaPlus, FaTrash } from "react-icons/fa";

import { useAreas } from "../../hooks/useAreas";
import { useDepartments } from "../../hooks/useCatalogs";
import deviceSignalService from "../../lib/services/device-signal.service";
import deviceService from "../../lib/services/device.service";
import { Button } from "../atoms/Button";
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
  const [signals, setSignals] = useState<SignalFormData[]>([
    { name: "", externalValueId: "", departmentId: "" },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const { areas } = useAreas();
  const { data: departmentsData } = useDepartments();

  const departments = departmentsData?.data ?? [];

  useEffect(() => {
    if (isOpen) {
      setDeviceName("");
      setExternalId("");
      setAreaId(areas[0]?.id?.toString() ?? "");
      setSignals([{ name: "", externalValueId: "", departmentId: "" }]);
    }
  }, [isOpen, areas]);

  const addSignal = () => {
    setSignals([
      ...signals,
      { name: "", externalValueId: "", departmentId: "" },
    ]);
  };

  const removeSignal = (index: number) => {
    if (signals.length > 1) {
      setSignals(signals.filter((_, i) => i !== index));
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceName || !externalId || !areaId) return;

    setIsLoading(true);
    try {
      const deviceData: CreateDeviceData = {
        name: deviceName,
        externalId,
        areaId: Number(areaId),
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
    } catch (error) {
      console.error("Error creating device with signals:", error);
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
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
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
                required
                id="device-name"
                placeholder="Ej: Controlador Principal"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
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
                onChange={(e) => setExternalId(e.target.value)}
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
                <div>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor={`signal-name-${index}`}
                  >
                    Nombre del Botón
                  </label>
                  <Input
                    id={`signal-name-${index}`}
                    placeholder="Ej: Botón 1"
                    value={signal.name}
                    onChange={(e) =>
                      updateSignal(index, "name", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor={`signal-external-value-${index}`}
                  >
                    External Value ID
                  </label>
                  <Input
                    id={`signal-external-value-${index}`}
                    placeholder="Ej: 432"
                    value={signal.externalValueId}
                    onChange={(e) =>
                      updateSignal(index, "externalValueId", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor={`signal-department-${index}`}
                  >
                    Departamento
                  </label>
                  <Select
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
    </Modal>
  );
};
