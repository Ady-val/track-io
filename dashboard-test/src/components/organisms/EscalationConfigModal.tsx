import type { Device } from "../../types/device";
import type {
  EscalationConfig,
  EscalationMessage,
  EscalationLevel,
} from "../../types/escalation";

import React, { useState, useEffect } from "react";

import {
  FaTimes,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

import { useEscalationConfig } from "../../hooks/useEscalationConfig";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { Text } from "../atoms/Text";

interface EscalationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: Device | null;
  signal: { id: number; name: string } | null;
  onSuccess?: () => void;
}

const ESCALATION_LEVELS: EscalationLevel[] = [
  { level: "alert", label: "Alerta Inmediata", delayMinutes: 0, messages: [] },
  { level: "warning", label: "Advertencia", delayMinutes: 20, messages: [] },
  {
    level: "escalation1",
    label: "Escalamiento 1",
    delayMinutes: 40,
    messages: [],
  },
  {
    level: "escalation2",
    label: "Escalamiento 2",
    delayMinutes: 60,
    messages: [],
  },
  {
    level: "escalation3",
    label: "Escalamiento 3",
    delayMinutes: 80,
    messages: [],
  },
  {
    level: "close",
    label: "Cierre de Evento",
    delayMinutes: 0,
    messages: [],
  },
];

const MESSAGE_TYPES = [
  { value: "torreta", label: "Torreta" },
  { value: "receptor", label: "Receptor" },
  { value: "email", label: "Email" },
];

const getTextColorForBackground = (backgroundColor: string): string => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const isMessageFormValid = (
  message: Partial<EscalationMessage> | undefined
): boolean => {
  if (!message?.messageType || !message?.targetId) {
    return false;
  }

  if (message.messageType === "torreta") {
    return !!message.color;
  }

  return !!message.message && message.message.trim().length > 0;
};

