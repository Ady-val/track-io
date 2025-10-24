import type { RawDataItem } from "../types";

import type React from "react";

import {
  FaRulerCombined,
  FaHashtag,
  FaClock,
  FaDatabase,
  FaTag,
  FaCircleInfo,
  FaTriangleExclamation,
  FaPlus,
  FaCubesStacked,
} from "react-icons/fa6";
import { PiWaveSineBold } from "react-icons/pi";

import { Card, CardBody, Text, Button, Spinner, Chip } from "@components/atoms";
import { StatCard, EmptyState } from "@components/molecules";

import type { Device } from "@/types/device";
import type { DeviceSignal } from "@/types/device-signal";
import type { Measurement } from "@/types/measurement";

export interface SignalDetailProps {
  signal: RawDataItem | null;
  measurement: Measurement | null;
  device: Device | null;
  deviceSignal: DeviceSignal | null;
  isLoadingMeasurement: boolean;
  isLoadingDevice: boolean;
  isLoadingDeviceSignal: boolean;
  onClose: () => void;
  onCreateMeasurement: () => void;
  onCreateDevice: () => void;
  onCreateDeviceSignal: () => void;
  formatDate: (dateString: string) => string;
}

const getMeasurementTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    temperature: "Temperatura",
    humidity: "Humedad",
    pressure: "Presión",
    level: "Nivel",
    flow: "Flujo",
    vibration: "Vibración",
  };

  return labels[type] ?? type;
};

const getMeasurementTypeColor = (type: string): string => {
  const colors: Record<string, string> = {
    temperature: "danger",
    humidity: "primary",
    pressure: "warning",
    level: "secondary",
    flow: "success",
    vibration: "default",
  };

  return colors[type] ?? "default";
};

