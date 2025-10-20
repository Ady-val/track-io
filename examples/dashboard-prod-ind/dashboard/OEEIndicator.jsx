import React, { useState, useEffect } from "react";
import { apiURL, request } from "../api/request";

const OEEIndicator = ({ lineId, lineName }) => {
  const req = request();
  const [oeeData, setOeeData] = useState({
    availability: 0,
    performance: 0,
    quality: 0,
    goodPieces: 0,
    badPieces: 0,
    overall: 0,
    lastUpdated: null,
    status: "loading", // loading, configured, not-configured, error
  });

  useEffect(() => {
    loadOEEData();
  }, [lineId]);

  const loadOEEData = async () => {
    try {
      // Primero verificar si hay configuración OEE
      const configRes = await req({
        url: `/api/oee/config/${lineId}`,
        method: "GET",
      });

      if (!configRes?.data?.success || !configRes.data.data) {
        setOeeData((prev) => ({
          ...prev,
          status: "not-configured",
        }));
        return;
      }

      // Si hay configuración, obtener datos de cálculo
      const calcRes = await req({
        url: `/api/oee/calculation/${lineId}`,
        method: "GET",
      });

      if (calcRes?.data?.success && calcRes.data.data) {
        const data = calcRes.data.data;

        // Calcular OEE basado en los datos reales vs deseados
        const availability = calculateAvailability(data);
        const performance = calculatePerformance(data);
        const quality = calculateQuality(data);
        const overall = (availability * performance * quality) / 10000; // Convertir a porcentaje

        setOeeData({
          availability,
          performance,
          quality,
          goodPieces: data.goodPieces,
          badPieces: data.badPieces,
          overall,
          lastUpdated: new Date(),
          status: "configured",
        });
      } else {
        setOeeData((prev) => ({
          ...prev,
          status: "error",
        }));
      }
    } catch (error) {
      console.error("Error loading OEE data:", error);
      setOeeData((prev) => ({
        ...prev,
        status: "error",
      }));
    }
  };

  const calculateAvailability = (data) => {
    const { config, operatingTime } = data;
    if (!config.desiredOperatingTime || config.desiredOperatingTime === 0) {
      return 100;
    }

    const actualTime = operatingTime || 0;
    const availability = (actualTime / config.desiredOperatingTime) * 100;
    return Math.min(Math.max(availability, 0), 100);
  };

  const calculatePerformance = (data) => {
    const { config, speed } = data;
    if (!config.desiredSpeed || config.desiredSpeed === 0) {
      return 100;
    }

    const actualSpeed = speed || 0;
    const performance = (actualSpeed / config.desiredSpeed) * 100;
    return Math.min(Math.max(performance, 0), 100);
  };

  const calculateQuality = (data) => {
    const { goodPieces, badPieces } = data;
    const totalPieces = goodPieces + badPieces;

    if (totalPieces === 0) {
      return 100; // No pieces produced, consider as 100% quality
    }

    const qualityPercentage = (goodPieces / totalPieces) * 100;
    return Math.min(Math.max(qualityPercentage, 0), 100);
  };

  const getOEEStatusColor = (value) => {
    if (value >= 90) return "text-green-500";
    if (value >= 80) return "text-yellow-500";
    if (value >= 70) return "text-orange-500";
    return "text-red-500";
  };

  const getOEEStatusText = (value) => {
    if (value >= 90) return "Excelente";
    if (value >= 80) return "Bueno";
    if (value >= 70) return "Regular";
    return "Crítico";
  };

  const formatLastUpdated = (date) => {
    if (!date) return "Nunca";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Ahora";
    if (diffMinutes < 60) return `Hace ${diffMinutes}m`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    return `Hace ${diffDays}d`;
  };

  if (oeeData.status === "loading") {
    return (
      <div className="flex items-center justify-center p-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (oeeData.status === "not-configured") {
    return (
      <div className="text-center p-2">
        <div className="text-xs text-gray-400 mb-1">OEE</div>
        <div className="text-xs text-gray-500">No configurado</div>
      </div>
    );
  }

  if (oeeData.status === "error") {
    return (
      <div className="text-center p-2">
        <div className="text-xs text-gray-400 mb-1">OEE</div>
        <div className="text-xs text-red-500">Error</div>
      </div>
    );
  }

  return (
    <div className="text-center p-2">
      <div className="text-xs text-gray-400 mb-1">OEE</div>
      <div
        className={`text-lg font-bold ${getOEEStatusColor(oeeData.overall)}`}
      >
        {oeeData.overall.toFixed(1)}%
      </div>
      <div className="text-xs text-gray-500 mb-1">
        {getOEEStatusText(oeeData.overall)}
      </div>

      {/* Desglose de componentes OEE */}
      <div className="grid grid-cols-3 gap-1 text-xs">
        <div className="text-gray-400">
          <div className="font-medium">A</div>
          <div className={getOEEStatusColor(oeeData.availability)}>
            {oeeData.availability.toFixed(0)}%
          </div>
        </div>
        <div className="text-gray-400">
          <div className="font-medium">P</div>
          <div className={getOEEStatusColor(oeeData.performance)}>
            {oeeData.performance.toFixed(0)}%
          </div>
        </div>
        <div className="text-gray-400">
          <div className="font-medium">Q</div>
          <div className={getOEEStatusColor(oeeData.quality)}>
            {oeeData.quality.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Información de piezas */}
      <div className="grid grid-cols-2 gap-1 text-xs mt-1">
        <div className="text-green-400">
          <div className="font-medium">Buenas</div>
          <div>{oeeData.goodPieces}</div>
        </div>
        <div className="text-red-400">
          <div className="font-medium">Malas</div>
          <div>{oeeData.badPieces}</div>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-1">
        {formatLastUpdated(oeeData.lastUpdated)}
      </div>
    </div>
  );
};

export default OEEIndicator;