export const EscalationConfigModal: React.FC<EscalationConfigModalProps> = ({
  isOpen,
  onClose,
  device,
  signal,
  onSuccess,
}) => {
  const deviceId = device?.id ?? 0;
  const deviceSignalId = signal?.id ?? 0;

  const {
    config,
    messages,
    torretas,
    receptors,
    torretaColors,
    emails,
    saveConfig,
    loadData,
  } = useEscalationConfig({
    deviceId,
    deviceSignalId,
  });

  const [escalationLevels, setEscalationLevels] = useState<EscalationLevel[]>(
    []
  );
  const [editingDelay, setEditingDelay] = useState<{
    level: string;
    value: number;
  } | null>(null);
  const [newMessages, setNewMessages] = useState<
    Record<string, Partial<EscalationMessage>>
  >({});

  const [localConfig, setLocalConfig] = useState<EscalationConfig | null>(null);
  const [localMessages, setLocalMessages] = useState<EscalationMessage[]>([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      setLocalConfig(config);
      setLocalMessages(messages);
      setNewMessages({});
      setEditingDelay(null);
      setLocalError(null);
      setExpandedLevels(new Set());
    } else {
      setLocalConfig(null);
      setLocalMessages([]);
      setNewMessages({});
      setEditingDelay(null);
      setLocalError(null);
      setExpandedLevels(new Set());
    }
  }, [isOpen, config, messages]);

  useEffect(() => {
    const levelsWithMessages = ESCALATION_LEVELS.map((level) => ({
      ...level,
      delayMinutes: getDelayForLevel(level.level, localConfig),
      messages: localMessages.filter(
        (m) => m.level === level.level && !m.deletedAt
      ),
    }));

    setEscalationLevels(levelsWithMessages);
  }, [localConfig, localMessages]);

  const getDelayForLevel = (
    level: string,
    currentConfig: EscalationConfig | null
  ): number => {
    if (level === "close") {
      return 0;
    }

    if (!currentConfig) {
      switch (level) {
        case "alert":
          return 0;
        case "warning":
          return 20;
        case "escalation1":
          return 40;
        case "escalation2":
          return 60;
        case "escalation3":
          return 80;
        default:
          return 0;
      }
    }

    switch (level) {
      case "alert":
        return 0;
      case "warning":
        return currentConfig.warningDelayMinutes;
      case "escalation1":
        return currentConfig.escalation1DelayMinutes;
      case "escalation2":
        return currentConfig.escalation2DelayMinutes;
      case "escalation3":
        return currentConfig.escalation3DelayMinutes;
      default:
        return 0;
    }
  };

  const handleDelayChange = (level: string, newDelay: number) => {
    setLocalConfig((prevConfig) => {
      let updatedConfig: EscalationConfig;

      if (!prevConfig) {
        updatedConfig = {
          deviceId: device?.id ?? 0,
          deviceSignalId: signal?.id ?? 0,
          endpointUrl: "http://localhost:1880/events",
          warningDelayMinutes: 20,
          escalation1DelayMinutes: 40,
          escalation2DelayMinutes: 60,
          escalation3DelayMinutes: 80,
          isActive: true,
        } as EscalationConfig;
      } else {
        updatedConfig = { ...prevConfig };
      }

      switch (level) {
        case "warning":
          updatedConfig.warningDelayMinutes = newDelay;
          break;
        case "escalation1":
          updatedConfig.escalation1DelayMinutes = newDelay;
          break;
        case "escalation2":
          updatedConfig.escalation2DelayMinutes = newDelay;
          break;
        case "escalation3":
          updatedConfig.escalation3DelayMinutes = newDelay;
          break;
      }

      return updatedConfig;
    });
  };

  const handleAddMessage = (level: string) => {
    const currentMessage = newMessages[level];

    if (!currentMessage?.messageType || !currentMessage?.targetId) {
      return;
    }

    if (currentMessage.messageType === "torreta" && !currentMessage.color) {
      return;
    }
    if (currentMessage.messageType !== "torreta" && !currentMessage.message) {
      return;
    }

    if (!localConfig) {
      setLocalConfig({
        deviceId: device?.id ?? 0,
        deviceSignalId: signal?.id ?? 0,
        endpointUrl: "http://localhost:1880/events",
        warningDelayMinutes: 20,
        escalation1DelayMinutes: 40,
        escalation2DelayMinutes: 60,
        escalation3DelayMinutes: 80,
        isActive: true,
      });
    }

    const message: EscalationMessage = {
      id: Date.now() * -1,
      escalationConfigId: localConfig?.id,
      level: level as EscalationLevel["level"],
      messageType: currentMessage.messageType,
      targetId: currentMessage.targetId,
      message: currentMessage.message ?? "",
      color: currentMessage.color,
    };

    setLocalMessages((prev) => [...prev, message]);

    setNewMessages((prev) => ({
      ...prev,
      [level]: {},
    }));
  };

  const handleDeleteMessage = (messageId: number) => {
    setLocalMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, deletedAt: new Date() } : msg
      )
    );
  };

  const toggleLevelExpansion = (level: string) => {
    setExpandedLevels((prev) => {
      const newSet = new Set(prev);

      if (newSet.has(level)) {
        newSet.delete(level);
      } else {
        newSet.add(level);
      }

      return newSet;
    });
  };

  const getTargetOptions = (messageType: string) => {
    switch (messageType) {
      case "torreta":
        return Array.isArray(torretas)
          ? torretas
              .filter((t) => t.externalId != null && t.externalId.trim() !== "")
              .map((t) => ({
                value: t.externalId,
                label: `${t.name} (${t.externalId})`,
              }))
          : [];
      case "receptor":
        return Array.isArray(receptors)
          ? receptors
              .filter((r) => r.externalId != null && r.externalId.trim() !== "")
              .map((r) => ({
                value: r.externalId,
                label: `${r.name} (${r.externalId})`,
              }))
          : [];
      case "email":
        return Array.isArray(emails)
          ? emails.map((e) => ({
              value: e.email,
              label: `${e.name} - ${e.email}`,
            }))
          : [];
      default:
        return [];
    }
  };

  const handleSaveAll = async () => {
    setLocalLoading(true);
    setLocalError(null);

    try {
      const configToSave = localConfig ?? {
        deviceId: device?.id ?? 0,
        deviceSignalId: signal?.id ?? 0,
        endpointUrl: "http://localhost:1880/events",
        warningDelayMinutes: 20,
        escalation1DelayMinutes: 40,
        escalation2DelayMinutes: 60,
        escalation3DelayMinutes: 80,
        isActive: true,
      };

      const activeMessages = localMessages.filter((msg) => !msg.deletedAt);

      const savedConfig = await saveConfig(configToSave, activeMessages);

      if (!savedConfig) {
        throw new Error("Failed to save escalation configuration.");
      }
      setLocalConfig(savedConfig);

      await loadData();

      onSuccess?.();
      onClose();
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Error saving configuration."
      );
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setLocalConfig(null);
      setLocalMessages([]);
      setNewMessages({});
      setEditingDelay(null);
      setLocalError(null);
      setExpandedLevels(new Set());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />

      <div
        className="relative w-full max-w-5xl animate-in fade-in zoom-in-95 duration-200"
        data-cy="escalation-modal"
        role="dialog"
      >
        <div className="bg-slate-800 border border-slate-600 shadow-2xl rounded-xl overflow-hidden flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
            <div>
              <Text color="primary" variant="h3">
                Configuración de Escalamientos
              </Text>
              <Text className="mt-1" color="muted" variant="caption">
                {device?.name} - {signal?.name}
              </Text>
            </div>
            <button
              className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-700/50 rounded"
              data-cy="close-modal"
              onClick={onClose}
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {localError && (
                <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                  <Text color="danger">Error: {localError}</Text>
                </div>
              )}

              {localLoading && (
                <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
                  <Text color="primary">Cargando configuración...</Text>
                </div>
              )}

              <div className="space-y-4">
                {escalationLevels.map((level) => (
                  <div
                    key={level.level}
                    className="bg-slate-800 rounded-lg border border-slate-600"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-slate-600">
                      <div className="flex items-center space-x-4">
                        <div className="w-48">
                          <Text color="primary" variant="h4">
                            {level.label}
                          </Text>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Text color="muted" variant="caption">
                            Tiempo:
                          </Text>
                          {level.level === "close" ? (
                            <div className="flex items-center space-x-2">
                              <Text color="primary" variant="body">
                                Inmediato
                              </Text>
                              <Text color="muted" variant="caption">
                                (No configurable)
                              </Text>
                            </div>
                          ) : editingDelay?.level === level.level ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                className="w-20 bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                                type="text"
                                value={editingDelay.value.toString()}
                                onChange={(e) =>
                                  setEditingDelay({
                                    level: level.level,
                                    value: parseInt(e.target.value) || 0,
                                  })
                                }
                              />
                              <Text color="muted" variant="caption">
                                min
                              </Text>
                              <Button
                                className="flex items-center justify-center w-8 h-8 font-semibold"
                                color="success"
                                size="sm"
                                title="Guardar tiempo"
                                variant="solid"
                                onPress={() => {
                                  handleDelayChange(
                                    level.level,
                                    editingDelay.value
                                  );
                                  setEditingDelay(null);
                                }}
                              >
                                <FaSave className="w-4 h-4 text-white" />
                              </Button>
                              <Button
                                className="flex items-center justify-center w-8 h-8 font-semibold"
                                color="danger"
                                size="sm"
                                title="Cancelar"
                                variant="solid"
                                onPress={() => setEditingDelay(null)}
                              >
                                <FaTimes className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <Text color="primary" variant="body">
                                {level.delayMinutes} min
                              </Text>
                              <Button
                                className="flex items-center justify-center w-8 h-8 font-semibold"
                                color="warning"
                                size="sm"
                                title="Editar tiempo"
                                variant="solid"
                                onPress={() =>
                                  setEditingDelay({
                                    level: level.level,
                                    value: level.delayMinutes,
                                  })
                                }
                              >
                                <FaEdit className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          className="flex items-center justify-center text-slate-300 hover:text-white transition-colors duration-200 group"
                          title={`${level.messages.length} mensajes configurados`}
                          onClick={() => toggleLevelExpansion(level.level)}
                        >
                          {expandedLevels.has(level.level) ? (
                            <FaChevronDown className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          ) : (
                            <FaChevronRight className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          )}
                          <span className="ml-2 font-medium">
                            {level.messages.length}
                          </span>
                        </button>
                      </div>
                    </div>

                    {expandedLevels.has(level.level) && (
                      <div className="p-3">
                        <div className="space-y-2">
                          {level.messages.length === 0 ? (
                            <div className="text-center py-2 text-slate-400 text-sm">
                              No hay mensajes configurados para este nivel
                            </div>
                          ) : (
                            level.messages
                              .filter((m) => !m.deletedAt)
                              .map((message, index) => (
                                <div
                                  key={message.id ?? `temp-${index}`}
                                  className="flex items-center justify-between bg-slate-700 rounded-lg p-2"
                                >
                                  <div className="flex items-center space-x-4">
                                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                                    <div>
                                      <Text color="primary" variant="body">
                                        {message.messageType === "torreta"
                                          ? "Torreta"
                                          : message.messageType === "receptor"
                                            ? "Receptor"
                                            : "Email"}
                                      </Text>
                                      <Text color="muted" variant="caption">
                                        {message.targetId}
                                      </Text>
                                    </div>
                                    <div>
                                      {message.messageType === "torreta" ? (
                                        <div className="flex items-center space-x-2">
                                          {(() => {
                                            const torretaColor = Array.isArray(
                                              torretaColors
                                            )
                                              ? torretaColors.find(
                                                  (c) =>
                                                    c.deviceColorId ===
                                                    message.color
                                                )
                                              : null;

                                            return (
                                              <>
                                                <div
                                                  className="w-4 h-4 rounded border border-slate-400"
                                                  style={{
                                                    backgroundColor:
                                                      torretaColor?.htmlColor ||
                                                      "#000000",
                                                  }}
                                                />
                                                <Text
                                                  color="muted"
                                                  variant="caption"
                                                >
                                                  {torretaColor
                                                    ? `${torretaColor.name} - ${torretaColor.deviceColorId}`
                                                    : message.color ||
                                                      "Sin color"}
                                                </Text>
                                              </>
                                            );
                                          })()}
                                        </div>
                                      ) : (
                                        <Text color="muted" variant="caption">
                                          {message.message}
                                        </Text>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    className="flex items-center justify-center w-8 h-8 font-semibold"
                                    color="danger"
                                    size="sm"
                                    title="Eliminar mensaje"
                                    variant="solid"
                                    onPress={() => {
                                      if (message.id) {
                                        handleDeleteMessage(message.id);
                                      } else {
                                        setLocalMessages((prev) =>
                                          prev.filter((msg) => msg !== message)
                                        );
                                      }
                                    }}
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))
                          )}

                          <div className="bg-slate-700 rounded-lg p-2">
                            <div className="flex items-center space-x-2">
                              <Select
                                className="w-32"
                                value={
                                  newMessages[level.level]?.messageType ?? ""
                                }
                                onChange={(e) =>
                                  setNewMessages((prev) => ({
                                    ...prev,
                                    [level.level]: {
                                      ...prev[level.level],
                                      messageType: e.target
                                        .value as EscalationMessage["messageType"],
                                      targetId: undefined,
                                      message: undefined,
                                      color: undefined,
                                    },
                                  }))
                                }
                              >
                                <option value="">Tipo</option>
                                {MESSAGE_TYPES.map((type) => (
                                  <option key={type.value} value={type.value}>
                                    {type.label}
                                  </option>
                                ))}
                              </Select>

                              {newMessages[level.level]?.messageType && (
                                <Select
                                  className="w-48"
                                  value={
                                    newMessages[level.level]?.targetId ?? ""
                                  }
                                  onChange={(e) =>
                                    setNewMessages((prev) => ({
                                      ...prev,
                                      [level.level]: {
                                        ...prev[level.level],
                                        targetId: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  <option value="">Dispositivo</option>
                                  {getTargetOptions(
                                    newMessages[level.level]?.messageType ?? ""
                                  ).map((option) => (
                                    <option
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </option>
                                  ))}
                                </Select>
                              )}

                              {newMessages[level.level]?.messageType ===
                                "torreta" && (
                                <Select
                                  className="w-48"
                                  value={newMessages[level.level]?.color ?? ""}
                                  onChange={(e) =>
                                    setNewMessages((prev) => ({
                                      ...prev,
                                      [level.level]: {
                                        ...prev[level.level],
                                        color: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  <option value="">Color</option>
                                  {Array.isArray(torretaColors) &&
                                    torretaColors
                                      .sort((a, b) =>
                                        a.name.localeCompare(b.name)
                                      )
                                      .map((color) => (
                                        <option
                                          key={color.id}
                                          style={{
                                            backgroundColor: color.htmlColor,
                                            color: getTextColorForBackground(
                                              color.htmlColor
                                            ),
                                          }}
                                          value={color.deviceColorId}
                                        >
                                          {color.name} - {color.deviceColorId}
                                        </option>
                                      ))}
                                </Select>
                              )}

                              {newMessages[level.level]?.messageType !==
                                "torreta" && (
                                <Input
                                  className="flex-1 min-w-0 bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500"
                                  placeholder="Mensaje"
                                  value={
                                    newMessages[level.level]?.message ?? ""
                                  }
                                  onChange={(e) =>
                                    setNewMessages((prev) => ({
                                      ...prev,
                                      [level.level]: {
                                        ...prev[level.level],
                                        message: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              )}

                              <Button
                                className={`flex items-center justify-center w-8 h-8 font-semibold ${
                                  isMessageFormValid(newMessages[level.level])
                                    ? ""
                                    : "opacity-50 cursor-not-allowed"
                                }`}
                                color="success"
                                disabled={
                                  !isMessageFormValid(newMessages[level.level])
                                }
                                size="sm"
                                title="Agregar mensaje"
                                variant="solid"
                                onPress={() => handleAddMessage(level.level)}
                              >
                                <FaPlus className="w-4 h-4 text-white" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 p-6 border-t border-slate-600 flex-shrink-0">
            <Button color="default" variant="solid" onPress={onClose}>
              Cancelar
            </Button>
            <Button
              color="primary"
              disabled={localLoading}
              variant="solid"
              onPress={handleSaveAll}
            >
              {localLoading ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
