import type React from "react";
import { useState } from "react";
import { FaCircleCheck, FaCircleXmark } from "react-icons/fa6";

import { Button, Text, Input, Select } from "@components/atoms";
import { Modal } from "../Modal";
import type { Sensor, SensorType, Operator } from "../types";

export interface CreateAlertRuleModalProps {
  isOpen: boolean;
  sensors: Sensor[];
  sensorTypes: SensorType[];
  operators: Operator[];
  onClose: () => void;
  onCreate: (
    name: string,
    sensorId: number,
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
    sensors.length > 0 ? sensors[0].id : 1
  );
  const [mode, setMode] = useState<"setpoint" | "window">("setpoint");
  const [operator, setOperator] = useState(">");
  const [setpoint, setSetpoint] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");

  const handleClose = () => {
    // Reset form
    setRuleName("");
    setSelectedSensorId(sensors.length > 0 ? sensors[0].id : 1);
    setMode("setpoint");
    setOperator(">");
    setSetpoint("");
    setMinValue("");
    setMaxValue("");
    onClose();
  };

  const handleCreate = () => {
    if (!ruleName.trim()) {
      alert("Por favor ingresa un nombre para la condición");
      return;
    }

    if (mode === "setpoint" && !setpoint) {
      alert("Por favor ingresa un valor para el setpoint");
      return;
    }

    if (mode === "window" && (!minValue || !maxValue)) {
      alert("Por favor ingresa los valores mínimo y máximo");
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
      <div className="space-y-5">
        {/* Información básica */}
        <div className="bg-slate-900/30 rounded-lg p-4 space-y-4">
          {/* Nombre de la condición */}
          <div>
            <Text className="mb-2" color="secondary" variant="small">
              Nombre de la Condición
            </Text>
            <Input
              autoFocus
              placeholder="Ej: Temperatura Alta Tanque 1"
              value={ruleName}
              variant="bordered"
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          {/* Selector de sensor */}
          <div>
            <Text className="mb-2" color="secondary" variant="small">
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
        <div className="bg-slate-900/30 rounded-lg p-4">
          <Text className="mb-3" color="secondary" variant="small">
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
                  placeholder="Valor"
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
                <Text className="mb-1.5" color="muted" variant="caption">
                  Valor Mínimo
                </Text>
                <Input
                  placeholder="Min"
                  type="number"
                  value={minValue}
                  variant="bordered"
                  onChange={(e) => setMinValue(e.target.value)}
                />
              </div>
              <div>
                <Text className="mb-1.5" color="muted" variant="caption">
                  Valor Máximo
                </Text>
                <Input
                  placeholder="Max"
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
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700/50">
          <Button
            color="default"
            size="md"
            startContent={<FaCircleXmark className="w-4 h-4" />}
            variant="flat"
            onClick={handleClose}
          >
            Cancelar
          </Button>
          <Button
            color="success"
            size="md"
            startContent={<FaCircleCheck className="w-4 h-4" />}
            onClick={handleCreate}
          >
            Crear
          </Button>
        </div>
      </div>
    </Modal>
  );
};
