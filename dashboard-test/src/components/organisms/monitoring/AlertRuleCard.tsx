import type React from "react";
import { useState } from "react";

import {
  FaPenToSquare,
  FaTrashCan,
  FaCircleCheck,
  FaCircleXmark,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";

import {
  Card,
  CardBody,
  Text,
  Button,
  Chip,
  Input,
  Select,
} from "@components/atoms";

import type {
  AlertRule,
  Operator,
  SensorType,
  SensorTypeValue,
  Sensor,
} from "@/types/alertRule";

export interface AlertRuleCardProps {
  rule: AlertRule;
  disabled: boolean;
  sensors: Sensor[];
  sensorTypes: SensorType[];
  operators: Operator[];
  onEdit: (
    id: string,
    name: string,
    sensorId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => void;
  onDelete: (id: string) => void;
  onToggleEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  getSensorIcon: (type: SensorTypeValue) => React.ReactElement;
  children?: React.ReactNode;
}

export const AlertRuleCard: React.FC<AlertRuleCardProps> = ({
  rule,
  disabled,
  sensors,
  sensorTypes,
  operators,
  onEdit,
  onDelete,
  onToggleEdit,
  onToggleEnabled,
  getSensorIcon,
  children,
}) => {
  const [ruleName, setRuleName] = useState<string>(rule.name);
  const [selectedSensorId, setSelectedSensorId] = useState<number>(
    rule.measurementId
  );
  const [mode, setMode] = useState<"setpoint" | "window">(rule.mode);
  const [operator, setOperator] = useState<string>(rule.operator ?? ">");
  const [setpoint, setSetpoint] = useState<string>(
    rule.setpoint?.toString() ?? ""
  );
  const [minValue, setMinValue] = useState<string>(
    rule.minValue?.toString() ?? ""
  );
  const [maxValue, setMaxValue] = useState<string>(
    rule.maxValue?.toString() ?? ""
  );
  const [collapsed, setCollapsed] = useState<boolean>(false);

  const currentSensor = sensors.find((s) => s.id === rule.measurementId);

  const getConditionText = (rule: AlertRule): string => {
    if (rule.mode === "setpoint") {
      return `${rule.operator} ${rule.setpoint}`;
    } else {
      return `[${rule.minValue}, ${rule.maxValue}]`;
    }
  };

  return (
    <Card data-rule-id={rule.id}>
      <CardBody className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              className="text-slate-400 hover:text-slate-200 transition-colors"
              title={collapsed ? "Expandir regla" : "Colapsar regla"}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? (
                <FaChevronDown className="w-4 h-4" />
              ) : (
                <FaChevronUp className="w-4 h-4" />
              )}
            </button>
            {currentSensor && getSensorIcon(currentSensor.type)}
            <Text variant="h4">{rule.name}</Text>
          </div>
          <Chip
            className="cursor-pointer"
            color={rule.isEnabled ? "primary" : "default"}
            variant="flat"
            onClick={() => onToggleEnabled(rule.id)}
          >
            {rule.isEnabled ? "Activa" : "Inactiva"}
          </Chip>
        </div>

        {!collapsed && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Sensor:
                </Text>
                <Text color="secondary" variant="caption">
                  {currentSensor
                    ? `${currentSensor.name} (${currentSensor.externalId})`
                    : "Sin sensor"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Tipo:
                </Text>
                <Text color="secondary" variant="caption">
                  {currentSensor
                    ? sensorTypes.find((t) => t.value === currentSensor.type)
                        ?.label
                    : "-"}
                </Text>
              </div>
              {currentSensor?.area && (
                <div className="flex justify-between">
                  <Text color="muted" variant="caption">
                    Área:
                  </Text>
                  <Text color="secondary" variant="caption">
                    {currentSensor.area}
                  </Text>
                </div>
              )}
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Condición:
                </Text>
                <Text color="secondary" variant="caption">
                  {getConditionText(rule)}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Modo:
                </Text>
                <Text color="secondary" variant="caption">
                  {rule.mode === "setpoint" ? "Setpoint" : "Ventana"}
                </Text>
              </div>
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Mensajes:
                </Text>
                <Text color="secondary" variant="caption">
                  {rule.mensajes?.length ?? 0}
                </Text>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700">
              {rule.edit ? (
                <>
                  <Button
                    color="success"
                    size="sm"
                    startContent={<FaCircleCheck className="w-3 h-3" />}
                    onClick={() =>
                      onEdit(
                        rule.id,
                        ruleName,
                        selectedSensorId,
                        mode,
                        operator,
                        setpoint,
                        minValue,
                        maxValue
                      )
                    }
                  >
                    Guardar
                  </Button>
                  <Button
                    color="default"
                    size="sm"
                    startContent={<FaCircleXmark className="w-3 h-3" />}
                    variant="flat"
                    onClick={() => onToggleEdit(rule.id)}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    color="primary"
                    isDisabled={disabled}
                    size="sm"
                    startContent={<FaPenToSquare className="w-3 h-3" />}
                    variant="bordered"
                    onClick={() => onToggleEdit(rule.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    color="danger"
                    isDisabled={disabled}
                    size="sm"
                    startContent={<FaTrashCan className="w-3 h-3" />}
                    variant="flat"
                    onClick={() => onDelete(rule.id)}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>

            {rule.edit && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="space-y-4">
                  {/* Nombre de la regla - Full width */}
                  <div>
                    <Text className="mb-2" color="secondary" variant="small">
                      Nombre de la Condición
                    </Text>
                    <Input
                      placeholder="Ej: Temperatura Alta Tanque 1"
                      value={ruleName}
                      variant="bordered"
                      onChange={(e) => setRuleName(e.target.value)}
                    />
                  </div>

                  {/* Selector de sensor - Full width */}
                  <div>
                    <Text className="mb-2" color="secondary" variant="small">
                      Sensor a Monitorear
                    </Text>
                    <Select
                      fullWidth
                      value={selectedSensorId.toString()}
                      onChange={(e) =>
                        setSelectedSensorId(parseInt(e.target.value))
                      }
                    >
                      {sensors.map((sensor) => (
                        <option key={sensor.id} value={sensor.id}>
                          {sensor.name} ({sensor.externalId}) -{" "}
                          {
                            sensorTypes.find((t) => t.value === sensor.type)
                              ?.label
                          }
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Configuración de la condición */}
                  <div>
                    <Text className="mb-2" color="secondary" variant="small">
                      Configuración de Alerta
                    </Text>

                    {/* Modo de operación */}
                    <div className="mb-3">
                      <Select
                        fullWidth
                        value={mode}
                        onChange={(e) =>
                          setMode(e.target.value as "setpoint" | "window")
                        }
                      >
                        <option value="setpoint">
                          Setpoint - Valor específico
                        </option>
                        <option value="window">
                          Ventana - Rango de valores
                        </option>
                      </Select>
                    </div>

                    {/* Modo Setpoint: Operador + Valor en grid */}
                    {mode === "setpoint" && (
                      <div className="grid grid-cols-5 gap-3">
                        <div className="col-span-3">
                          <Select
                            fullWidth
                            value={operator}
                            onChange={(e) => setOperator(e.target.value)}
                          >
                            {operators.map((op: any) => (
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

                    {/* Modo Window: Min y Max en grid */}
                    {mode === "window" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Text
                            className="mb-1.5"
                            color="muted"
                            variant="caption"
                          >
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
                          <Text
                            className="mb-1.5"
                            color="muted"
                            variant="caption"
                          >
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
                </div>
              </div>
            )}

            {children}
          </>
        )}
      </CardBody>
    </Card>
  );
};
