import React, { useState, useEffect } from "react";
import { getDepartmentColor } from "../config/departmentColors.js";
import OEEConfigModal from "../Modals/OEEConfigModal.jsx";
import OEEIndicator from "./OEEIndicator.jsx";
import ContextualActions from "../ui/ContextualActions.jsx";
import ConfirmationDialog from "../ui/ConfirmationDialog.jsx";
import "../styles/industrial-ux.css";

const ProductionDashboard = () => {
  const [data, setData] = useState({
    lines: [],
    openEvents: [],
    closedEvents: [],
  });
  const [oeeModalOpen, setOeeModalOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventActions, setShowEventActions] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Mock data para demostración
  const mockData = {
    lines: [
      {
        id: "1",
        name: "LINEA 1",
        availability: 95.2,
        openEvents: [
          { department: "Calidad", status: "Alert" },
          { department: "Materiales", status: "Warning" },
        ],
      },
      {
        id: "2",
        name: "LINEA 2",
        availability: 87.4,
        openEvents: [
          { department: "Calidad", status: "Alert" },
          { department: "Materiales", status: "Warning" },
          { department: "Mantenimiento", status: "Critical" },
        ],
      },
      {
        id: "3",
        name: "LINEA 3",
        availability: 92.8,
        openEvents: [{ department: "Ingeniería", status: "Final Escalation" }],
      },
      {
        id: "4",
        name: "LINEA 4",
        availability: 78.9,
        openEvents: [
          { department: "Calidad", status: "Alert" },
          { department: "Materiales", status: "Warning" },
          { department: "Mantenimiento", status: "Critical" },
          { department: "Ingeniería", status: "Final Escalation" },
          { department: "Producción", status: "Alert" },
        ],
      },
      {
        id: "6",
        name: "LINEA 6",
        availability: 89.3,
        openEvents: [{ department: "Logística", status: "Warning" }],
      },
      {
        id: "7",
        name: "LINEA 7",
        availability: 94.7,
        openEvents: [],
      },
      {
        id: "8",
        name: "LINEA 8",
        availability: 85.6,
        openEvents: [
          { department: "Materiales", status: "Alert" },
          { department: "Calidad", status: "Critical" },
        ],
      },
      {
        id: "9",
        name: "LINEA 9",
        availability: 91.2,
        openEvents: [],
      },
    ],
    openEvents: [
      {
        id: "1",
        department: "Calidad",
        line: "LINEA 2",
        timestamp: new Date(Date.now() - 30 * 1000), // hace 30 segundos
        status: "Alert",
        duration: 30,
      },
      {
        id: "2",
        department: "Materiales",
        line: "LINEA 2",
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // hace 2 minutos
        status: "Warning",
        duration: 120,
      },
      {
        id: "3",
        department: "Mantenimiento",
        line: "LINEA 3",
        timestamp: new Date(Date.now() - 5 * 60 * 1000), // hace 5 minutos
        status: "Critical",
        duration: 300,
      },
      {
        id: "4",
        department: "Ingeniería",
        line: "LINEA 4",
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // hace 10 minutos
        status: "Final Escalation",
        duration: 600,
      },
      {
        id: "5",
        department: "Calidad",
        line: "LINEA 4",
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // hace 15 minutos
        status: "Alert",
        duration: 900,
      },
      {
        id: "6",
        department: "Producción",
        line: "LINEA 4",
        timestamp: new Date(Date.now() - 20 * 60 * 1000), // hace 20 minutos
        status: "Warning",
        duration: 1200,
      },
      {
        id: "7",
        department: "Logística",
        line: "LINEA 6",
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // hace 25 minutos
        status: "Critical",
        duration: 1500,
      },
      {
        id: "8",
        department: "Materiales",
        line: "LINEA 8",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // hace 30 minutos
        status: "Alert",
        duration: 1800,
      },
      {
        id: "9",
        department: "Calidad",
        line: "LINEA 8",
        timestamp: new Date(Date.now() - 35 * 60 * 1000), // hace 35 minutos
        status: "Warning",
        duration: 2100,
      },
      {
        id: "10",
        department: "Mantenimiento",
        line: "LINEA 10",
        timestamp: new Date(Date.now() - 40 * 60 * 1000), // hace 40 minutos
        status: "Final Escalation",
        duration: 2400,
      },
    ],
    closedEvents: [
      {
        id: "1",
        department: "Calidad",
        line: "LINEA 1",
        startTimestamp: new Date("2024-08-08T14:30:00"),
        endTimestamp: new Date("2024-08-08T14:32:15"),
        status: "Alert",
        duration: 135, // segundos
      },
      {
        id: "2",
        department: "Materiales",
        line: "LINEA 2",
        startTimestamp: new Date("2024-08-08T14:25:00"),
        endTimestamp: new Date("2024-08-08T14:28:30"),
        status: "Warning",
        duration: 210, // segundos
      },
      {
        id: "3",
        department: "Mantenimiento",
        line: "LINEA 3",
        startTimestamp: new Date("2024-08-08T14:20:00"),
        endTimestamp: new Date("2024-08-08T14:25:45"),
        status: "Critical",
        duration: 345, // segundos
      },
      {
        id: "4",
        department: "Ingeniería",
        line: "LINEA 4",
        startTimestamp: new Date("2024-08-08T14:15:00"),
        endTimestamp: new Date("2024-08-08T14:18:20"),
        status: "Final Escalation",
        duration: 200, // segundos
      },
      {
        id: "5",
        department: "Producción",
        line: "LINEA 5",
        startTimestamp: new Date("2024-08-08T14:10:00"),
        endTimestamp: new Date("2024-08-08T14:12:45"),
        status: "Alert",
        duration: 165, // segundos
      },
    ],
  };

  useEffect(() => {
    setData(mockData);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "Alert":
        return "bg-yellow-500";
      case "Warning":
        return "bg-orange-500";
      case "Critical":
        return "bg-orange-600";
      case "Final Escalation":
        return "bg-red-500";
      case "Running":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getCardBorderColor = (line) => {
    if (line.openEvents.length === 0) {
      return "border-green-500"; // Running - Verde
    }

    // Buscar el evento con mayor prioridad
    const priorities = {
      "Final Escalation": 4,
      Critical: 3,
      Warning: 2,
      Alert: 1,
    };

    const highestPriorityEvent = line.openEvents.reduce((prev, current) => {
      return priorities[current.status] > priorities[prev.status]
        ? current
        : prev;
    });

    switch (highestPriorityEvent.status) {
      case "Alert":
        return "border-yellow-500";
      case "Warning":
        return "border-orange-500";
      case "Critical":
        return "border-orange-600";
      case "Final Escalation":
        return "border-red-500";
      default:
        return "border-blue-500";
    }
  };

  const getCardBackgroundColor = (line) => {
    return "bg-slate-900"; // Azul oscuro fijo para todas las tarjetas
  };

  const getBlinkingBorderColor = (line) => {
    if (line.openEvents.length === 0) {
      return "border-green-500"; // Running - Verde sin parpadear
    }

    // Buscar el evento con mayor prioridad
    const priorities = {
      "Final Escalation": 4,
      Critical: 3,
      Warning: 2,
      Alert: 1,
    };

    const highestPriorityEvent = line.openEvents.reduce((prev, current) => {
      return priorities[current.status] > priorities[prev.status]
        ? current
        : prev;
    });

    switch (highestPriorityEvent.status) {
      case "Alert":
        return "border-yellow-500 animate-blink";
      case "Warning":
        return "border-orange-500 animate-blink";
      case "Critical":
        return "border-orange-600 animate-blink";
      case "Final Escalation":
        return "border-red-500 animate-blink";
      default:
        return "border-blue-500";
    }
  };

  const getStatusTextColor = (status) => {
    switch (status) {
      case "Alert":
        return "text-white bg-yellow-500";
      case "Warning":
        return "text-white bg-orange-500";
      case "Critical":
        return "text-white bg-orange-600";
      case "Final Escalation":
        return "text-white bg-red-500";
      case "Running":
        return "text-white bg-green-500";
      default:
        return "text-white bg-gray-500";
    }
  };

  const getDepartmentCellStyle = (department) => {
    const color = getDepartmentColor(department);
    // Determinar si el color es claro u oscuro para el contraste del texto
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? "text-black" : "text-white";

    return {
      backgroundColor: color,
      color: textColor === "text-black" ? "#000000" : "#ffffff",
    };
  };

  const formatDuration = (seconds) => {
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
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getAvailabilityColor = (availability) => {
    if (availability >= 95) return "text-green-600";
    if (availability >= 90) return "text-green-500";
    if (availability >= 85) return "text-yellow-500";
    if (availability >= 80) return "text-orange-500";
    return "text-red-500";
  };

  const getDurationBarWidth = (duration) => {
    // Duración máxima de 1 hora (3600 segundos)
    const maxDuration = 3600;
    const percentage = Math.min((duration / maxDuration) * 100, 100);
    return `${percentage}%`;
  };

  const handleLineClick = (line) => {
    setSelectedLine(line);
    setOeeModalOpen(true);
  };

  const handleOeeSave = (configData) => {
    console.log("OEE Configuration saved:", configData);
    // Aquí se puede implementar la lógica para guardar la configuración
    // y actualizar el estado del dashboard si es necesario
  };

  const handleOeeModalClose = () => {
    setOeeModalOpen(false);
    setSelectedLine(null);
  };

  // Contextual action handlers
  const handleViewHistory = (event) => {
    console.log("Viewing history for event:", event);
    // Navigate to historical data for this event
  };

  const handleViewRelated = (event) => {
    console.log("Viewing related events for:", event);
    // Show related events
  };

  const handleViewProcedures = (event) => {
    console.log("Viewing procedures for:", event);
    // Open procedures modal/documentation
  };

  const handleViewAnalytics = (event) => {
    console.log("Viewing analytics for:", event);
    // Open analytics dashboard
  };

  const handleConfigure = (event) => {
    console.log("Configuring event:", event);
    // Open configuration panel
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventActions(true);
  };

  const handleCriticalAction = (action) => {
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  return (
    <>
      <style>{`
        @keyframes blink {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s ease-in-out infinite;
        }
      `}</style>
      <div className="p-8 bg-slate-950 min-h-screen industrial-high-contrast">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-100 mb-2 industrial-text-shadow-strong">
            Dashboard de Producción Industrial
          </h1>
          <p className="text-lg text-slate-400 industrial-text-shadow">
            Monitoreo en tiempo real de líneas de producción y eventos críticos
          </p>
        </div>

        {/* Líneas de Producción */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 industrial-text-shadow">
            Líneas de Producción
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {data.lines.map((line) => (
              <div
                key={line.id}
                className="relative cursor-pointer transition-transform hover:scale-105"
                onClick={() => handleLineClick(line)}
                title="Clic para configurar OEE"
              >
                {/* Tarjeta principal */}
                <div
                  className={`${getCardBackgroundColor(
                    line
                  )} rounded-xl p-6 border-2 border-slate-700 industrial-card ${
                    line.openEvents.length > 0 ? "critical" : ""
                  }`}
                >
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-100 mb-3 industrial-text-shadow">
                      {line.name}
                    </h3>

                    {/* Indicador OEE */}
                    <div className="mb-4">
                      <OEEIndicator
                        lineId={line.id}
                        lineName={line.name}
                      />
                    </div>

                    <div
                      className={`text-3xl font-bold ${getAvailabilityColor(
                        line.availability
                      )} mb-4 industrial-text-shadow-strong`}
                    >
                      {line.availability.toFixed(1)}%
                    </div>

                    {/* Barras horizontales de eventos activos */}
                    {line.openEvents.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-1">
                        {line.openEvents.map((event, index) => {
                          const totalEvents = line.openEvents.length;
                          const baseWidth =
                            totalEvents <= 3
                              ? "w-8"
                              : totalEvents <= 5
                              ? "w-6"
                              : "w-4";
                          const height =
                            totalEvents <= 3
                              ? "h-3"
                              : totalEvents <= 5
                              ? "h-2.5"
                              : "h-2";

                          return (
                            <div
                              key={index}
                              className={`${baseWidth} ${height} rounded-full transition-all duration-200 hover:scale-110`}
                              style={{
                                backgroundColor: getDepartmentColor(
                                  event.department
                                ),
                              }}
                              title={`${event.department} - ${event.status}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                {/* Contorno parpadeante overlay */}
                <div
                  className={`absolute inset-0 rounded-lg border-4 pointer-events-none ${getBlinkingBorderColor(
                    line
                  )} industrial-blink`}
                ></div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensores */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Sensores de Monitoreo
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Sensor de Temperatura */}
            <div className="bg-slate-900 rounded-lg shadow-lg p-4 border-l-4 border-red-500 border border-slate-800">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  TANK1_TEMP
                </h3>
                <div className="text-3xl font-bold text-red-400 mb-3">
                  85.2°C
                </div>

                {/* Estado del sensor */}
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs font-medium text-yellow-400">
                    Alert
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"
                    style={{ width: "85.2%" }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Sensor de Vibración */}
            <div className="bg-slate-900 rounded-lg shadow-lg p-4 border-l-4 border-orange-500 border border-slate-800">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-100 mb-2">
                  MOTOR1_VIB
                </h3>
                <div className="text-3xl font-bold text-orange-400 mb-3">
                  12.8 mm/s
                </div>

                {/* Estado del sensor */}
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-xs font-medium text-green-400">
                    Normal
                  </span>
                </div>

                {/* Barra de progreso */}
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 h-2 rounded-full"
                    style={{ width: "64%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eventos Abiertos */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-100 mb-6 industrial-text-shadow">
            Eventos Abiertos ({data.openEvents.length}) - Mostrando{" "}
            {Math.min(6, data.openEvents.length)}
          </h2>
          <div className="bg-slate-900 rounded-xl shadow-lg overflow-hidden border-2 border-slate-700 industrial-card">
            <div className="overflow-y-auto max-h-96">
              <table className="w-full industrial-table">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Línea
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Inicio
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-8 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-700">
                  {data.openEvents.slice(0, 6).map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-800 transition-colors duration-200"
                    >
                      <td className="px-8 py-5 whitespace-nowrap">
                        <div
                          className="px-4 py-3 rounded-lg font-bold text-base"
                          style={getDepartmentCellStyle(event.department)}
                        >
                          {event.department}
                        </div>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-slate-300 font-medium">
                        {event.line}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-slate-300 font-medium">
                        {formatTimestamp(event.timestamp)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${getStatusTextColor(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap text-base text-slate-300 font-medium">
                        {formatDuration(event.duration)}
                      </td>
                      <td className="px-8 py-5 whitespace-nowrap">
                        <button
                          onClick={() => handleEventClick(event)}
                          className="text-blue-400 hover:text-blue-300 font-semibold text-base transition-colors duration-200"
                        >
                          Ver Acciones
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Eventos Cerrados */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Últimos Eventos Cerrados ({data.closedEvents.length})
          </h2>
          <div className="bg-slate-900 rounded-lg shadow-lg overflow-hidden border border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Departamento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Línea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Inicio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Final
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Duración
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Gráfico
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-900 divide-y divide-slate-700">
                  {data.closedEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-slate-800"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className="px-3 py-2 rounded-md font-medium text-sm"
                          style={getDepartmentCellStyle(event.department)}
                        >
                          {event.department}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {event.line}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatTimestamp(event.startTimestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatTimestamp(event.endTimestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {formatDuration(event.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-32 bg-slate-700 rounded-full h-2 mr-2">
                            <div
                              className={`h-2 rounded-full ${getStatusColor(
                                event.status
                              )}`}
                              style={{
                                width: getDurationBarWidth(event.duration),
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-slate-400">
                            {formatDuration(event.duration)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Configuración OEE */}
      <OEEConfigModal
        isOpen={oeeModalOpen}
        onClose={handleOeeModalClose}
        lineData={selectedLine}
        onSave={handleOeeSave}
      />

      {/* Modal de Acciones Contextuales */}
      {showEventActions && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm industrial-modal-overlay"
            onClick={() => setShowEventActions(false)}
          />
          <div className="relative bg-slate-900 border-2 border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl mx-4 p-8 industrial-modal">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-slate-100">
                Acciones para Evento: {selectedEvent.department} -{" "}
                {selectedEvent.line}
              </h3>
              <button
                onClick={() => setShowEventActions(false)}
                className="text-slate-400 hover:text-slate-100 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <span className="font-semibold text-slate-300">Estado:</span>
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusTextColor(
                      selectedEvent.status
                    )}`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">
                    Duración:
                  </span>
                  <span className="ml-2 text-slate-200">
                    {formatDuration(selectedEvent.duration)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Inicio:</span>
                  <span className="ml-2 text-slate-200">
                    {formatTimestamp(selectedEvent.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-300">Línea:</span>
                  <span className="ml-2 text-slate-200">
                    {selectedEvent.line}
                  </span>
                </div>
              </div>
            </div>

            <ContextualActions
              event={selectedEvent}
              onViewHistory={handleViewHistory}
              onViewRelated={handleViewRelated}
              onViewProcedures={handleViewProcedures}
              onConfigure={handleConfigure}
              onViewAnalytics={handleViewAnalytics}
            />
          </div>
        </div>
      )}

      {/* Dialog de Confirmación */}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          if (confirmAction) {
            confirmAction();
          }
          setConfirmAction(null);
        }}
        title="Confirmar Acción Crítica"
        message="Esta acción puede afectar el sistema de producción. ¿Está seguro de continuar?"
        type="warning"
        confirmText="Sí, Continuar"
        cancelText="Cancelar"
        critical={true}
      />
    </>
  );
};

export default ProductionDashboard;
