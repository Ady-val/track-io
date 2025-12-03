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

import { useDepartments } from "@/hooks/useCatalogs";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceSignalFormProps {
  deviceId: number;
  deviceName: string;
  externalValueId: string;
  onSubmit: (data: CreateDeviceSignalData) => void;
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
  const [name, setName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | string>("");
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();

  const departments = departmentsData?.data ?? [];

  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0]?.id ?? "");
    }
  }, [departments, departmentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !departmentId) {
      return;
    }

    onSubmit({
      name: name.trim(),
      deviceId,
      departmentId: Number(departmentId),
      externalValueId,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
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
          value={name}
          variant="bordered"
          onChange={(e) => setName(e.target.value)}
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
        <Select
          fullWidth
          required
          disabled={isLoading || departmentsLoading}
          value={departmentId}
          onChange={(e) => setDepartmentId(Number(e.target.value))}
        >
          {departments.map((department: any) => (
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
          disabled={isLoading || !name.trim() || !departmentId}
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
