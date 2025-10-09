import React, { useState, useEffect } from "react";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { type IconType } from "react-icons";
import {
  FaEdit,
  FaTrashAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaThermometerHalf,
  FaTint,
  FaWeightHanging,
  FaWater,
  FaWaveSquare,
  FaStream,
  FaCalculator,
} from "react-icons/fa";

interface Message {
  id: number;
  tipoReceptor: "reloj" | "torreta" | "correo" | "generico";
  receptor: string;
  receptorNombre?: string;
  message?: string;
  grupo: string;
  status: string;
}

interface AlertRule {
  id: string;
  name: string;
  sensorTag: string;
  sensorType: SensorTypeValue;
  mode: "setpoint" | "window";
  operator?: string;
  setpoint?: number;
  minValue?: number;
  maxValue?: number;
  isEnabled: boolean;
  edit: boolean;
  mensajes: Message[];
}

interface SensorType {
  value: SensorTypeValue;
  label: string;
  icon: IconType;
  color: string;
}

type SensorTypeValue =
  | "temperatura"
  | "humedad"
  | "presion"
  | "nivel"
  | "vibracion"
  | "flujo"
  | "totalizador";

interface Operator {
  value: string;
  label: string;
}

interface GrupoMensaje {
  id: number;
  nombre: string;
  color: string;
  descripcion: string;
}

interface Receptor {
  id: number;
  nombre: string;
  capcode: string;
  departamento: string;
}

interface UsuarioCorreo {
  id: number;
  nombre: string;
  email: string;
  departamento: string;
}

interface NewMessageData {
  tipoReceptor: string;
  receptor: string;
  receptorNombre: string;
  message: string;
}

interface AlertRulesTableProps {
  data: AlertRule[];
  setAlertRules: React.Dispatch<React.SetStateAction<AlertRule[]>>;
}

