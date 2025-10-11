import type {
  AlertRule,
  SensorType,
  Sensor,
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
  FaTriangleExclamation,
  FaChevronDown,
  FaChevronUp,
  FaTemperatureHalf,
  FaDroplet,
  FaWeightHanging,
  FaWater,
  FaWaveSquare,
  FaArrowsLeftRightToLine,
  FaCalculator,
} from "react-icons/fa6";

import { Button, Text } from "@components/atoms";
import { LoadingState, EmptyState } from "@components/molecules";
import {
  PageHeader,
  CompactAlertCard,
  AlertRuleDetailModal,
  CreateAlertRuleModal,
} from "@components/organisms";
import { DashboardTemplate } from "@components/templates";

function AlertRules() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRule, setSelectedRule] = useState<AlertRule | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

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
      icon: FaTemperatureHalf,
      color: "text-red-400",
    },
    {
      value: "humedad",
      label: "Humedad",
      icon: FaDroplet,
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
    {
      value: "flujo",
      label: "Flujo",
      icon: FaArrowsLeftRightToLine,
      color: "text-green-400",
    },
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
    const IconComponent = sensorType?.icon ?? FaTemperatureHalf;
    const colorClass = sensorType?.color ?? "text-gray-400";

    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

  useEffect(() => {
    // Mock de sensores (basado en la entidad Measurement)
    const mockSensors: Sensor[] = [
      {
        id: 1,
        externalId: "TANK1_TEMP",
        name: "Sensor de Temperatura Tanque 1",
        type: "temperatura",
        area: "Producción - Zona A",
        status: "active",
      },
      {
        id: 2,
        externalId: "TANK2_TEMP",
        name: "Sensor de Temperatura Tanque 2",
        type: "temperatura",
        area: "Producción - Zona B",
        status: "active",
      },
      {
        id: 3,
        externalId: "MOTOR1_VIB",
        name: "Sensor de Vibración Motor Principal",
        type: "vibracion",
        area: "Maquinaria",
        status: "active",
      },
      {
        id: 4,
        externalId: "ROOM1_RH",
        name: "Sensor de Humedad Sala Limpia 1",
        type: "humedad",
        area: "Control de Calidad",
        status: "active",
      },
      {
        id: 5,
        externalId: "PUMP1_PRESS",
        name: "Sensor de Presión Bomba 1",
        type: "presion",
        area: "Sistema Hidráulico",
        status: "active",
      },
      {
        id: 6,
        externalId: "TANK3_LEVEL",
        name: "Sensor de Nivel Tanque 3",
        type: "nivel",
        area: "Almacenamiento",
        status: "active",
      },
      {
        id: 7,
        externalId: "PIPE1_FLOW",
        name: "Sensor de Flujo Tubería Principal",
        type: "flujo",
        area: "Distribución",
        status: "active",
      },
      {
        id: 8,
        externalId: "METER1_TOTAL",
        name: "Totalizador Medidor 1",
        type: "totalizador",
        area: "Medición General",
        status: "active",
      },
      {
        id: 9,
        externalId: "ROOM2_TEMP",
        name: "Sensor de Temperatura Sala de Servidores",
        type: "temperatura",
        area: "IT",
        status: "maintenance",
      },
      {
        id: 10,
        externalId: "MOTOR2_VIB",
        name: "Sensor de Vibración Motor Secundario",
        type: "vibracion",
        area: "Maquinaria",
        status: "active",
      },
    ];

    const mockRules: AlertRule[] = [
      {
        id: "1",
        name: "Temperatura Alta Tanque 1",
        sensorId: 1, // TANK1_TEMP
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
        sensorId: 3, // MOTOR1_VIB
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
        name: "Humedad Sala Limpia 1",
        sensorId: 4, // ROOM1_RH
        mode: "window",
        minValue: 35,
        maxValue: 65,
        isEnabled: false,
        edit: false,
        mensajes: [],
      },
    ];

    setSensors(mockSensors);
    setAlertRules(mockRules);
    setLoading(false);
  }, []);

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateRule = (
    name: string,
    sensorId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => {
    const newRule: AlertRule = {
      id: Date.now().toString(),
      name,
      sensorId,
      mode,
      operator,
      setpoint: mode === "setpoint" ? parseFloat(setpoint) : undefined,
      minValue: mode === "window" ? parseFloat(minValue) : undefined,
      maxValue: mode === "window" ? parseFloat(maxValue) : undefined,
      isEnabled: true,
      edit: false,
      mensajes: [],
    };

    setAlertRules((prevRules) => [newRule, ...prevRules]);
  };

  const handleOpenDetailModal = (rule: AlertRule) => {
    setSelectedRule(rule);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedRule(null);
  };

  const handleEditRule = (
    id: string,
    name: string,
    sensorId: number,
    mode: "setpoint" | "window",
    operator: string,
    setpoint: string,
    minValue: string,
    maxValue: string
  ) => {
    setAlertRules((prevData) => {
      const updatedRules = prevData.map((rule) => {
        if (rule.id === id) {
          return {
            ...rule,
            name,
            sensorId,
            mode,
            operator,
            setpoint: mode === "setpoint" ? parseFloat(setpoint) : undefined,
            minValue: mode === "window" ? parseFloat(minValue) : undefined,
            maxValue: mode === "window" ? parseFloat(maxValue) : undefined,
          };
        }
        return rule;
      });

      // Actualizar selectedRule si es la regla actual
      const updatedRule = updatedRules.find((r) => r.id === id);
      if (updatedRule && selectedRule?.id === id) {
        setSelectedRule(updatedRule);
      }

      return updatedRules;
    });
  };

  const handleDeleteRule = (id: string) => {
    setAlertRules((prevData) => prevData.filter((rule) => rule.id !== id));
  };

  const handleToggleEnabled = (id: string) => {
    setAlertRules((prevData) => {
      const updatedRules = prevData.map((r) => {
        if (r.id === id) {
          return { ...r, isEnabled: !r.isEnabled };
        }
        return r;
      });

      // Actualizar selectedRule si es la regla actual
      const updatedRule = updatedRules.find((r) => r.id === id);
      if (updatedRule && selectedRule?.id === id) {
        setSelectedRule(updatedRule);
      }

      return updatedRules;
    });
  };

  const handleCreateMessage = (ruleId: string, messageData: NewMessageData) => {
    const newMessage: Message = {
      id: Date.now(),
      tipoReceptor: messageData.tipoReceptor as Message["tipoReceptor"],
      receptor: messageData.receptor,
      receptorNombre: messageData.receptorNombre,
      message: messageData.message,
      grupo: "Alert",
      status: "warning",
    };

    setAlertRules((prevData) => {
      const updatedRules = prevData.map((rule) => {
        if (rule.id === ruleId) {
          return {
            ...rule,
            mensajes: [...(rule.mensajes || []), newMessage],
          };
        }
        return rule;
      });

      // Actualizar selectedRule si es la regla actual
      const updatedRule = updatedRules.find((r) => r.id === ruleId);
      if (updatedRule && selectedRule?.id === ruleId) {
        setSelectedRule(updatedRule);
      }

      return updatedRules;
    });
  };

  const handleDeleteMessage = (messageId: number) => {
    setAlertRules((prevData) => {
      const updatedRules = prevData.map((rule) => {
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

      // Actualizar selectedRule si tiene el mensaje
      if (selectedRule) {
        const updatedRule = updatedRules.find((r) => r.id === selectedRule.id);
        if (updatedRule) {
          setSelectedRule(updatedRule);
        }
      }

      return updatedRules;
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
        const updatedRules = prevData.map((rule) => {
          if (rule.id === ruleId) {
            return {
              ...rule,
              mensajes: [...(rule.mensajes || []), duplicatedMessage],
            };
          }
          return rule;
        });

        // Actualizar selectedRule si es la regla actual
        const updatedRule = updatedRules.find((r) => r.id === ruleId);
        if (updatedRule && selectedRule?.id === ruleId) {
          setSelectedRule(updatedRule);
        }

        return updatedRules;
      });
    }
  };

  const handleUpdateMessage = (
    messageId: number,
    updates: Partial<Message>
  ) => {
    setAlertRules((prevData) => {
      const updatedRules = prevData.map((rule) => {
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

      // Actualizar selectedRule si tiene el mensaje
      if (selectedRule) {
        const updatedRule = updatedRules.find((r) => r.id === selectedRule.id);
        if (updatedRule) {
          setSelectedRule(updatedRule);
        }
      }

      return updatedRules;
    });
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
              icon: <FaTriangleExclamation className="w-5 h-5" />,
              onClick: handleOpenCreateModal,
            }}
            description="Administra las reglas que definen cuándo se activan las alertas"
            title="Monitoreo de Condiciones"
          />

          <div className="mt-6">
            {alertRules.length === 0 ? (
              <EmptyState
                description="Comienza creando tu primera condición de monitoreo"
                icon={FaTriangleExclamation}
                title="No hay condiciones de monitoreo configuradas"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alertRules.map((rule) => (
                  <CompactAlertCard
                    key={rule.id}
                    getSensorIcon={getSensorIcon}
                    rule={rule}
                    sensor={sensors.find((s) => s.id === rule.sensorId)}
                    sensorTypes={sensorTypes}
                    onClick={handleOpenDetailModal}
                    onToggleEnabled={handleToggleEnabled}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Modal de detalle/edición */}
          <AlertRuleDetailModal
            coloresTorreta={coloresTorreta}
            getColorValue={getColorValue}
            getSensorIcon={getSensorIcon}
            gruposMensajes={gruposMensajes}
            isOpen={isDetailModalOpen}
            operators={operators}
            receptores={receptores}
            rule={selectedRule}
            sensors={sensors}
            sensorTypes={sensorTypes}
            usuariosCorreo={usuariosCorreo}
            onClose={handleCloseDetailModal}
            onCreateMessage={handleCreateMessage}
            onDelete={handleDeleteRule}
            onDeleteMessage={handleDeleteMessage}
            onDuplicateMessage={handleDuplicateMessage}
            onEdit={handleEditRule}
            onToggleEnabled={handleToggleEnabled}
            onUpdateMessage={handleUpdateMessage}
          />

          {/* Modal de creación */}
          <CreateAlertRuleModal
            isOpen={isCreateModalOpen}
            operators={operators}
            sensors={sensors}
            sensorTypes={sensorTypes}
            onClose={handleCloseCreateModal}
            onCreate={handleCreateRule}
          />
        </>
      )}
    </DashboardTemplate>
  );
}

export default AlertRules;
