import type React from "react";
import { useState } from "react";

import { Button, Input, Select, Text } from "@components/atoms";
import { FaFloppyDisk, FaXmark, FaTag, FaCubesStacked } from "react-icons/fa6";

import type {
  CreateMeasurementData,
  MeasurementTypeOption,
} from "@/types/measurement";

export interface CreateMeasurementFormProps {
  externalId: string;
  onSubmit: (data: CreateMeasurementData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const measurementTypeOptions: MeasurementTypeOption[] = [
  { value: "temperature", label: "Temperatura" },
  { value: "humidity", label: "Humedad" },
  { value: "pressure", label: "Presión" },
  { value: "level", label: "Nivel" },
  { value: "flow", label: "Flujo" },
  { value: "vibration", label: "Vibración" },
];

export const CreateMeasurementForm: React.FC<CreateMeasurementFormProps> = ({
  externalId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [name, setName] = useState<string>("");
  const [type, setType] = useState<string>("temperature");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    onSubmit({
      externalId,
      name: name.trim(),
      type,
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
          required
          autoFocus
          fullWidth
          isDisabled={isLoading}
          label="Nombre del Dispositivo"
          labelPlacement="outside"
          placeholder="Ej: Sensor de Temperatura Principal"
          size="md"
          startContent={<FaTag className="text-slate-400" />}
          type="text"
          value={name}
          variant="bordered"
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {/* Type Select */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <FaCubesStacked className="text-purple-400 text-sm" />
          <Text color="secondary" variant="small">
            Tipo de Dispositivo
          </Text>
        </div>
        <Select
          required
          fullWidth
          disabled={isLoading}
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          {measurementTypeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
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
          disabled={isLoading || !name.trim()}
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
