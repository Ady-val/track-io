import type {
  DashboardAreaData,
  DashboardEventData,
  DashboardStatus,
} from "../types/dashboard";

import { useState, useEffect, useCallback, useRef } from "react";

import { DashboardService } from "../lib/services/dashboard.service";

export const useDashboard = () => {
  const [areasData, setAreasData] = useState<DashboardAreaData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [openEvents, setOpenEvents] = useState<DashboardEventData[]>([]);
  const [inProgressEvents, setInProgressEvents] = useState<
    DashboardEventData[]
  >([]);
  const [closedEvents, setClosedEvents] = useState<DashboardEventData[]>([]);
  const [dashboardStatus, setDashboardStatus] = useState<
    DashboardStatus["data"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Referencias para mantener el tiempo actualizado
  const baseAreasDataRef = useRef<DashboardAreaData[]>([]);
  const allEventsRef = useRef<DashboardEventData[]>([]);
  // Referencia para mantener el tiempo de inicio de la parada por área
  const areaOutageStartTimeRef = useRef<Record<string, Date | null>>({});

  // Función para formatear duración
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }, []);

  // Función para determinar el estado del área basado en eventos activos
  const getAreaEventStatus = useCallback(
    (
      areaName: string
    ): {
      status: "ok" | "alert" | "warning" | "critical";
      hasOpenEvents: boolean;
    } => {
      const activeEvents = allEventsRef.current.filter(
        (event) =>
          event.area === areaName &&
          (event.status === "open" || event.status === "in-progress")
      );

      if (activeEvents.length === 0) {
        return { status: "ok", hasOpenEvents: false };
      }

      // Aplicar las reglas específicas:
      // 1. Si hay eventos open, siempre priorizar el status "open" (alert)
      // 2. Si no hay eventos open pero hay in-progress, usar "warning"
      const openEvents = activeEvents.filter(
        (event) => event.status === "open"
      );
      const hasOpenEvents = openEvents.length > 0;

      if (hasOpenEvents) {
        // Si hay eventos abiertos, siempre mostrar status "alert" (rojo con pulso)
        // Incluso si el evento más reciente es in-progress
        return { status: "alert", hasOpenEvents: true };
      } else {
        // Solo eventos in-progress, mostrar "warning" (amarillo)
        return { status: "warning", hasOpenEvents: false };
      }
    },
    []
  );

  /**
   * Calcula el tiempo acumulado de parada para un área específica.
   *
   * Lógica:
   * 1. Si no hay eventos activos → tiempo = 0h 0m 0s
   * 2. Si hay eventos activos:
   *    - Primera vez: usar el evento activo más antiguo como inicio de parada
   *    - Siguientes veces: mantener el mismo tiempo de inicio hasta que no haya eventos activos
   * 3. Calcular diferencia entre inicio de parada y momento actual
   *
   * @param areaName - Nombre del área a calcular
   * @returns Tiempo formateado (ej: "1h 23m 45s")
   */
  const calculateEventTimeForArea = useCallback(
    (areaName: string): string => {
      // Obtener solo eventos activos del área (open o in-progress)
      const activeEvents = allEventsRef.current.filter(
        (event) =>
          event.area === areaName &&
          (event.status === "open" || event.status === "in-progress")
      );

      // Si no hay eventos activos, resetear el tiempo de inicio y retornar 0
      if (activeEvents.length === 0) {
        areaOutageStartTimeRef.current[areaName] = null;
        return "0h 0m 0s";
      }

      // Obtener el tiempo de inicio actualmente registrado para esta área
      let outageStartTime = areaOutageStartTimeRef.current[areaName];

      // Si esta es la primera vez que hay eventos activos, establecer el tiempo de inicio
      if (!outageStartTime) {
        // Encontrar el evento activo más antiguo para establecer el inicio de la parada
        const oldestActiveEvent = activeEvents.reduce((oldest, current) => {
          const oldestStart = new Date(oldest.startedAt);
          const currentStart = new Date(current.startedAt);
          return currentStart < oldestStart ? current : oldest;
        });

        // Registrar el tiempo de inicio de la parada (no cambiar hasta que no haya eventos activos)
        outageStartTime = new Date(oldestActiveEvent.startedAt);
        areaOutageStartTimeRef.current[areaName] = outageStartTime;
      }

      // Calcular tiempo transcurrido desde el inicio de la parada hasta ahora
      const now = new Date();
      if (!outageStartTime) {
        return "0h 0m 0s";
      }

      const durationInSeconds = Math.floor(
        (now.getTime() - outageStartTime.getTime()) / 1000
      );

      return formatDuration(Math.max(0, durationInSeconds));
    },
    [formatDuration]
  );

  const fetchAreasData = useCallback(async () => {
    try {
      const response = await DashboardService.getAreasData();

      if (response.success) {
        const areasDataReversed = response.data.reverse();
        setAreasData(areasDataReversed);
        baseAreasDataRef.current = areasDataReversed;
        setHeaders(response.headers);
      } else {
        setError("Error al cargar datos de áreas");
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error("Error fetching areas data:", err);
    }
  }, []);

  const fetchOpenEvents = useCallback(async () => {
    try {
      const response = await DashboardService.getOpenEvents();

      if (response.success) {
        setOpenEvents(response.data);
      }
    } catch (err) {
      console.error("Error fetching open events:", err);
    }
  }, []);

  const fetchInProgressEvents = useCallback(async () => {
    try {
      const response = await DashboardService.getInProgressEvents();

      if (response.success) {
        setInProgressEvents(response.data);
      }
    } catch (err) {
      console.error("Error fetching in-progress events:", err);
    }
  }, []);

  const fetchClosedEvents = useCallback(async () => {
    try {
      const response = await DashboardService.getClosedEvents();

      if (response.success) {
        setClosedEvents(response.data);
      }
    } catch (err) {
      console.error("Error fetching closed events:", err);
    }
  }, []);

  const fetchRecentClosedEvents = useCallback(async () => {
    try {
      const response = await DashboardService.getRecentClosedEvents();

      if (response.success) {
        setClosedEvents(response.data);
      }
    } catch (err) {
      console.error("Error fetching recent closed events:", err);
    }
  }, []);

  const fetchDashboardStatus = useCallback(async () => {
    try {
      const response = await DashboardService.getDashboardStatus();

      if (response.success) {
        setDashboardStatus(response.data);
      }
    } catch (err) {
      console.error("Error fetching dashboard status:", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchAreasData(),
        fetchOpenEvents(),
        fetchInProgressEvents(),
        fetchRecentClosedEvents(), // Cargar eventos cerrados recientes para cálculo de tiempo
        fetchDashboardStatus(),
      ]);
    } catch (_err) {
      setError("Error al actualizar datos");
    } finally {
      setLoading(false);
    }
  }, [
    fetchAreasData,
    fetchOpenEvents,
    fetchInProgressEvents,
    fetchRecentClosedEvents,
    fetchDashboardStatus,
  ]);

  // Función para actualizar el tiempo en tiempo real
  const updateEventTimes = useCallback(() => {
    if (baseAreasDataRef.current.length > 0) {
      const updatedAreas = baseAreasDataRef.current.map((area) => ({
        ...area,
        eventsTime: calculateEventTimeForArea(area.area),
      }));
      setAreasData(updatedAreas);
    }
  }, [calculateEventTimeForArea]);

  // Mantener actualizada la referencia de eventos activos para el cálculo
  useEffect(() => {
    // Solo incluir eventos activos (open e in-progress) para el cálculo de tiempo
    // Los eventos cerrados no deben afectar el cálculo del tiempo acumulado
    allEventsRef.current = [...openEvents, ...inProgressEvents];
  }, [openEvents, inProgressEvents]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Actualizar tiempo cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      updateEventTimes();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateEventTimes]);

  return {
    areasData,
    headers,
    openEvents,
    inProgressEvents,
    closedEvents,
    dashboardStatus,
    loading,
    error,
    refreshAll,
    fetchAreasData,
    fetchOpenEvents,
    fetchInProgressEvents,
    fetchClosedEvents,
    fetchRecentClosedEvents,
    fetchDashboardStatus,
    getAreaEventStatus,
    allEventsRef: allEventsRef.current,
  };
};
