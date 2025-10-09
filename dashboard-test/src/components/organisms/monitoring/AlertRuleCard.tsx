import type React from "react";
import { useState } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

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
} from "../types";

export interface AlertRuleCardProps {
  rule: AlertRule;
  disabled: boolean;
  sensorTypes: SensorType[];
  operators: Operator[];
  onEdit: (
    id: string,
    name: string,
    sensorTag: string,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => void;
  onDelete: (id: string) => void;
  onToggleEdit: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onToggleSensorType: (id: string, sensorTypeStr: string) => void;
  getSensorIcon: (type: SensorTypeValue) => React.ReactElement;
  children?: React.ReactNode;
}

export const AlertRuleCard: React.FC<AlertRuleCardProps> = ({
  rule,
  disabled,
  sensorTypes,
  operators,
  onEdit,
  onDelete,
  onToggleEdit,
  onToggleEnabled,
  onToggleSensorType,
  getSensorIcon,
  children,
}) => {
  const [ruleName, setRuleName] = useState<string>(rule.name);
  const [sensorTag, setSensorTag] = useState<string>(rule.sensorTag);
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
            {getSensorIcon(rule.sensorType)}
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
              <div className="flex justify-between items-center">
                <Text color="muted" variant="caption">
                  Tipo de Sensor:
                </Text>
                <Select
                  className="text-sm"
                  value={rule.sensorType}
                  onChange={(e) => onToggleSensorType(rule.id, e.target.value)}
                >
                  {sensorTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex justify-between">
                <Text color="muted" variant="caption">
                  Sensor:
                </Text>
                <Text color="secondary" variant="caption">
                  {rule.sensorTag}
                </Text>
              </div>
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
                  Tipo:
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
                    startContent={<FaCheckCircle className="w-3 h-3" />}
                    onClick={() =>
                      onEdit(
                        rule.id,
                        ruleName,
                        sensorTag,
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
                    startContent={<FaTimesCircle className="w-3 h-3" />}
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
                    startContent={<FaEdit className="w-3 h-3" />}
                    variant="bordered"
                    onClick={() => onToggleEdit(rule.id)}
                  >
                    Editar
                  </Button>
                  <Button
                    color="danger"
                    isDisabled={disabled}
                    size="sm"
                    startContent={<FaTrashAlt className="w-3 h-3" />}
                    variant="flat"
                    onClick={() => onDelete(rule.id)}
                  >
                    Eliminar
                  </Button>
                </>
              )}
            </div>

            {rule.edit && (
              <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                <Input
                  placeholder="Nombre de la regla"
                  value={ruleName}
                  variant="bordered"
                  onChange={(e) => setRuleName(e.target.value)}
                />
                <Input
                  placeholder="Tag del sensor"
                  value={sensorTag}
                  variant="bordered"
                  onChange={(e) => setSensorTag(e.target.value)}
                />
                <Select
                  fullWidth
                  value={mode}
                  onChange={(e) =>
                    setMode(e.target.value as "setpoint" | "window")
                  }
                >
                  <option value="setpoint">Setpoint</option>
                  <option value="window">Ventana</option>
                </Select>
                {mode === "setpoint" && (
                  <>
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
                    <Input
                      placeholder="Valor setpoint"
                      type="number"
                      value={setpoint}
                      variant="bordered"
                      onChange={(e) => setSetpoint(e.target.value)}
                    />
                  </>
                )}
                {mode === "window" && (
                  <>
                    <Input
                      placeholder="Valor mínimo"
                      type="number"
                      value={minValue}
                      variant="bordered"
                      onChange={(e) => setMinValue(e.target.value)}
                    />
                    <Input
                      placeholder="Valor máximo"
                      type="number"
                      value={maxValue}
                      variant="bordered"
                      onChange={(e) => setMaxValue(e.target.value)}
                    />
                  </>
                )}
              </div>
            )}

            {children}
          </>
        )}
      </CardBody>
    </Card>
  );
};