export const SignalDetail: React.FC<SignalDetailProps> = ({
  signal,
  measurement,
  device,
  deviceSignal,
  isLoadingMeasurement,
  isLoadingDevice,
  isLoadingDeviceSignal,
  onClose,
  onCreateMeasurement,
  onCreateDevice,
  onCreateDeviceSignal,
  formatDate,
}) => {
  if (!signal) {
    return (
      <EmptyState
        description="Los detalles aparecerán aquí"
        icon={FaRulerCombined}
        title="Selecciona un registro"
      />
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600 flex-shrink-0">
        <Text variant="h3">Detalles del Registro</Text>
        <Button color="default" size="sm" variant="flat" onClick={onClose}>
          Cerrar
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
          <StatCard
            icon={FaHashtag}
            iconBgColor="bg-blue-500/20"
            iconColor="text-blue-400"
            label="ID"
            value={`#${signal.id}`}
          />

          <StatCard
            icon={PiWaveSineBold}
            iconBgColor="bg-purple-500/20"
            iconColor="text-purple-400"
            label="ID Externo"
            value={signal.externalId}
          />

          <StatCard
            icon={FaRulerCombined}
            iconBgColor="bg-green-500/20"
            iconColor="text-green-400"
            label="Valor"
            value={signal.value}
            valueClassName="font-mono"
          />

          <StatCard
            icon={FaClock}
            iconBgColor="bg-orange-500/20"
            iconColor="text-orange-400"
            label="Fecha"
            value={formatDate(signal.createdAt)}
            valueClassName="text-[11px]"
          />
        </div>

        {/* Measurement Section */}
        <div className="mt-3 pt-3 border-t border-slate-600">
          <div className="flex items-center gap-2 mb-2">
            <FaDatabase className="text-blue-400 text-sm" />
            <Text color="secondary" variant="small">
              Información del Dispositivo de Medición
            </Text>
          </div>

          {signal.type === "signal" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaCubesStacked className="text-blue-400 text-sm" />
                    <Text color="secondary" variant="small">
                      Información del Dispositivo
                    </Text>
                  </div>

                  {isLoadingDevice ? (
                    <Card className="bg-slate-800/50">
                      <CardBody className="p-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Spinner color="primary" size="sm" />
                          <Text color="muted" variant="small">
                            Consultando dispositivo...
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  ) : device ? (
                    <Card className="bg-slate-800/50 border-green-500/30">
                      <CardBody className="p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                              <FaCircleInfo className="text-green-400 text-sm" />
                            </div>
                            <div>
                              <Text className="font-semibold" variant="small">
                                Dispositivo Registrado
                              </Text>
                              <Text color="muted" variant="caption">
                                ID: #{device.id}
                              </Text>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <FaTag className="text-blue-400 text-xs" />
                              <Text color="muted" variant="caption">
                                Nombre
                              </Text>
                            </div>
                            <Text className="font-medium" variant="small">
                              {device.name}
                            </Text>
                          </div>

                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <PiWaveSineBold className="text-purple-400 text-xs" />
                              <Text color="muted" variant="caption">
                                External ID
                              </Text>
                            </div>
                            <Text
                              className="font-medium font-mono"
                              variant="small"
                            >
                              {device.externalId}
                            </Text>
                          </div>
                        </div>

                        <div className="bg-slate-700/50 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <FaClock className="text-orange-400 text-xs" />
                            <Text color="muted" variant="caption">
                              Fecha de Creación
                            </Text>
                          </div>
                          <Text className="font-medium" variant="small">
                            {formatDate(device.createdAt)}
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card className="bg-slate-800/50 border-amber-500/30">
                      <CardBody className="p-3">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <FaTriangleExclamation className="text-amber-400 text-sm" />
                          </div>
                          <div className="flex-grow">
                            <Text
                              className="font-semibold mb-1"
                              variant="small"
                            >
                              Dispositivo No Encontrado
                            </Text>
                            <Text color="muted" variant="caption">
                              No existe un dispositivo registrado con el
                              External ID:{" "}
                              <span className="font-mono text-amber-400">
                                {signal.externalId}
                              </span>
                            </Text>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-600">
                          <Text className="mb-2" variant="small">
                            ¿Deseas agregar este dispositivo?
                          </Text>
                          <Button
                            className="w-full"
                            color="primary"
                            size="sm"
                            variant="flat"
                            onClick={onCreateDevice}
                          >
                            <FaPlus className="mr-2" />
                            Agregar Dispositivo
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FaDatabase className="text-purple-400 text-sm" />
                    <Text color="secondary" variant="small">
                      Información de la Señal del Dispositivo
                    </Text>
                  </div>

                  {isLoadingDeviceSignal ? (
                    <Card className="bg-slate-800/50">
                      <CardBody className="p-4">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Spinner color="primary" size="sm" />
                          <Text color="muted" variant="small">
                            Consultando señal del dispositivo...
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  ) : deviceSignal ? (
                    <Card className="bg-slate-800/50 border-purple-500/30">
                      <CardBody className="p-3">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                              <FaCircleInfo className="text-purple-400 text-sm" />
                            </div>
                            <div>
                              <Text className="font-semibold" variant="small">
                                Señal Registrada
                              </Text>
                              <Text color="muted" variant="caption">
                                ID: #{deviceSignal.id}
                              </Text>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <FaTag className="text-purple-400 text-xs" />
                              <Text color="muted" variant="caption">
                                Nombre
                              </Text>
                            </div>
                            <Text className="font-medium" variant="small">
                              {deviceSignal.name}
                            </Text>
                          </div>

                          <div className="bg-slate-700/50 rounded-lg p-2">
                            <div className="flex items-center gap-2 mb-1">
                              <PiWaveSineBold className="text-blue-400 text-xs" />
                              <Text color="muted" variant="caption">
                                External Value ID
                              </Text>
                            </div>
                            <Text
                              className="font-medium font-mono"
                              variant="small"
                            >
                              {deviceSignal.externalValueId}
                            </Text>
                          </div>
                        </div>

                        <div className="bg-slate-700/50 rounded-lg p-2">
                          <div className="flex items-center gap-2 mb-1">
                            <FaClock className="text-orange-400 text-xs" />
                            <Text color="muted" variant="caption">
                              Fecha de Creación
                            </Text>
                          </div>
                          <Text className="font-medium" variant="small">
                            {formatDate(deviceSignal.createdAt)}
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  ) : device ? (
                    <Card className="bg-slate-800/50 border-amber-500/30">
                      <CardBody className="p-3">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <FaTriangleExclamation className="text-amber-400 text-sm" />
                          </div>
                          <div className="flex-grow">
                            <Text
                              className="font-semibold mb-1"
                              variant="small"
                            >
                              Señal No Encontrada
                            </Text>
                            <Text color="muted" variant="caption">
                              No existe una señal registrada para este
                              dispositivo con el valor:{" "}
                              <span className="font-mono text-amber-400">
                                {signal.value}
                              </span>
                            </Text>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-600">
                          <Text className="mb-2" variant="small">
                            ¿Deseas agregar esta señal al dispositivo?
                          </Text>
                          <Button
                            className="w-full"
                            color="primary"
                            size="sm"
                            variant="flat"
                            onClick={onCreateDeviceSignal}
                          >
                            <FaPlus className="mr-2" />
                            Agregar Señal
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ) : (
                    <Card className="bg-slate-800/50 border-slate-500/30">
                      <CardBody className="p-3">
                        <div className="flex items-center justify-center gap-2">
                          <Text color="muted" variant="small">
                            Primero debe existir un dispositivo
                          </Text>
                        </div>
                      </CardBody>
                    </Card>
                  )}
                </div>
              </div>
            </div>
          ) : isLoadingMeasurement ? (
            <Card className="bg-slate-800/50">
              <CardBody className="p-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Spinner color="primary" size="sm" />
                  <Text color="muted" variant="small">
                    Consultando dispositivo...
                  </Text>
                </div>
              </CardBody>
            </Card>
          ) : measurement ? (
            <Card className="bg-slate-800/50 border-green-500/30">
              <CardBody className="p-3">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <FaCircleInfo className="text-green-400 text-sm" />
                    </div>
                    <div>
                      <Text className="font-semibold" variant="small">
                        Dispositivo Registrado
                      </Text>
                      <Text color="muted" variant="caption">
                        ID: #{measurement.id}
                      </Text>
                    </div>
                  </div>
                  <Chip
                    color={
                      getMeasurementTypeColor(measurement.type) as
                        | "danger"
                        | "primary"
                        | "warning"
                        | "secondary"
                        | "success"
                        | "default"
                    }
                    size="sm"
                    variant="flat"
                  >
                    {getMeasurementTypeLabel(measurement.type)}
                  </Chip>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <FaTag className="text-blue-400 text-xs" />
                      <Text color="muted" variant="caption">
                        Nombre
                      </Text>
                    </div>
                    <Text className="font-medium" variant="small">
                      {measurement.name}
                    </Text>
                  </div>

                  <div className="bg-slate-700/50 rounded-lg p-2">
                    <div className="flex items-center gap-2 mb-1">
                      <PiWaveSineBold className="text-purple-400 text-xs" />
                      <Text color="muted" variant="caption">
                        External ID
                      </Text>
                    </div>
                    <Text className="font-medium font-mono" variant="small">
                      {measurement.externalId}
                    </Text>
                  </div>
                </div>

                <div className="bg-slate-700/50 rounded-lg p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FaClock className="text-orange-400 text-xs" />
                    <Text color="muted" variant="caption">
                      Fecha de Creación
                    </Text>
                  </div>
                  <Text className="font-medium" variant="small">
                    {formatDate(measurement.createdAt ?? "")}
                  </Text>
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="bg-slate-800/50 border-amber-500/30">
              <CardBody className="p-3">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <FaTriangleExclamation className="text-amber-400 text-sm" />
                  </div>
                  <div className="flex-grow">
                    <Text className="font-semibold mb-1" variant="small">
                      Dispositivo No Encontrado
                    </Text>
                    <Text color="muted" variant="caption">
                      No existe un dispositivo de medición registrado con el
                      External ID:{" "}
                      <span className="font-mono text-amber-400">
                        {signal.externalId}
                      </span>
                    </Text>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-600">
                  <Text className="mb-2" variant="small">
                    ¿Deseas agregar este dispositivo de medición?
                  </Text>
                  <Button
                    className="w-full"
                    color="primary"
                    size="sm"
                    variant="flat"
                    onClick={onCreateMeasurement}
                  >
                    <FaPlus className="mr-2" />
                    Agregar Dispositivo
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-600">
          <Text className="mb-2" color="secondary" variant="small">
            Datos Raw (JSON)
          </Text>
          <Card className="bg-slate-900">
            <CardBody className="p-2">
              <pre className="text-xs text-slate-300 font-mono overflow-auto max-h-40">
                {JSON.stringify(signal, null, 2)}
              </pre>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};