function AlertRules() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="bg-slate-900 p-6 min-h-screen">
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center space-y-4">
            <Spinner color="primary" size="lg" />
            <p className="text-slate-400 font-medium">
              Cargando condiciones de monitoreo...
            </p>
          </div>
        </div>
      ) : (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
          <Card className="bg-slate-800 border-slate-700">
            <CardBody className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-100 mb-2">
                    Monitoreo de Condiciones
                  </h2>
                  <p className="text-slate-400">
                    Administra las reglas que definen cuándo se activan las
                    alertas
                  </p>
                </div>
                <Button
                  color="primary"
                  size="lg"
                  startContent={<FaExclamationTriangle className="w-5 h-5" />}
                  onClick={handleCreateNewRule}
                >
                  Agregar Condición ({alertRules.length})
                </Button>
              </div>
              <AlertRulesTable
                data={alertRules}
                setAlertRules={setAlertRules}
              />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

const AlertRulesTable: React.FC<AlertRulesTableProps> = ({
  data,
  setAlertRules,
}) => {
  const alertRules = data;
  const [ruleName, setRuleName] = useState<string>("");
  const [sensorTag, setSensorTag] = useState<string>("");
  const [mode, setMode] = useState<"setpoint" | "window">("setpoint");
  const [operator, setOperator] = useState<string>(">");
  const [setpoint, setSetpoint] = useState<string>("");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");
  const [disabled, setDisabled] = useState<boolean>(false);
  const [showAddMessageForm, setShowAddMessageForm] = useState<boolean>(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [newMessageData, setNewMessageData] = useState<NewMessageData>({
    tipoReceptor: "",
    receptor: "",
    receptorNombre: "",
    message: "",
  });
  const [collapsedRules, setCollapsedRules] = useState<Record<string, boolean>>(
    {}
  );
  const [collapsedMessages, setCollapsedMessages] = useState<
    Record<string, boolean>
  >({});

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

  const getSensorIcon = (type: SensorTypeValue): React.ReactElement => {
    const sensorType = sensorTypes.find((s) => s.value === type);
    const IconComponent = sensorType?.icon ?? FaThermometerHalf;
    const colorClass = sensorType?.color ?? "text-gray-400";

    return <IconComponent className={`w-5 h-5 ${colorClass}`} />;
  };

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

  const toggleRuleCollapse = (ruleId: string) => {
    setCollapsedRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const toggleMessageCollapse = (ruleId: string) => {
    setCollapsedMessages((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
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

  useEffect(() => {
    const hasEditTrue = alertRules.some((rule) => rule.edit);

    setDisabled(hasEditTrue);
  }, [alertRules]);

  const toggleEditById = (id: string) => {
    setAlertRules((prevData) => {
      return prevData.map((rule) => {
        if (rule.id === id) {
          setRuleName(rule.name);
          setSensorTag(rule.sensorTag);
          setMode(rule.mode);
          setOperator(rule.operator ?? ">");
          setSetpoint(rule.setpoint?.toString() ?? "");
          setMinValue(rule.minValue?.toString() ?? "");
          setMaxValue(rule.maxValue?.toString() ?? "");

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

      setRuleName("");
      setSensorTag("");
      setMode("setpoint");
      setOperator(">");
      setSetpoint("");
      setMinValue("");
      setMaxValue("");
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

  const getConditionText = (rule: AlertRule): string => {
    if (rule.mode === "setpoint") {
      return `${rule.operator} ${rule.setpoint}`;
    } else {
      return `[${rule.minValue}, ${rule.maxValue}]`;
    }
  };

  return (
    <div className="space-y-4" style={{ overflow: "visible", height: "auto" }}>
      {alertRules.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-100 mb-2">
            No hay condiciones de monitoreo configuradas
          </h3>
          <p className="text-slate-400">
            Comienza creando tu primera condición de monitoreo
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {alertRules.map((rule) => (
            <Card
              key={rule.id}
              className="bg-slate-800 border-slate-700"
              data-rule-id={rule.id}
            >
              <CardBody className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      className="text-slate-400 hover:text-slate-200 transition-colors"
                      title={
                        collapsedRules[rule.id]
                          ? "Expandir regla"
                          : "Colapsar regla"
                      }
                      onClick={() => toggleRuleCollapse(rule.id)}
                    >
                      {collapsedRules[rule.id] ? (
                        <FaChevronDown className="w-4 h-4" />
                      ) : (
                        <FaChevronUp className="w-4 h-4" />
                      )}
                    </button>
                    {getSensorIcon(rule.sensorType)}
                    <h3 className="font-semibold text-slate-100">
                      {rule.name}
                    </h3>
                  </div>
                  <Chip
                    className="cursor-pointer"
                    color={rule.isEnabled ? "primary" : "default"}
                    variant="flat"
                    onClick={() => {
                      setAlertRules((prevData) => {
                        return prevData.map((r) => {
                          if (r.id === rule.id) {
                            return { ...r, isEnabled: !r.isEnabled };
                          }

                          return r;
                        });
                      });
                    }}
                  >
                    {rule.isEnabled ? "Activa" : "Inactiva"}
                  </Chip>
                </div>

                {!collapsedRules[rule.id] && (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Tipo de Sensor:</span>
                        <select
                          className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={rule.sensorType}
                          onChange={(e) => {
                            setAlertRules((prevData) => {
                              return prevData.map((r) => {
                                if (r.id === rule.id) {
                                  return {
                                    ...r,
                                    sensorType: e.target
                                      .value as SensorTypeValue,
                                  };
                                }

                                return r;
                              });
                            });
                          }}
                        >
                          {sensorTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Sensor:</span>
                        <span className="text-slate-200">{rule.sensorTag}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Condición:</span>
                        <span className="text-slate-200">
                          {getConditionText(rule)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Tipo:</span>
                        <span className="text-slate-200">
                          {rule.mode === "setpoint" ? "Setpoint" : "Ventana"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mensajes:</span>
                        <span className="text-slate-200">
                          {rule.mensajes?.length ?? 0}
                        </span>
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
                              handleEdit(
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
                            onClick={() => toggleEditById(rule.id)}
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
                            onClick={() => toggleEditById(rule.id)}
                          >
                            Editar
                          </Button>
                          <Button
                            color="danger"
                            isDisabled={disabled}
                            size="sm"
                            startContent={<FaTrashAlt className="w-3 h-3" />}
                            variant="flat"
                            onClick={() => handleDelete(rule.id)}
                          >
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>

                    {rule.edit && (
                      <div className="mt-4 pt-4 border-t border-slate-700 space-y-3">
                        <Input
                          classNames={{
                            input: "text-slate-100",
                            inputWrapper: "bg-slate-700 border-slate-600",
                          }}
                          placeholder="Nombre de la regla"
                          value={ruleName}
                          variant="bordered"
                          onChange={(e) => setRuleName(e.target.value)}
                        />
                        <Input
                          classNames={{
                            input: "text-slate-100",
                            inputWrapper: "bg-slate-700 border-slate-600",
                          }}
                          placeholder="Tag del sensor"
                          value={sensorTag}
                          variant="bordered"
                          onChange={(e) => setSensorTag(e.target.value)}
                        />
                        <select
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={mode}
                          onChange={(e) =>
                            setMode(e.target.value as "setpoint" | "window")
                          }
                        >
                          <option value="setpoint">Setpoint</option>
                          <option value="window">Ventana</option>
                        </select>
                        {mode === "setpoint" && (
                          <>
                            <select
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              value={operator}
                              onChange={(e) => setOperator(e.target.value)}
                            >
                              {operators.map((op) => (
                                <option key={op.value} value={op.value}>
                                  {op.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              classNames={{
                                input: "text-slate-100",
                                inputWrapper: "bg-slate-700 border-slate-600",
                              }}
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
                              classNames={{
                                input: "text-slate-100",
                                inputWrapper: "bg-slate-700 border-slate-600",
                              }}
                              placeholder="Valor mínimo"
                              type="number"
                              value={minValue}
                              variant="bordered"
                              onChange={(e) => setMinValue(e.target.value)}
                            />
                            <Input
                              classNames={{
                                input: "text-slate-100",
                                inputWrapper: "bg-slate-700 border-slate-600",
                              }}
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
                          <h4 className="text-md font-bold text-slate-100">
                            Mensajes ({rule.mensajes?.length ?? 0})
                          </h4>
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
                            <div className="bg-slate-700 border border-slate-600 rounded-lg p-3 mb-4">
                              <h5 className="text-sm font-semibold text-slate-100 mb-2">
                                Agregar Nuevo Mensaje
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                <div className="space-y-2">
                                  <label
                                    className="block text-sm font-medium text-slate-300"
                                    htmlFor="tipo-receptor"
                                  >
                                    Tipo de Receptor
                                  </label>
                                  <select
                                    className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                    id="tipo-receptor"
                                    value={newMessageData.tipoReceptor}
                                    onChange={(e) =>
                                      setNewMessageData((prev) => ({
                                        ...prev,
                                        tipoReceptor: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">
                                      Seleccionar tipo...
                                    </option>
                                    <option value="reloj">Reloj</option>
                                    <option value="torreta">Torreta</option>
                                    <option value="correo">
                                      Correo Electrónico
                                    </option>
                                    <option value="generico">Genérico</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label
                                    className="block text-sm font-medium text-slate-300"
                                    htmlFor="receptor"
                                  >
                                    {newMessageData.tipoReceptor === "torreta"
                                      ? "Color"
                                      : "Receptor"}
                                  </label>
                                  <select
                                    className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                    id="receptor"
                                    value={newMessageData.receptor}
                                    onChange={(e) =>
                                      setNewMessageData((prev) => ({
                                        ...prev,
                                        receptor: e.target.value,
                                      }))
                                    }
                                  >
                                    <option value="">
                                      Seleccionar{" "}
                                      {newMessageData.tipoReceptor === "torreta"
                                        ? "color"
                                        : "receptor"}
                                      ...
                                    </option>
                                    {newMessageData.tipoReceptor === "correo"
                                      ? usuariosCorreo.map((usuario) => (
                                          <option
                                            key={usuario.id}
                                            value={usuario.nombre}
                                          >
                                            {usuario.nombre} - {usuario.email}
                                          </option>
                                        ))
                                      : newMessageData.tipoReceptor ===
                                          "torreta"
                                        ? coloresTorreta.map((color) => (
                                            <option
                                              key={color}
                                              style={{
                                                backgroundColor:
                                                  getColorValue(color),
                                              }}
                                              value={color}
                                            >
                                              {color}
                                            </option>
                                          ))
                                        : receptores.map((receptor) => (
                                            <option
                                              key={receptor.id}
                                              value={receptor.nombre}
                                            >
                                              {receptor.nombre} -{" "}
                                              {receptor.departamento}
                                            </option>
                                          ))}
                                  </select>
                                </div>
                                {newMessageData.tipoReceptor === "torreta" && (
                                  <div className="space-y-2">
                                    <label
                                      className="block text-sm font-medium text-slate-300"
                                      htmlFor="receptor-nombre-new"
                                    >
                                      Receptor
                                    </label>
                                    <select
                                      className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                      id="receptor-nombre-new"
                                      value={
                                        newMessageData.receptorNombre ?? ""
                                      }
                                      onChange={(e) =>
                                        setNewMessageData((prev) => ({
                                          ...prev,
                                          receptorNombre: e.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">
                                        Seleccionar receptor...
                                      </option>
                                      {receptores.map((receptor) => (
                                        <option
                                          key={receptor.id}
                                          value={receptor.nombre}
                                        >
                                          {receptor.nombre} -{" "}
                                          {receptor.departamento}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {(newMessageData.tipoReceptor === "reloj" ||
                                  newMessageData.tipoReceptor === "correo") && (
                                  <div className="space-y-2">
                                    <label
                                      className="block text-sm font-medium text-slate-300"
                                      htmlFor="mensaje"
                                    >
                                      Mensaje
                                    </label>
                                    <Input
                                      classNames={{
                                        input: "text-slate-100",
                                        inputWrapper:
                                          "bg-slate-800 border-slate-600",
                                      }}
                                      id="mensaje"
                                      placeholder="Ej: Mensaje de alerta"
                                      size="sm"
                                      value={newMessageData.message}
                                      variant="bordered"
                                      onChange={(e) =>
                                        setNewMessageData((prev) => ({
                                          ...prev,
                                          message: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-slate-600">
                                <Button
                                  size="sm"
                                  variant="flat"
                                  onClick={() => setShowAddMessageForm(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  color="success"
                                  isDisabled={
                                    !newMessageData.tipoReceptor ||
                                    !newMessageData.receptor
                                  }
                                  size="sm"
                                  onClick={handleCreateMessage}
                                >
                                  Crear Mensaje
                                </Button>
                              </div>
                            </div>
                          )}

                          {rule.mensajes.length > 0 && (
                            <div className="space-y-3">
                              {rule.mensajes.map((message) => (
                                <div
                                  key={message.id}
                                  className="bg-slate-700 border border-slate-600 rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium text-slate-300">
                                        Mensaje {message.id}
                                      </span>
                                      <Chip
                                        size="sm"
                                        style={{
                                          backgroundColor:
                                            gruposMensajes.find(
                                              (g) => g.nombre === message.grupo
                                            )?.color ?? "#6b7280",
                                          color: "white",
                                        }}
                                      >
                                        {message.grupo}
                                      </Chip>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <button
                                        className="text-blue-400 hover:text-blue-300 text-sm"
                                        title="Duplicar mensaje"
                                        onClick={() =>
                                          handleDuplicateMessage(message.id)
                                        }
                                      >
                                        <FaCopy className="w-3 h-3" />
                                      </button>
                                      <button
                                        className="text-red-400 hover:text-red-300 text-sm"
                                        title="Eliminar mensaje"
                                        onClick={() =>
                                          handleDeleteMessage(message.id)
                                        }
                                      >
                                        <FaTrashAlt className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                    <div className="space-y-2">
                                      <label
                                        className="block text-sm font-medium text-slate-300"
                                        htmlFor={`tipo-receptor-${message.id}`}
                                      >
                                        Tipo de Receptor
                                      </label>
                                      <select
                                        className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                        id={`tipo-receptor-${message.id}`}
                                        value={message.tipoReceptor}
                                        onChange={(e) => {
                                          setAlertRules((prevData) => {
                                            return prevData.map((rule) => {
                                              if (rule.mensajes) {
                                                return {
                                                  ...rule,
                                                  mensajes: rule.mensajes.map(
                                                    (msg) => {
                                                      if (
                                                        msg.id === message.id
                                                      ) {
                                                        return {
                                                          ...msg,
                                                          tipoReceptor: e.target
                                                            .value as Message["tipoReceptor"],
                                                        };
                                                      }

                                                      return msg;
                                                    }
                                                  ),
                                                };
                                              }

                                              return rule;
                                            });
                                          });
                                        }}
                                      >
                                        <option value="reloj">Reloj</option>
                                        <option value="torreta">Torreta</option>
                                        <option value="correo">
                                          Correo Electrónico
                                        </option>
                                        <option value="generico">
                                          Genérico
                                        </option>
                                      </select>
                                    </div>
                                    <div className="space-y-2">
                                      <label className="block text-sm font-medium text-slate-300">
                                        {message.tipoReceptor === "torreta"
                                          ? "Color"
                                          : "Receptor"}
                                      </label>
                                      <select
                                        className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                        value={message.receptor}
                                        onChange={(e) => {
                                          setAlertRules((prevData) => {
                                            return prevData.map((rule) => {
                                              if (rule.mensajes) {
                                                return {
                                                  ...rule,
                                                  mensajes: rule.mensajes.map(
                                                    (msg) => {
                                                      if (
                                                        msg.id === message.id
                                                      ) {
                                                        return {
                                                          ...msg,
                                                          receptor:
                                                            e.target.value,
                                                        };
                                                      }

                                                      return msg;
                                                    }
                                                  ),
                                                };
                                              }

                                              return rule;
                                            });
                                          });
                                        }}
                                      >
                                        {message.tipoReceptor === "correo"
                                          ? usuariosCorreo.map((usuario) => (
                                              <option
                                                key={usuario.id}
                                                value={usuario.nombre}
                                              >
                                                {usuario.nombre} -{" "}
                                                {usuario.email}
                                              </option>
                                            ))
                                          : message.tipoReceptor === "torreta"
                                            ? coloresTorreta.map((color) => (
                                                <option
                                                  key={color}
                                                  style={{
                                                    backgroundColor:
                                                      getColorValue(color),
                                                  }}
                                                  value={color}
                                                >
                                                  {color}
                                                </option>
                                              ))
                                            : receptores.map((receptor) => (
                                                <option
                                                  key={receptor.id}
                                                  value={receptor.nombre}
                                                >
                                                  {receptor.nombre} -{" "}
                                                  {receptor.departamento}
                                                </option>
                                              ))}
                                      </select>
                                    </div>
                                    {message.tipoReceptor === "torreta" && (
                                      <div className="space-y-2">
                                        <label
                                          className="block text-sm font-medium text-slate-300"
                                          htmlFor={`receptor-nombre-msg-${message.id}`}
                                        >
                                          Receptor
                                        </label>
                                        <select
                                          className="w-full h-10 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                                          id={`receptor-nombre-msg-${message.id}`}
                                          value={message.receptorNombre ?? ""}
                                          onChange={(e) => {
                                            setAlertRules((prevData) => {
                                              return prevData.map((rule) => {
                                                if (rule.mensajes) {
                                                  return {
                                                    ...rule,
                                                    mensajes: rule.mensajes.map(
                                                      (msg) => {
                                                        if (
                                                          msg.id === message.id
                                                        ) {
                                                          return {
                                                            ...msg,
                                                            receptorNombre:
                                                              e.target.value,
                                                          };
                                                        }

                                                        return msg;
                                                      }
                                                    ),
                                                  };
                                                }

                                                return rule;
                                              });
                                            });
                                          }}
                                        >
                                          <option value="">
                                            Seleccionar receptor...
                                          </option>
                                          {receptores.map((receptor) => (
                                            <option
                                              key={receptor.id}
                                              value={receptor.nombre}
                                            >
                                              {receptor.nombre} -{" "}
                                              {receptor.departamento}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                    {(message.tipoReceptor === "reloj" ||
                                      message.tipoReceptor === "correo") && (
                                      <div className="space-y-2">
                                        <label
                                          className="block text-sm font-medium text-slate-300"
                                          htmlFor={`mensaje-msg-${message.id}`}
                                        >
                                          Texto del Mensaje
                                        </label>
                                        <Input
                                          classNames={{
                                            input: "text-slate-100",
                                            inputWrapper:
                                              "bg-slate-800 border-slate-600",
                                          }}
                                          id={`mensaje-msg-${message.id}`}
                                          placeholder="Ingresa el mensaje..."
                                          size="sm"
                                          value={message.message ?? ""}
                                          variant="bordered"
                                          onChange={(e) => {
                                            setAlertRules((prevData) => {
                                              return prevData.map((rule) => {
                                                if (rule.mensajes) {
                                                  return {
                                                    ...rule,
                                                    mensajes: rule.mensajes.map(
                                                      (msg) => {
                                                        if (
                                                          msg.id === message.id
                                                        ) {
                                                          return {
                                                            ...msg,
                                                            message:
                                                              e.target.value,
                                                          };
                                                        }

                                                        return msg;
                                                      }
                                                    ),
                                                  };
                                                }

                                                return rule;
                                              });
                                            });
                                          }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlertRules;
