import type React from "react";
import { useState, useEffect } from "react";

import {
  FaFloppyDisk,
  FaXmark,
  FaTag,
  FaCubesStacked,
  FaUsers,
} from "react-icons/fa6";

import { Button, Input, Select, Text } from "@components/atoms";

import { useDepartments, type Department } from "@/hooks/useCatalogs";
import type { Device } from "@/types/device";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceSignalWithDeviceFormProps {
  device: Device;
  externalValueId: string;
  onSubmit: (data: CreateDeviceSignalData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  usedDepartments?: number[];
}

export const CreateDeviceSignalWithDeviceForm: React.FC<
  CreateDeviceSignalWithDeviceFormProps
> = ({
  device,
  externalValueId,
  onSubmit,
  onCancel,
  isLoading = false,
  usedDepartments = [],
}) => {
  const [signalName, setSignalName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | string>("");
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();

  const departments = departmentsData?.data ?? [];
  const availableDepartments = departments.filter(
    (dept: { id: number }) => !usedDepartments.includes(dept.id)
  );

  useEffect(() => {
    if (availableDepartments.length > 0 && !departmentId) {
      setDepartmentId(availableDepartments[0]?.id ?? "");
    } else if (availableDepartments.length === 0) {
      setDepartmentId("");
    }
  }, [availableDepartments, departmentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!signalName.trim() || !departmentId) {
      return;
    }

    const signalData: CreateDeviceSignalData = {
      name: signalName.trim(),
      deviceId: device.id,
      departmentId: Number(departmentId),
      externalValueId,
    };

    onSubmit(signalData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Device Information Display */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <FaCubesStacked className="text-blue-400 text-sm" />
          <Text color="secondary" variant="small">
            Dispositivo Asignado
          </Text>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaTag className="text-blue-400 text-xs" />
                <Text color="muted" variant="caption">
                  Nombre del Dispositivo
                </Text>
              </div>
              <Text className="font-medium" variant="small">
                {device.name}
              </Text>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <FaTag className="text-purple-400 text-xs" />
                <Text color="muted" variant="caption">
                  External ID
                </Text>
              </div>
              <Text className="font-medium font-mono" variant="small">
                {device.externalId}
              </Text>
            </div>
          </div>
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

      {/* Signal Information */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaCubesStacked className="text-purple-400 text-sm" />
          <Text color="secondary" variant="small">
            Información de la Señal
          </Text>
        </div>

        <div className="space-y-4">
          {/* Signal Name Input */}
          <Input
            autoFocus
            fullWidth
            required
            isDisabled={isLoading}
            label="Nombre de la Señal"
            labelPlacement="outside"
            placeholder="Ej: Temperatura Principal"
            size="md"
            startContent={<FaTag className="text-slate-400" />}
            type="text"
            value={signalName}
            variant="bordered"
            onChange={(e) => setSignalName(e.target.value)}
          />

          {/* Signal Department Select */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaUsers className="text-green-400 text-sm" />
              <Text color="secondary" variant="small">
                Departamento de la Señal
              </Text>
            </div>
            <Select
              fullWidth
              required
              disabled={isLoading || departmentsLoading}
              value={departmentId}
              onChange={(e) => setDepartmentId(Number(e.target.value))}
            >
              {availableDepartments.map((department: Department) => (
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
            {usedDepartments.length > 0 && (
              <Text className="mt-1" color="muted" variant="caption">
                Se han excluido {usedDepartments.length} departamento(s) ya
                utilizados por este dispositivo
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-600">
        <Button
          color="default"
          disabled={isLoading}
          size="md"
          variant="solid"
          onClick={onCancel}
        >
          <FaXmark className="mr-2" />
          Cancelar
        </Button>
        <Button
          color="primary"
          disabled={
            isLoading ||
            !signalName.trim() ||
            !departmentId ||
            availableDepartments.length === 0
          }
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
