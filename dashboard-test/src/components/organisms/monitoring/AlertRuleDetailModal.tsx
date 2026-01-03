import type React from "react";
import { useState, useEffect } from "react";

import { FaChevronDown, FaChevronUp } from "react-icons/fa6";

import { Button, Text, Chip, Input, Select } from "@components/atoms";

import { Module, Action } from "@/constants/permissions";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useTorretas } from "@/hooks/useTorretas";
import { useEmails } from "@/hooks/useEmails";
import { useTorretaColors } from "@/hooks/useTorretaColors";
import type {
  AlertRule,
  Sensor,
  SensorType,
  Operator,
  SensorTypeValue,
  NewMessageData,
  GrupoMensaje,
  Receptor,
} from "@/types";
import type { Torreta, Email, TorretaColor } from "@/types/escalation";

import { Modal } from "../Modal";

import { MessageCard } from "./MessageCard";
import { MessageForm } from "./MessageForm";

export interface AlertRuleDetailModalProps {
  isOpen: boolean;
  rule: AlertRule | null;
  sensors: Sensor[];
  sensorTypes: SensorType[];
  operators: Operator[];
  gruposMensajes: GrupoMensaje[];
  receptores: Receptor[];
  getSensorIcon: (type: SensorTypeValue) => React.ReactElement;
  onClose: () => void;
  onEdit: (
    id: string,
    name: string,
    measurementId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => void;
  onDelete: (id: string) => void;
  onCreateMessage: (ruleId: string, messageData: NewMessageData) => void;
  onDeleteMessage: (messageId: number) => void;
}

export const AlertRuleDetailModal: React.FC<AlertRuleDetailModalProps> = ({
  isOpen,
  rule,
  sensors,
  sensorTypes,
  operators,
  gruposMensajes,
  receptores,
  getSensorIcon,
  onClose,
  onEdit,
  onDelete,
  onCreateMessage,
  onDeleteMessage,
}) => {
  const { data: torretasData } = useTorretas();
  const { data: emailsData } = useEmails();
  const { data: torretaColorsData } = useTorretaColors();

  const torretas: Torreta[] = (torretasData?.data ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    externalId: t.externalId ?? "",
    isActive: t.isActive,
  }));

  const emails: Email[] = (emailsData?.data ?? []).map((e: any) => ({
    id: e.id,
    name: e.name,
    email: e.email,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    deletedAt: e.deletedAt,
  }));

  // Map torreta colors from backend response
  // Backend returns TorretaColor entity with: id, name, htmlColor, deviceColorId
  const torretaColors: TorretaColor[] = (torretaColorsData ?? []).map((c) => {
    // Backend entity has htmlColor, frontend type uses hexCode
    // Use htmlColor if available (from backend), otherwise use hexCode (legacy)
    const htmlColor = (c as any).htmlColor || c.hexCode;
    const deviceColorId = (c as any).deviceColorId || c.deviceColorId;
    
    if (!deviceColorId) {
      console.warn(`Torreta color ${c.id} (${c.name}) is missing deviceColorId`);
    }
    
    return {
      id: c.id,
      name: c.name,
      htmlColor: htmlColor,
      deviceColorId: deviceColorId || c.name, // Fallback to name if deviceColorId missing
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
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
    messageType: "receptor" as "torreta" | "receptor" | "email",
    targetId: "",
    message: "",
    color: undefined,
    grupo: "",
  });
  const [collapsedMessages, setCollapsedMessages] = useState(false);

  const hasUpdatePermission = useHasPermission(
    Module.MEASUREMENT_ALERTS,
    Action.UPDATE
  );
  const hasDeletePermission = useHasPermission(
    Module.MEASUREMENT_ALERTS,
    Action.DELETE
  );
  const hasCreateMessagePermission = useHasPermission(
    Module.MEASUREMENT_ALERTS,
    Action.CREATE
  );

  useEffect(() => {
    if (rule) {
      setRuleName(rule.name);
      setSelectedSensorId(rule.measurementId);
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

  const currentSensor = sensors.find((s) => s.id === rule.measurementId);

  const handleCreateMessage = () => {
    if (!newMessageData.messageType || !newMessageData.targetId) {
      return;
    }

    if (newMessageData.messageType === "torreta" && !newMessageData.color) {
      return;
    }

    if (
      newMessageData.messageType !== "torreta" &&
      (!newMessageData.message || newMessageData.message.trim().length === 0)
    ) {
      return;
    }

    // Use first message group if grupo is not set
    const grupoToUse = newMessageData.grupo || gruposMensajes[0]?.nombre || "";
    onCreateMessage(rule.id, { ...newMessageData, grupo: grupoToUse });
    setNewMessageData({
      messageType: "receptor" as "torreta" | "receptor" | "email",
      targetId: "",
      message: "",
      color: undefined,
      grupo: gruposMensajes[0]?.nombre ?? "",
    });
    setShowAddMessageForm(false);
  };

  const handleSaveEdit = () => {
    if (!ruleName.trim()) {
      return;
    }

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
        {isEditing ? (
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="space-y-4">
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

              <div>
                <Text className="text-sm text-slate-300 mb-2">Sensor a Monitorear</Text>
                <Select
                  fullWidth
                  value={selectedSensorId?.toString() ?? "0"}
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
                <div className="mb-3">
                  <Text className="text-sm text-slate-300 mb-2">Configuración de Alerta</Text>
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
            </div>
          </div>
        ) : (
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
                  <div className="inline-block px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-medium border border-blue-500">
                    {rule.mode === "setpoint" ? "Setpoint" : "Ventana"}
                  </div>
                </div>

                <div>
                  <Text
                    className="text-xs font-medium text-slate-400 mb-1"
                    variant="caption"
                  >
                    Condición
                  </Text>
                  <div className="flex items-center gap-2">
                    <div className="inline-block px-3 py-1 rounded-full bg-orange-200 text-orange-800 text-sm font-medium border border-orange-300">
                      {getConditionText(rule)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Componentes de control sueltos */}
        <div className="flex items-center justify-end">
          {!isEditing ? (
            <div className="flex gap-2">
              {hasUpdatePermission && (
                <Button
                  className="px-6 py-2 font-semibold"
                  color="primary"
                  size="md"
                  variant="solid"
                  onClick={() => setIsEditing(true)}
                >
                  Editar
                </Button>
              )}
              {hasDeletePermission && (
                <Button
                  className="px-6 py-2 font-semibold"
                  color="danger"
                  size="md"
                  variant="solid"
                  onClick={() => onDelete(rule.id)}
                >
                  Eliminar
                </Button>
              )}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                className="px-6 py-2 font-semibold"
                color="default"
                size="md"
                variant="solid"
                onClick={() => {
                  setIsEditing(false);
                  // Reset form values
                  setRuleName(rule.name);
                  setSelectedSensorId(rule.measurementId);
                  setMode(rule.mode);
                  setOperator(rule.operator ?? ">");
                  setSetpoint(rule.setpoint?.toString() ?? "");
                  setMinValue(rule.minValue?.toString() ?? "");
                  setMaxValue(rule.maxValue?.toString() ?? "");
                }}
              >
                Cancelar
              </Button>
              <Button
                className="px-6 py-2 font-semibold"
                color="primary"
                size="md"
                variant="solid"
                onClick={handleSaveEdit}
              >
                Aceptar
              </Button>
            </div>
          )}
        </div>

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
                {rule.messages?.length ?? rule.mensajes?.length ?? 0}
              </Chip>
            </div>
            {hasCreateMessagePermission && (
              <Button
                className="text-white"
                color="success"
                size="sm"
                startContent={
                  <span className="text-white text-lg font-bold">+</span>
                }
                variant="solid"
                onClick={() => setShowAddMessageForm(true)}
              >
                Agregar
              </Button>
            )}
          </div>

          {!collapsedMessages && (
            <>
              {(rule.messages ?? rule.mensajes) && (rule.messages ?? rule.mensajes)!.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                  {(rule.messages ?? rule.mensajes)!.map((message, index) => {
                    // Map receptors to the format expected by MessageCard
                    // Backend returns: { id, externalId, name, isActive, ... }
                    const mappedReceptors = receptores
                      .filter((r) => {
                        const externalId = r.externalId || r.capcode;
                        return externalId && externalId.trim() !== "";
                      })
                      .map((r) => ({
                        id: r.id,
                        name: r.name || r.nombre || "",
                        externalId: r.externalId || r.capcode || "",
                        isActive: r.isActive ?? true,
                      }));
                    
                    return (
                      <MessageCard
                        key={message.id || `message-${index}-${message.targetId}`}
                        message={message}
                        torretas={torretas}
                        receptors={mappedReceptors}
                        emails={emails}
                        torretaColors={torretaColors}
                        onDelete={onDeleteMessage}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Text color="muted" variant="caption">
                    No hay mensajes configurados
                  </Text>
                </div>
              )}

              {showAddMessageForm && (
                <div className="mt-3">
                  <MessageForm
                    messageData={newMessageData}
                    torretas={torretas}
                    receptors={receptores
                      .filter((r) => {
                        const externalId = r.externalId || r.capcode;
                        return externalId && externalId.trim() !== "";
                      })
                      .map((r) => ({
                        id: r.id,
                        name: r.name || r.nombre || "",
                        externalId: r.externalId || r.capcode || "",
                        isActive: r.isActive ?? true,
                      }))}
                    emails={emails}
                    torretaColors={torretaColors}
                    onCreate={() => {
                      handleCreateMessage();
                      setShowAddMessageForm(false);
                      setNewMessageData({
                        messageType: "receptor" as "torreta" | "receptor" | "email",
                        targetId: "",
                        message: "",
                        color: undefined,
                        grupo: gruposMensajes[0]?.nombre ?? "",
                      });
                    }}
                    onUpdate={(updates) =>
                      setNewMessageData((prev) => ({ ...prev, ...updates }))
                    }
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};
