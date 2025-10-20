import React from "react";
import { getDepartmentColor } from "../config/departmentColors.js";

const StateTimeline = ({ events, onEventClick }) => {
  const formatDuration = (start, end) => {
    const endTime = end || new Date();
    const diffMs = endTime.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical":
        return "border-red-600 bg-red-50";
      case "high":
        return "border-orange-500 bg-orange-50";
      case "medium":
        return "border-yellow-500 bg-yellow-50";
      case "low":
        return "border-green-500 bg-green-50";
      default:
        return "border-gray-400 bg-gray-50";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        );
      case "in-progress":
        return (
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
        );
      case "closed":
        return <div className="w-2 h-2 bg-green-500 rounded-full"></div>;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="flex items-center space-x-2 overflow-x-auto pb-2">
      {events
        .filter(
          (event) => event.status === "open" || event.status === "in-progress"
        )
        .sort((a, b) => {
          // Sort by priority: critical > high > medium > low
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        })
        .map((event) => (
          <div
            key={event.id}
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => onEventClick?.(event)}
          >
            <div className="flex items-center space-x-2">
              {getStatusIcon(event.status)}
              <div
                className="h-8 px-3 rounded-lg flex items-center justify-center text-white text-xs font-medium min-w-24 transition-all duration-200 hover:scale-105 shadow-md"
                style={{
                  backgroundColor: getDepartmentColor(event.department),
                }}
              >
                {event.title}
              </div>
            </div>

            {/* Enhanced Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 whitespace-nowrap shadow-xl">
              <div className="font-semibold text-base mb-1">{event.title}</div>
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">Departamento:</span>
                  <span
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{
                      backgroundColor: getDepartmentColor(event.department),
                    }}
                  >
                    {event.department}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">Prioridad:</span>
                  <div
                    className={`w-3 h-3 rounded-full border-2 ${
                      getPriorityColor(event.priority).split(" ")[0]
                    }`}
                  ></div>
                  <span className="capitalize">{event.priority}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">Duración:</span>
                  <span className="font-mono">
                    {formatDuration(event.start, event.end)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-300">Estado:</span>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      event.status === "open"
                        ? "bg-red-600"
                        : event.status === "in-progress"
                        ? "bg-yellow-600"
                        : "bg-green-600"
                    }`}
                  >
                    {event.status === "open"
                      ? "Abierto"
                      : event.status === "in-progress"
                      ? "En Progreso"
                      : "Cerrado"}
                  </span>
                </div>
              </div>
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 absolute top-full left-1/2 transform -translate-x-1/2"></div>
            </div>
          </div>
        ))}

      {events.filter(
        (event) => event.status === "open" || event.status === "in-progress"
      ).length === 0 && (
        <div className="text-gray-500 dark:text-gray-400 text-sm italic">
          No hay eventos activos
        </div>
      )}
    </div>
  );
};

export default StateTimeline;
