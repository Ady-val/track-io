import type {
  AlertRule,
  SensorType,
  Operator,
  GrupoMensaje,
  Receptor,
  UsuarioCorreo,
  NewMessageData,
  Message,
  SensorTypeValue,
} from "@components/organisms";

import React, { useState, useEffect } from "react";

import {
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  FaThermometerHalf,
  FaTint,
  FaWeightHanging,
  FaWater,
  FaWaveSquare,
  FaStream,
  FaCalculator,
} from "react-icons/fa";

import { Button, Text } from "@components/atoms";
import { LoadingState, EmptyState } from "@components/molecules";
import {
  PageHeader,
  AlertRuleCard,
  MessageForm,
  MessageCard,
} from "@components/organisms";
import { DashboardTemplate } from "@components/templates";

function AlertRules() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddMessageForm, setShowAddMessageForm] = useState<boolean>(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [newMessageData, setNewMessageData] = useState<NewMessageData>({
    tipoReceptor: "",
    receptor: "",
    receptorNombre: "",
    message: "",
  });
  const [collapsedMessages, setCollapsedMessages] = useState<
    Record<string, boolean>
  >({});
  const [disabled, setDisabled] = useState<boolean>(false);

  const operators: Operator[] = [
    { value: ">", label: "Mayor que (>)" },
    { value: ">=", label: "Mayor o igual (>=)" },
    { value: "<", label: "Menor que (<)" },
    { value: "<=", label: "Menor o igual (<=)" },
    { value: "==", label: "Igual (==)" },
    { value: "!=", label: "Diferente (!=)" },
  ];

  const sensorTypes: SensorType[] = [
    {
      value: "temperatura",
      label: "Temperatura",
      icon: FaThermometerHalf,
      color: "text-red-400",
    },
    {
      value: "humedad",
      label: "Humedad",
      icon: FaTint,
      color: "text-blue-400",
    },
    {
      value: "presion",
      label: "Presión",
      icon: FaWeightHanging,
      color: "text-purple-400",
    },
    { value: "nivel", label: "Nivel", icon: FaWater, color: "text-cyan-400" },
    {
      value: "vibracion",
      label: "Vibración",
      icon: FaWaveSquare,
      color: "text-orange-400",
    },
    { value: "flujo", label: "Flujo", icon: FaStream, color: "text-green-400" },
    {
      value: "totalizador",
      label: "Totalizador",
      icon: FaCalculator,
      color: "text-yellow-400",
    },
  ];

  const [gruposMensajes] = useState<GrupoMensaje[]>([
    {
      id: 1,
      nombre: "Alert",
      color: "#eab308",
      descripcion: "Alerta Amarilla",
    },
    {
      id: 2,
      nombre: "Warning",
      color: "#f97316",
      descripcion: "Advertencia Naranja",
    },
    {
      id: 3,
      nombre: "Critical",
      color: "#ef4444",
      descripcion: "Crítico Rojo",
    },
    {
      id: 4,
      nombre: "Final Escalation",
      color: "#dc2626",
      descripcion: "Escalación Final Rojo Oscuro",
    },
    {
      id: 5,
      nombre: "Running",
      color: "#22c55e",
      descripcion: "En Funcionamiento Verde",
    },
  ]);

  const [receptores] = useState<Receptor[]>([
    {
      id: 1,
      nombre: "Juan Pérez",
      capcode: "111111",
      departamento: "Seguridad Industrial",
    },
    {
      id: 2,
      nombre: "María García",
      capcode: "222222",
      departamento: "Mantenimiento",
    },
    {
      id: 3,
      nombre: "Carlos López",
      capcode: "333333",
      departamento: "Producción",
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      capcode: "444444",
      departamento: "Calidad",
    },
    {
      id: 5,
      nombre: "Luis Rodríguez",
      capcode: "555555",
      departamento: "Seguridad Industrial",
    },
  ]);

  const [usuariosCorreo] = useState<UsuarioCorreo[]>([
    {
      id: 1,
      nombre: "Juan Pérez",
      email: "juan.perez@empresa.com",
      departamento: "Seguridad Industrial",
    },
    {
      id: 2,
      nombre: "María García",
      email: "maria.garcia@empresa.com",
      departamento: "Mantenimiento",
    },
    {
      id: 3,
      nombre: "Carlos López",
      email: "carlos.lopez@empresa.com",
      departamento: "Producción",
    },
    {
      id: 4,
      nombre: "Ana Martínez",
      email: "ana.martinez@empresa.com",
      departamento: "Calidad",
    },
    {
      id: 5,
      nombre: "Luis Rodríguez",
      email: "luis.rodriguez@empresa.com",
      departamento: "Seguridad Industrial",
    },
    {
      id: 6,
      nombre: "Sofia Herrera",
      email: "sofia.herrera@empresa.com",
      departamento: "Administración",
    },
    {
      id: 7,
      nombre: "Miguel Torres",
      email: "miguel.torres@empresa.com",
      departamento: "Logística",
    },
  ]);

  const [coloresTorreta] = useState<string[]>([
    "Rojo",
    "Azul",
    "Verde",
    "Amarillo",
    "Naranja",
    "Morado",
    "Rosa",
    "Blanco",
  ]);

  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      Rojo: "#ef4444",
      Azul: "#3b82f6",
      Verde: "#22c55e",
      Amarillo: "#eab308",
      Naranja: "#f97316",
      Morado: "#a855f7",
      Rosa: "#ec4899",
      Blanco: "#ffffff",
    };

    return colorMap[colorName] ?? "#6b7280";
  };

  const getSensorIcon = (type: SensorTypeValue): React.ReactElement => {
    const sensorType = sensorTypes.find((s) => s.value === type);
    const IconComponent = sensorType?.icon ?? FaThermometerHalf;
    const colorClass = sensorType?.color ?? "text-gray-400";

    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  useEffect(() => {
    const mockRules: AlertRule[] = [
      {
        id: "1",
        name: "Temperatura Alta Tanque 1",
        sensorTag: "TANK1_TEMP",
        sensorType: "temperatura",
        mode: "setpoint",
        operator: ">",
        setpoint: 75.0,
        isEnabled: true,
        edit: false,
        mensajes: [
          {
            id: 1,
            tipoReceptor: "reloj",
            receptor: "Reloj",
            message: "Temperatura alta detectada en Tanque 1",
            grupo: "Warning",
            status: "warning",
          },
          {
            id: 2,
            tipoReceptor: "correo",
            receptor: "Juan Pérez",
            message:
              "Alerta: Temperatura crítica en Tanque 1 - Valor: {reading.value}°C",
            grupo: "Critical",
            status: "alert",
          },
        ],
      },
      {
        id: "2",
        name: "Vibración Crítica Motor 1",
        sensorTag: "MOTOR1_VIB",
        sensorType: "vibracion",
        mode: "setpoint",
        operator: ">",
        setpoint: 7.1,
        isEnabled: true,
        edit: false,
        mensajes: [
          {
            id: 3,
            tipoReceptor: "torreta",
            receptor: "Rojo",
            receptorNombre: "María García",
            grupo: "Critical",
            status: "alert",
          },
        ],
      },
      {
        id: "3",
        name: "Humedad Sala 1",
        sensorTag: "ROOM1_RH",
        sensorType: "humedad",
        mode: "window",
        minValue: 35,
        maxValue: 65,
        isEnabled: false,
        edit: false,
        mensajes: [],
      },
    ];

    setAlertRules(mockRules);
    setLoading(false);
  }, []);

  useEffect(() => {
    const hasEditTrue = alertRules.some((rule) => rule.edit);

    setDisabled(hasEditTrue);
  }, [alertRules]);

  const handleCreateNewRule = () => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name: "Nueva Condición de Monitoreo",
      sensorTag: "SENSOR_TAG",
      sensorType: "temperatura",
      mode: "setpoint",
      operator: ">",
      setpoint: 0,
      isEnabled: true,
      edit: true,
      mensajes: [],
    };

    setAlertRules((prevRules) => [newRule, ...prevRules]);

    setTimeout(() => {
      const newRuleElement = document.querySelector(
        `[data-rule-id="${newRule.id}"]`
      );

      if (newRuleElement) {
        newRuleElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
  };

  const toggleEditById = (id: string) => {
    setAlertRules((prevData) => {
      return prevData.map((rule) => {
        if (rule.id === id) {
          return { ...rule, edit: !rule.edit };
        } else {
          return rule;
        }
      });
    });
  };

  const handleEdit = async (
    id: string,
    name: string,
    sensorTag: string,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => {
    try {
      console.log("Actualizando regla:", {
        id,
        name,
        sensorTag,
        mode,
        operator,
        setpoint,
        minValue,
        maxValue,
      });

      setAlertRules((prevData) => {
        return prevData.map((rule) => {
          if (rule.id === id) {
            return {
              ...rule,
              name,
              sensorTag,
              mode,
              operator,
              setpoint: mode === "setpoint" ? parseFloat(setpoint) : undefined,
              minValue: mode === "window" ? parseFloat(minValue) : undefined,
              maxValue: mode === "window" ? parseFloat(maxValue) : undefined,
              edit: false,
            };
          }

          return rule;
        });
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      console.log("Eliminando regla:", id);
      setAlertRules((prevData) => {
        return prevData.filter((rule) => rule.id !== id);
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleToggleEnabled = (id: string) => {
    setAlertRules((prevData) => {
      return prevData.map((r) => {
        if (r.id === id) {
          return { ...r, isEnabled: !r.isEnabled };
        }

        return r;
      });
    });
  };

  const handleToggleSensorType = (id: string, sensorTypeStr: string) => {
    setAlertRules((prevData) => {
      return prevData.map((r) => {
        if (r.id === id) {
          return { ...r, sensorType: sensorTypeStr as SensorTypeValue };
        }

        return r;
      });
    });
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

    const newMessage: Message = {
      id: Date.now(),
      tipoReceptor: newMessageData.tipoReceptor as Message["tipoReceptor"],
      receptor: newMessageData.receptor,
      receptorNombre: newMessageData.receptorNombre,
      message: newMessageData.message,
      grupo: "Alert",
      status: "warning",
    };

    setAlertRules((prevData) => {
      return prevData.map((rule) => {
        if (rule.id === selectedRuleId) {
          return {
            ...rule,
            mensajes: [...(rule.mensajes || []), newMessage],
          };
        }

        return rule;
      });
    });

    setNewMessageData({
      tipoReceptor: "",
      receptor: "",
      receptorNombre: "",
      message: "",
    });
    setShowAddMessageForm(false);
  };

  const handleDeleteMessage = (messageId: number) => {
    setAlertRules((prevData) => {
      return prevData.map((rule) => {
        if (rule.mensajes) {
          return {
            ...rule,
            mensajes: rule.mensajes.filter(
              (message) => message.id !== messageId
            ),
          };
        }

        return rule;
      });
    });
  };

  const handleDuplicateMessage = (messageId: number) => {
    let messageToDuplicate: Message | null = null;
    let ruleId: string | null = null;

    alertRules.forEach((rule) => {
      if (rule.mensajes) {
        const message = rule.mensajes.find((m) => m.id === messageId);

        if (message) {
          messageToDuplicate = message;
          ruleId = rule.id;
        }
      }
    });

    if (messageToDuplicate && ruleId) {
      const duplicatedMessage: Message = {
        ...(messageToDuplicate as Message),
        id: Date.now() + Math.random(),
      };

      setAlertRules((prevData) => {
        return prevData.map((rule) => {
          if (rule.id === ruleId) {
            return {
              ...rule,
              mensajes: [...(rule.mensajes || []), duplicatedMessage],
            };
          }

          return rule;
        });
      });
    }
  };

  const handleUpdateMessage = (
    messageId: number,
    updates: Partial<Message>
  ) => {
    setAlertRules((prevData) => {
      return prevData.map((rule) => {
        if (rule.mensajes) {
          return {
            ...rule,
            mensajes: rule.mensajes.map((msg) => {
              if (msg.id === messageId) {
                return { ...msg, ...updates };
              }

              return msg;
            }),
          };
        }

        return rule;
      });
    });
  };

  const toggleMessageCollapse = (ruleId: string) => {
    setCollapsedMessages((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  return (
    <DashboardTemplate>
      {loading ? (
        <LoadingState message="Cargando condiciones de monitoreo..." />
      ) : (
        <>
          <PageHeader
            action={{
              label: `Agregar Condición (${alertRules.length})`,
              icon: <FaExclamationTriangle className="w-5 h-5" />,
              onClick: handleCreateNewRule,
            }}
            description="Administra las reglas que definen cuándo se activan las alertas"
            title="Monitoreo de Condiciones"
          />

          <div
            className="space-y-4"
            style={{ overflow: "visible", height: "auto" }}
          >
            {alertRules.length === 0 ? (
              <EmptyState
                description="Comienza creando tu primera condición de monitoreo"
                icon={FaExclamationTriangle}
                title="No hay condiciones de monitoreo configuradas"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {alertRules.map((rule) => (
                  <AlertRuleCard
                    key={rule.id}
                    disabled={disabled}
                    getSensorIcon={getSensorIcon}
                    operators={operators}
                    rule={rule}
                    sensorTypes={sensorTypes}
                    onDelete={handleDelete}
                    onEdit={handleEdit}
                    onToggleEdit={toggleEditById}
                    onToggleEnabled={handleToggleEnabled}
                    onToggleSensorType={handleToggleSensorType}
                  >
                    <div className="mt-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            className="text-slate-400 hover:text-slate-200 transition-colors"
                            title={
                              collapsedMessages[rule.id]
                                ? "Expandir mensajes"
                                : "Colapsar mensajes"
                            }
                            onClick={() => toggleMessageCollapse(rule.id)}
                          >
                            {collapsedMessages[rule.id] ? (
                              <FaChevronDown className="w-4 h-4" />
                            ) : (
                              <FaChevronUp className="w-4 h-4" />
                            )}
                          </button>
                          <div className="text-blue-500 text-xl">📨</div>
                          <Text variant="h4">
                            Mensajes ({rule.mensajes?.length ?? 0})
                          </Text>
                        </div>
                        <Button
                          color="success"
                          size="sm"
                          onClick={() => {
                            setSelectedRuleId(rule.id);
                            setShowAddMessageForm(true);
                          }}
                        >
                          ➕ Agregar Mensaje
                        </Button>
                      </div>

                      {!collapsedMessages[rule.id] && (
                        <>
                          {showAddMessageForm && selectedRuleId === rule.id && (
                            <MessageForm
                              coloresTorreta={coloresTorreta}
                              getColorValue={getColorValue}
                              messageData={newMessageData}
                              receptores={receptores}
                              usuariosCorreo={usuariosCorreo}
                              onCancel={() => setShowAddMessageForm(false)}
                              onCreate={handleCreateMessage}
                              onUpdate={(updates) =>
                                setNewMessageData((prev) => ({
                                  ...prev,
                                  ...updates,
                                }))
                              }
                            />
                          )}

                          {rule.mensajes.length > 0 && (
                            <div className="space-y-3">
                              {rule.mensajes.map((message) => (
                                <MessageCard
                                  key={message.id}
                                  coloresTorreta={coloresTorreta}
                                  getColorValue={getColorValue}
                                  gruposMensajes={gruposMensajes}
                                  message={message}
                                  receptores={receptores}
                                  usuariosCorreo={usuariosCorreo}
                                  onDelete={handleDeleteMessage}
                                  onDuplicate={handleDuplicateMessage}
                                  onUpdate={handleUpdateMessage}
                                />
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </AlertRuleCard>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardTemplate>
  );
}

export default AlertRules;
