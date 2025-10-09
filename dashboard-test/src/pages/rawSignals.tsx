import { useState, useCallback } from "react";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import {
  FaSearch,
  FaSignal,
  FaRulerCombined,
  FaClock,
  FaHashtag,
} from "react-icons/fa";

import { useWebSocket } from "@/contexts/WebSocketContext";
import { useWebSocketEvent } from "@/hooks/useWebSocketEvent";
import DefaultLayout from "@/layouts/default";

interface RawDataItem {
  id: number;
  externalId: string;
  value: string;
  createdAt: string;
}

interface WebSocketMessage {
  event: string;
  data: {
    type: "signal" | "measurement";
    data: RawDataItem;
  };
  timestamp: string;
}

export default function RawSignalsPage() {
  const [signals, setSignals] = useState<RawDataItem[]>([]);
  const [selectedSignal, setSelectedSignal] = useState<RawDataItem | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const { isConnected } = useWebSocket();

  const handleNewSignal = useCallback((msg: WebSocketMessage) => {
    console.log("New signal received:", msg);

    if (msg?.data?.data) {
      setSignals((prev) => [msg.data.data, ...prev].slice(0, 100));
    }
  }, []);

  const handleNewMeasurement = useCallback((msg: WebSocketMessage) => {
    console.log("New measurement received:", msg);

    if (msg?.data?.data) {
      setSignals((prev) => [msg.data.data, ...prev].slice(0, 100));
    }
  }, []);

  useWebSocketEvent<WebSocketMessage>("new_raw_signal", handleNewSignal);
  useWebSocketEvent<WebSocketMessage>(
    "new_raw_measurement",
    handleNewMeasurement
  );

  const filteredSignals = signals.filter(
    (signal) =>
      signal.externalId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      signal.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);

    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <DefaultLayout>
      <div className="bg-slate-900 p-4 h-full flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-3">
          <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
            <CardBody className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 mb-1">
                    Señales y Mediciones en Tiempo Real
                  </h2>
                  <p className="text-sm text-slate-400">
                    Monitor de datos entrantes vía WebSocket
                  </p>
                </div>
                <Chip color="primary" size="sm" variant="flat">
                  {signals.length} registros
                </Chip>
              </div>

              <div>
                <Input
                  classNames={{
                    input: "text-slate-100",
                    inputWrapper: "bg-slate-700 border-slate-600",
                  }}
                  placeholder="Buscar por ID externo o valor..."
                  size="sm"
                  startContent={<FaSearch className="text-slate-400" />}
                  value={searchTerm}
                  variant="bordered"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-grow overflow-hidden">
            <div className="lg:col-span-1 h-full overflow-hidden">
              <Card className="bg-slate-700 border-slate-600 h-full flex flex-col">
                <CardBody className="p-3 flex flex-col h-full overflow-hidden">
                  <h3 className="text-sm font-semibold text-slate-100 mb-2 flex items-center gap-2 flex-shrink-0">
                    <FaSignal className="text-blue-400 text-sm" />
                    Lista de Registros
                  </h3>
                  <div className="space-y-2 overflow-auto flex-grow pr-2">
                    {filteredSignals.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                          <FaSignal className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-100 mb-1">
                          No hay registros
                        </h3>
                        <p className="text-slate-400 text-xs">
                          Los datos aparecerán aquí en tiempo real
                        </p>
                      </div>
                    ) : (
                      filteredSignals.map((signal) => (
                        <Card
                          key={signal.id}
                          isHoverable
                          isPressable
                          className={`${
                            selectedSignal?.id === signal.id
                              ? "bg-slate-600 border-blue-500"
                              : "bg-slate-800 border-slate-700"
                          } border transition-all`}
                          onPress={() => setSelectedSignal(signal)}
                        >
                          <CardBody className="p-2">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-xs font-medium text-slate-300 truncate">
                                {signal.externalId}
                              </span>
                              <Chip color="primary" size="sm" variant="flat">
                                #{signal.id}
                              </Chip>
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {signal.value}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                              {formatDate(signal.createdAt)}
                            </div>
                          </CardBody>
                        </Card>
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            <div className="lg:col-span-2 h-full overflow-hidden">
              <Card className="bg-slate-700 border-slate-600 h-full flex flex-col">
                <CardBody className="p-3 flex flex-col h-full overflow-hidden">
                  {!selectedSignal ? (
                    <div className="flex flex-col h-full justify-center items-center">
                      <div className="bg-slate-800 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                        <FaRulerCombined className="w-8 h-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-100 mb-2">
                        Selecciona un registro
                      </h3>
                      <p className="text-slate-400 text-center text-sm max-w-md">
                        Los detalles aparecerán aquí
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full overflow-hidden">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-600 flex-shrink-0">
                        <h3 className="text-base font-bold text-slate-100">
                          Detalles del Registro
                        </h3>
                        <Button
                          color="default"
                          size="sm"
                          variant="flat"
                          onClick={() => setSelectedSignal(null)}
                        >
                          Cerrar
                        </Button>
                      </div>

                      <div className="flex-grow overflow-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                          <Card className="bg-slate-800 border-slate-700">
                            <CardBody className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-blue-500/20 p-1.5 rounded">
                                  <FaHashtag className="w-3 h-3 text-blue-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-slate-400">
                                    ID
                                  </p>
                                  <p className="text-sm font-semibold text-slate-100 truncate">
                                    #{selectedSignal.id}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-slate-800 border-slate-700">
                            <CardBody className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-purple-500/20 p-1.5 rounded">
                                  <FaSignal className="w-3 h-3 text-purple-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-slate-400">
                                    ID Externo
                                  </p>
                                  <p className="text-sm font-semibold text-slate-100 truncate">
                                    {selectedSignal.externalId}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-slate-800 border-slate-700">
                            <CardBody className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-green-500/20 p-1.5 rounded">
                                  <FaRulerCombined className="w-3 h-3 text-green-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-slate-400">
                                    Valor
                                  </p>
                                  <p className="text-sm font-mono text-slate-100 truncate">
                                    {selectedSignal.value}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>

                          <Card className="bg-slate-800 border-slate-700">
                            <CardBody className="p-2">
                              <div className="flex items-center gap-2">
                                <div className="bg-orange-500/20 p-1.5 rounded">
                                  <FaClock className="w-3 h-3 text-orange-400" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[10px] text-slate-400">
                                    Fecha
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-100">
                                    {formatDate(selectedSignal.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>

                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <h4 className="text-xs font-semibold text-slate-300 mb-2">
                            Datos Raw (JSON)
                          </h4>
                          <Card className="bg-slate-900">
                            <CardBody className="p-2">
                              <pre className="text-xs text-slate-300 font-mono overflow-auto max-h-40">
                                {JSON.stringify(selectedSignal, null, 2)}
                              </pre>
                            </CardBody>
                          </Card>
                        </div>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          <Card className="bg-slate-800 border-slate-700 flex-shrink-0">
            <CardBody className="p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected
                          ? "bg-green-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs text-slate-300">
                      {isConnected
                        ? "Conexión WebSocket Activa"
                        : "Desconectado"}
                    </span>
                  </div>
                  <div className="h-3 w-px bg-slate-600" />
                  <span className="text-xs text-slate-400">
                    new_raw_signal, new_raw_measurement
                  </span>
                </div>
                <Button
                  color="danger"
                  size="sm"
                  variant="flat"
                  onClick={() => {
                    setSignals([]);
                    setSelectedSignal(null);
                  }}
                >
                  Limpiar
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
