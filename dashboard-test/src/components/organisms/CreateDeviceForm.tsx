import type React from "react";
import { useState, useEffect } from "react";

import {
  FaFloppyDisk,
  FaXmark,
  FaTag,
  FaLocationDot,
  FaDesktop,
} from "react-icons/fa6";

import { Button, Input, Select, Text, Checkbox } from "@components/atoms";

import { useAreas } from "@/hooks/useAreas";
import type { CreateDeviceData } from "@/types/device";

export interface CreateDeviceFormProps {
  externalId: string;
  onSubmit: (data: CreateDeviceData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const CreateDeviceForm: React.FC<CreateDeviceFormProps> = ({
  externalId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [name, setName] = useState<string>("");
  const [areaId, setAreaId] = useState<number | string>("");
  const [isVirtualDevice, setIsVirtualDevice] = useState<boolean>(false);
  const { areas, loading: areasLoading } = useAreas();

  useEffect(() => {
    if (areas.length > 0 && !areaId) {
      setAreaId(areas[0]?.id ?? "");
    }
  }, [areas, areaId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !areaId) {
      return;
    }

    onSubmit({
      externalId,
      name: name.trim(),
      areaId: Number(areaId),
      isVirtualDevice,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
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
          value={name}
          variant="bordered"
          onChange={(e) => setName(e.target.value)}
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

      {/* Virtual Device Checkbox */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaDesktop className="text-purple-400 text-sm" />
          <Text color="secondary" variant="small">
            Tipo de Dispositivo
          </Text>
        </div>
        <Checkbox
          color="primary"
          isSelected={isVirtualDevice}
          size="md"
          onValueChange={setIsVirtualDevice}
        >
          <Text color="secondary" variant="small">
            Dispositivo Virtual (para computadora)
          </Text>
        </Checkbox>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-600">
        <Button
          color="default"
          disabled={isLoading}
          size="md"
          variant="flat"
          onClick={onCancel}
        >
          <FaXmark className="mr-2" />
          Cancelar
        </Button>
        <Button
          color="primary"
          disabled={isLoading || !name.trim() || !areaId}
          isLoading={isLoading}
          size="md"
          type="submit"
          variant="solid"
        >
          <FaFloppyDisk className="mr-2" />
          Crear Dispositivo
        </Button>
      </div>
    </form>
  );
};
