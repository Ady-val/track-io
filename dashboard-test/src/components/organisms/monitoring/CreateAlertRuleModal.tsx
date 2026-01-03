import type React from "react";
import { useState } from "react";

import { Button, Text, Input, Select } from "@components/atoms";

import type { Sensor, SensorType, Operator } from "@/types";

import { Modal } from "../Modal";

export interface CreateAlertRuleModalProps {
  isOpen: boolean;
  sensors: Sensor[];
  sensorTypes: SensorType[];
  operators: Operator[];
  onClose: () => void;
  onCreate: (
    name: string,
    measurementId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => void;
}

export const CreateAlertRuleModal: React.FC<CreateAlertRuleModalProps> = ({
  isOpen,
  sensors,
  sensorTypes,
  operators,
  onClose,
  onCreate,
}) => {
  const [ruleName, setRuleName] = useState("");
  const [selectedSensorId, setSelectedSensorId] = useState<number>(
    sensors.length > 0 && sensors[0] ? sensors[0].id : 1
  );
  const [mode, setMode] = useState<"setpoint" | "window">("setpoint");
  const [operator, setOperator] = useState(">");
  const [setpoint, setSetpoint] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleClose = () => {
    setRuleName("");
    setSelectedSensorId(sensors.length > 0 && sensors[0] ? sensors[0].id : 1);
    setMode("setpoint");
    setOperator(">");
    setSetpoint("");
    setMinValue("");
    setMaxValue("");
    setValidationError(null);
    onClose();
  };

  const handleCreate = () => {
    setValidationError(null);

    if (!ruleName.trim()) {
      setValidationError("Por favor ingresa un nombre para la condición");

      return;
    }

    if (mode === "setpoint" && !setpoint) {
      setValidationError("Por favor ingresa un valor para el setpoint");

      return;
    }

    if (mode === "window" && (!minValue || !maxValue)) {
      setValidationError("Por favor ingresa los valores mínimo y máximo");

      return;
    }

    onCreate(
      ruleName,
      selectedSensorId,
      mode,
      operator,
      setpoint,
      minValue,
      maxValue
    );
    handleClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      size="2xl"
      title="Nueva Condición de Monitoreo"
      onClose={handleClose}
    >
      <div className="space-y-4">
        {validationError && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-3">
            <Text className="text-red-400" variant="small">
              {validationError}
            </Text>
          </div>
        )}
        {/* Información básica */}
        <div>
          {/* Nombre de la condición */}
          <div>
            <Input
              autoFocus
              fullWidth
              label="Nombre de la Condición"
              labelPlacement="outside"
              placeholder="Ej: Temperatura Alta Tanque 1"
              size="md"
              value={ruleName}
              variant="bordered"
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          {/* Selector de sensor */}
          <div className="mt-4">
            <Text className="mb-2 text-white text-sm" variant="small">
              Sensor a Monitorear
            </Text>
            <Select
              fullWidth
              value={selectedSensorId.toString()}
              onChange={(e) => setSelectedSensorId(parseInt(e.target.value))}
            >
              {sensors.map((sensor) => (
                <option key={sensor.id} value={sensor.id}>
                  {sensor.name} ({sensor.externalId}) -{" "}
                  {sensorTypes.find((t) => t.value === sensor.type)?.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Configuración de la alerta */}
        <div>
          <Text className="mb-3 text-white text-sm" variant="small">
            Configuración de Alerta
          </Text>

          {/* Modo de operación */}
          <div className="mb-3">
            <Select
              fullWidth
              value={mode}
              onChange={(e) => setMode(e.target.value as "setpoint" | "window")}
            >
              <option value="setpoint">Setpoint - Valor específico</option>
              <option value="window">Ventana - Rango de valores</option>
            </Select>
          </div>

          {/* Modo Setpoint */}
          {mode === "setpoint" && (
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-3">
                <Select
                  fullWidth
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                >
                  {operators.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="col-span-2">
                <Input
                  fullWidth
                  placeholder="Valor"
                  size="md"
                  type="number"
                  value={setpoint}
                  variant="bordered"
                  onChange={(e) => setSetpoint(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Modo Window */}
          {mode === "window" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  fullWidth
                  label="Valor Mínimo"
                  labelPlacement="outside"
                  placeholder="Min"
                  size="md"
                  type="number"
                  value={minValue}
                  variant="bordered"
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <div>
                <Input
                  fullWidth
                  label="Valor Máximo"
                  labelPlacement="outside"
                  placeholder="Max"
                  size="md"
                  type="number"
                  value={maxValue}
                  variant="bordered"
                  onChange={(e) => setMaxValue(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
            size="md"
            type="button"
            variant="solid"
            onPress={handleClose}
          >
            Cancelar
          </Button>
          <Button
            className="px-6 py-2 font-semibold"
            color="primary"
            size="md"
            type="button"
            variant="solid"
            onPress={handleCreate}
          >
            Crear
          </Button>
        </div>
      </div>
    </Modal>
  );
};
