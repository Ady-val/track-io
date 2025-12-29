import type React from "react";
import { useEffect, useMemo, useState } from "react";

import {
  FaFloppyDisk,
  FaXmark,
  FaTag,
  FaCubesStacked,
  FaLocationDot,
  FaUsers,
} from "react-icons/fa6";

import { Button, Input, Select, Text } from "@components/atoms";

import { useAreas } from "@/hooks/useAreas";
import { useDepartments, type Department } from "@/hooks/useCatalogs";
import type { CreateDeviceData } from "@/types/device";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceAndSignalFormProps {
  externalId: string;
  externalValueId: string;
  onSubmit: (
    deviceData: CreateDeviceData,
    signalData: Omit<CreateDeviceSignalData, "deviceId">
  ) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateDeviceAndSignalForm: React.FC<
  CreateDeviceAndSignalFormProps
> = ({
  externalId,
  externalValueId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [deviceName, setDeviceName] = useState<string>("");
  const [areaId, setAreaId] = useState<number | string>("");

  const [signalName, setSignalName] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<number | string>("");

  const { areas, loading: areasLoading } = useAreas();
  const { data: departmentsData, isLoading: departmentsLoading } =
    useDepartments();
  const departments = useMemo(
    () => departmentsData?.data ?? [],
    [departmentsData?.data]
  );

  useEffect(() => {
    if (areas.length > 0 && !areaId) {
      setAreaId(areas[0]?.id ?? "");
    }
  }, [areas, areaId]);

  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(departments[0]?.id ?? "");
    }
  }, [departments, departmentId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!deviceName.trim() || !areaId || !signalName.trim() || !departmentId) {
      return;
    }

    const deviceData: CreateDeviceData = {
      externalId,
      name: deviceName.trim(),
      areaId: Number(areaId),
    };

    const signalData: Omit<CreateDeviceSignalData, "deviceId"> = {
      name: signalName.trim(),
      departmentId: Number(departmentId),
      externalValueId,
    };

    onSubmit(deviceData, signalData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* External IDs Display */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaTag className="text-blue-400 text-sm" />
              <Text color="secondary" variant="small">
                Device External ID
              </Text>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <Text className="font-mono font-medium">{externalId}</Text>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaTag className="text-purple-400 text-sm" />
              <Text color="secondary" variant="small">
                Signal External Value ID
              </Text>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600">
              <Text className="font-mono font-medium">{externalValueId}</Text>
            </div>
          </div>
        </div>
      </div>

      {/* Device Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FaCubesStacked className="text-blue-400 text-sm" />
          <Text color="secondary" variant="small">
            Información del Dispositivo
          </Text>
        </div>

        <div className="space-y-4">
          {/* Device Name Input */}
          <Input
            autoFocus
            fullWidth
            required
            isDisabled={isLoading}
            label="Nombre del Dispositivo"
            labelPlacement="outside"
            placeholder="Ej: Sensor Principal de Temperatura"
            size="md"
            startContent={<FaTag className="text-slate-400" />}
            type="text"
            value={deviceName}
            variant="bordered"
            onChange={(e) => setDeviceName(e.target.value)}
          />

          {/* Device Area Select */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FaLocationDot className="text-green-400 text-sm" />
              <Text color="secondary" variant="small">
                Área del Dispositivo
              </Text>
            </div>
            <Select
              fullWidth
              required
              disabled={isLoading || areasLoading}
              value={areaId}
              onChange={(e) => setAreaId(Number(e.target.value))}
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
          </div>
        </div>
      </div>

      {/* Signal Section */}
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
            !deviceName.trim() ||
            !areaId ||
            !signalName.trim() ||
            !departmentId
          }
          isLoading={isLoading}
          size="md"
          type="submit"
          variant="solid"
        >
          <FaFloppyDisk className="mr-2" />
          Crear Dispositivo y Señal
        </Button>
      </div>
    </form>
  );
};
