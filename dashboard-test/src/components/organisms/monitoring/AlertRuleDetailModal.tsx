import type React from "react";
import { useState, useEffect } from "react";
import {
  FaPenToSquare,
  FaTrashCan,
  FaCircleCheck,
  FaCircleXmark,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa6";

import { Button, Text, Chip, Input, Select } from "@components/atoms";
import { Modal } from "../Modal";
import type {
  AlertRule,
  Sensor,
  SensorType,
  Operator,
  SensorTypeValue,
  Message,
  NewMessageData,
  GrupoMensaje,
  Receptor,
  UsuarioCorreo,
} from "../types";
import { MessageForm } from "./MessageForm";
import { MessageCard } from "./MessageCard";

export interface AlertRuleDetailModalProps {
  isOpen: boolean;
  rule: AlertRule | null;
  sensors: Sensor[];
  sensorTypes: SensorType[];
  operators: Operator[];
  gruposMensajes: GrupoMensaje[];
  receptores: Receptor[];
  usuariosCorreo: UsuarioCorreo[];
  coloresTorreta: string[];
  getSensorIcon: (type: SensorTypeValue) => React.ReactElement;
  getColorValue: (colorName: string) => string;
  onClose: () => void;
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
  onToggleEnabled: (id: string) => void;
  onCreateMessage: (ruleId: string, messageData: NewMessageData) => void;
  onDeleteMessage: (messageId: number) => void;
  onDuplicateMessage: (messageId: number) => void;
  onUpdateMessage: (messageId: number, updates: Partial<Message>) => void;
}

export const AlertRuleDetailModal: React.FC<AlertRuleDetailModalProps> = ({
  isOpen,
  rule,
  sensors,
  sensorTypes,
  operators,
  gruposMensajes,
  receptores,
  usuariosCorreo,
  coloresTorreta,
  getSensorIcon,
  getColorValue,
  onClose,
  onEdit,
  onDelete,
  onToggleEnabled,
  onCreateMessage,
  onDeleteMessage,
  onDuplicateMessage,
  onUpdateMessage,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [selectedSensorId, setSelectedSensorId] = useState<number>(0);
  const [mode, setMode] = useState<"setpoint" | "window">("setpoint");
  const [operator, setOperator] = useState(">");
  const [setpoint, setSetpoint] = useState("");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [showAddMessageForm, setShowAddMessageForm] = useState(false);
  const [newMessageData, setNewMessageData] = useState<NewMessageData>({
    tipoReceptor: "",
    receptor: "",
    receptorNombre: "",
    message: "",
  });
  const [collapsedMessages, setCollapsedMessages] = useState(false);

  useEffect(() => {
    if (rule) {
      setRuleName(rule.name);
      setSelectedSensorId(rule.sensorId);
      setMode(rule.mode);
      setOperator(rule.operator ?? ">");
      setSetpoint(rule.setpoint?.toString() ?? "");
      setMinValue(rule.minValue?.toString() ?? "");
      setMaxValue(rule.maxValue?.toString() ?? "");
      setIsEditing(false);
      setShowAddMessageForm(false);
    }
  }, [rule]);

  if (!rule) return null;

  const currentSensor = sensors.find((s) => s.id === rule.sensorId);

  const handleSave = () => {
    onEdit(
      rule.id,
      ruleName,
      selectedSensorId,
      mode,
      operator,
      setpoint,
      minValue,
      maxValue
    );
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("¿Estás seguro de eliminar esta condición de monitoreo?")) {
      onDelete(rule.id);
      onClose();
    }
  };

  const handleCreateMessage = () => {
    if (!newMessageData.tipoReceptor || !newMessageData.receptor) {
      return;
    }

    if (
      newMessageData.tipoReceptor === "torreta" &&
      !newMessageData.receptorNombre
    ) {
      return;
    }

    onCreateMessage(rule.id, newMessageData);
    setNewMessageData({
      tipoReceptor: "",
      receptor: "",
      receptorNombre: "",
      message: "",
    });
    setShowAddMessageForm(false);
  };

  const getConditionText = (rule: AlertRule): string => {
    if (rule.mode === "setpoint") {
      return `${rule.operator} ${rule.setpoint}`;
    } else {
      return `[${rule.minValue}, ${rule.maxValue}]`;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      size="3xl"
      title={
        <div className="flex items-center gap-3">
          {currentSensor && (
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-500/30">
              {getSensorIcon(currentSensor.type)}
            </div>
          )}
          <span className="text-lg font-semibold text-slate-100">
            {rule.name}
          </span>
        </div>
      }
      onClose={onClose}
    >
      <div className="space-y-4">
        {/* Barra de acciones destacada */}
        <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600">
          <Chip
            className="cursor-pointer font-medium"
            color={rule.isEnabled ? "success" : "default"}
            size="md"
            variant="solid"
            onClick={() => onToggleEnabled(rule.id)}
          >
            {rule.isEnabled ? "● Activa" : "○ Inactiva"}
          </Chip>

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button
                  color="success"
                  size="sm"
                  startContent={<FaCircleCheck className="w-3.5 h-3.5" />}
                  variant="solid"
                  onClick={handleSave}
                >
                  Guardar
                </Button>
                <Button
                  color="default"
                  size="sm"
                  startContent={<FaCircleXmark className="w-3.5 h-3.5" />}
                  variant="bordered"
                  onClick={() => setIsEditing(false)}
                >
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="primary"
                  size="sm"
                  startContent={<FaPenToSquare className="w-3.5 h-3.5" />}
                  variant="solid"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
                <Button
                  color="danger"
                  size="sm"
                  startContent={<FaTrashCan className="w-3.5 h-3.5" />}
                  variant="solid"
                  onClick={handleDelete}
                >
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Contenido */}
        {isEditing ? (
          // Modo edición
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="space-y-4">
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
                      {sensorTypes.find((t) => t.value === sensor.type)?.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Text className="mb-2" color="secondary" variant="small">
                  Configuración de Alerta
                </Text>

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
                    <option value="window">Ventana - Rango de valores</option>
                  </Select>
                </div>

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
            </div>
          </div>
        ) : (
          // Modo vista - Grid de 2 columnas con mejor contraste
          <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna 1 */}
              <div className="space-y-3">
                <div>
                  <Text
                    className="text-xs font-medium text-slate-400 mb-1"
                    variant="caption"
                  >
                    Sensor
                  </Text>
                  <Text className="text-sm font-medium text-slate-100">
                    {currentSensor?.name ?? "Sin sensor"}
                  </Text>
                  <Text className="text-xs text-slate-400 font-mono mt-0.5">
                    {currentSensor?.externalId}
                  </Text>
                </div>

                <div>
                  <Text
                    className="text-xs font-medium text-slate-400 mb-1"
                    variant="caption"
                  >
                    Tipo de Sensor
                  </Text>
                  <div className="flex items-center gap-2">
                    {currentSensor && getSensorIcon(currentSensor.type)}
                    <Text className="text-sm font-medium text-slate-100">
                      {currentSensor
                        ? sensorTypes.find(
                            (t) => t.value === currentSensor.type
                          )?.label
                        : "-"}
                    </Text>
                  </div>
                </div>

                {currentSensor?.area && (
                  <div>
                    <Text
                      className="text-xs font-medium text-slate-400 mb-1"
                      variant="caption"
                    >
                      Área
                    </Text>
                    <Text className="text-sm font-medium text-slate-100">
                      {currentSensor.area}
                    </Text>
                  </div>
                )}
              </div>

              {/* Columna 2 */}
              <div className="space-y-3">
                <div>
                  <Text
                    className="text-xs font-medium text-slate-400 mb-1"
                    variant="caption"
                  >
                    Modo de Operación
                  </Text>
                  <Chip color="primary" size="sm" variant="flat">
                    {rule.mode === "setpoint" ? "Setpoint" : "Ventana"}
                  </Chip>
                </div>

                <div>
                  <Text
                    className="text-xs font-medium text-slate-400 mb-1"
                    variant="caption"
                  >
                    Condición
                  </Text>
                  <div className="flex items-center gap-2">
                    <Chip color="warning" size="md" variant="solid">
                      {getConditionText(rule)}
                    </Chip>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sección de mensajes */}
        <div className="pt-1">
          <div className="flex items-center justify-between mb-3 p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <button
                className="text-slate-300 hover:text-slate-100 transition-colors p-1.5 rounded hover:bg-slate-600"
                title={
                  collapsedMessages ? "Expandir mensajes" : "Colapsar mensajes"
                }
                onClick={() => setCollapsedMessages(!collapsedMessages)}
              >
                {collapsedMessages ? (
                  <FaChevronDown className="w-4 h-4" />
                ) : (
                  <FaChevronUp className="w-4 h-4" />
                )}
              </button>
              <Text className="text-base font-semibold text-slate-100">
                Mensajes
              </Text>
              <Chip color="primary" size="sm" variant="solid">
                {rule.mensajes?.length ?? 0}
              </Chip>
            </div>
            <Button
              color="success"
              size="sm"
              variant="solid"
              onClick={() => setShowAddMessageForm(true)}
            >
              ➕ Agregar
            </Button>
          </div>

          {!collapsedMessages && (
            <>
              {showAddMessageForm && (
                <div className="mb-4">
                  <MessageForm
                    coloresTorreta={coloresTorreta}
                    getColorValue={getColorValue}
                    messageData={newMessageData}
                    receptores={receptores}
                    usuariosCorreo={usuariosCorreo}
                    onCancel={() => setShowAddMessageForm(false)}
                    onCreate={handleCreateMessage}
                    onUpdate={(updates) =>
                      setNewMessageData((prev) => ({ ...prev, ...updates }))
                    }
                  />
                </div>
              )}

              {rule.mensajes && rule.mensajes.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {rule.mensajes.map((message) => (
                    <MessageCard
                      key={message.id}
                      coloresTorreta={coloresTorreta}
                      getColorValue={getColorValue}
                      gruposMensajes={gruposMensajes}
                      message={message}
                      receptores={receptores}
                      usuariosCorreo={usuariosCorreo}
                      onDelete={onDeleteMessage}
                      onDuplicate={onDuplicateMessage}
                      onUpdate={onUpdateMessage}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Text color="muted" variant="caption">
                    No hay mensajes configurados
                  </Text>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
