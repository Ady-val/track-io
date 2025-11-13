import type { DashboardEventData } from "../types/dashboard";

import React, { useState, useEffect } from "react";

import { FaExclamationTriangle, FaIndustry } from "react-icons/fa";

import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";
import { ConnectionStatusIndicator } from "../components/atoms/ConnectionStatusIndicator";
import { Text } from "../components/atoms/Text";
import { EmptyState, CollapsibleSection } from "../components/molecules";
import { AreaCard } from "../components/molecules/AreaCard";
import { EventsTable } from "../components/organisms/EventsTable";
import { useWebSocket } from "../contexts/WebSocketContext";
import { useDashboard } from "../hooks/useDashboard";
import { useWebSocketEvent } from "../hooks/useWebSocketEvent";

export const IndustrialDashboard: React.FC = () => {
  const {
    areasData,
    openEvents,
    inProgressEvents,
    closedEvents,
    loading,
    error,
    refreshAll,
    fetchRecentClosedEvents,
    getAreaEventStatus,
  } = useDashboard();

  const [isLoadingClosedEvents, setIsLoadingClosedEvents] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const { isConnected } = useWebSocket();
  const [_selectedEvent, setSelectedEvent] =
    useState<DashboardEventData | null>(null);

  const getConnectionStatus = (): "connected" | "disconnected" | "loading" => {
    if (loading) return "loading";
    if (!isConnected) return "disconnected";

    return "connected";
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useWebSocketEvent("new-event", () => {
    console.log("Nuevo evento recibido via WebSocket");
    refreshAll();
  });

  useWebSocketEvent("event-updated", () => {
    console.log("Evento actualizado via WebSocket");
    refreshAll();
  });

  useWebSocketEvent("closed-event", () => {
    console.log("Evento cerrado via WebSocket");
    refreshAll();
  });

  const handleAreaClick = (area: string) => {
    console.log("Área clickeada:", area);
  };

  const handleEventClick = (event: DashboardEventData) => {
    setSelectedEvent(event);
    console.log("Evento clickeado:", event);
  };

  const handleClosedEventsToggle = async (isExpanded: boolean) => {
    if (isExpanded && closedEvents.length === 0) {
      setIsLoadingClosedEvents(true);
      try {
        await fetchRecentClosedEvents();
      } catch (err) {
        console.error("Error loading closed events:", err);
      } finally {
        setIsLoadingClosedEvents(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-2">
              Dashboard de Producción Industrial
            </h1>
            <p className="text-lg text-slate-400">
              Monitoreo en tiempo real de líneas de producción y eventos
              críticos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatusIndicator
              showLabel
              size="md"
              status={getConnectionStatus()}
            />
            <div className="text-5xl font-bold text-slate-100">
              {currentTime.toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 pb-4">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          Líneas de Producción
        </h2>
        {error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaExclamationTriangle className="mx-auto text-red-500 text-4xl mb-4" />
              <Text className="text-red-400 mb-2">Error de conexión</Text>
              <Text className="mb-4" color="muted">
                {error}
              </Text>
              <Button size="sm" variant="flat" onClick={refreshAll}>
                Reintentar
              </Button>
            </div>
          </div>
        ) : areasData.length > 0 ? (
          <div className="flex flex-wrap gap-6">
            {areasData.map((area, index) => (
              <AreaCard
                key={index}
                area={area}
                getAreaEventStatus={getAreaEventStatus}
                onClick={() => handleAreaClick(area.area)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            description="No se encontraron líneas de producción en el sistema"
            icon={FaIndustry}
            title="No hay áreas disponibles"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-8 dashboard-scrollbar smooth-scroll">
        <div className="mb-10">
          {error ? (
            <Card className="bg-slate-700 border-slate-600">
              <div className="p-8 text-center">
                <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-3" />
                <Text className="text-red-400 mb-2">
                  Error al cargar eventos abiertos
                </Text>
                <Text className="text-sm" color="muted">
                  {error}
                </Text>
              </div>
            </Card>
          ) : (
            <EventsTable
              events={openEvents}
              title="Eventos Abiertos"
              onEventClick={handleEventClick}
            />
          )}
        </div>

        <div className="mb-10">
          {error ? (
            <Card className="bg-slate-700 border-slate-600">
              <div className="p-8 text-center">
                <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-3" />
                <Text className="text-red-400 mb-2">
                  Error al cargar eventos en progreso
                </Text>
                <Text className="text-sm" color="muted">
                  {error}
                </Text>
              </div>
            </Card>
          ) : (
            <EventsTable
              events={inProgressEvents}
              title="Eventos En Progreso"
              onEventClick={handleEventClick}
            />
          )}
        </div>

        <CollapsibleSection
          isLoading={isLoadingClosedEvents}
          title="Últimos Eventos Cerrados"
          onToggle={handleClosedEventsToggle}
        >
          {error ? (
            <Card className="bg-slate-700 border-slate-600">
              <div className="p-8 text-center">
                <FaExclamationTriangle className="mx-auto text-red-500 text-3xl mb-3" />
                <Text className="text-red-400 mb-2">
                  Error al cargar eventos cerrados
                </Text>
                <Text className="text-sm" color="muted">
                  {error}
                </Text>
              </div>
            </Card>
          ) : (
            <EventsTable events={closedEvents} title="" />
          )}
        </CollapsibleSection>
      </div>
    </div>
  );
};
