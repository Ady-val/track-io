import React, { useState, useMemo } from "react";
import {
  getDepartmentColor,
  getAvailabilityColor,
} from "../config/departmentColors.js";
import StateTimeline from "./StateTimeline.jsx";
import AvailabilityIndicator from "./AvailabilityIndicator.jsx";

const EnhancedDashboard = ({ data, onEventClick }) => {
  const [filters, setFilters] = useState({
    department: "",
    line: "",
    status: "",
    search: "",
  });

  // Filter data based on current filters
  const filteredData = useMemo(() => {
    return data.lines.filter((line) => {
      if (filters.line && line.name !== filters.line) return false;

      const filteredEvents = line.events.filter((event) => {
        if (filters.department && event.department !== filters.department)
          return false;
        if (filters.status && event.status !== filters.status) return false;
        if (
          filters.search &&
          !event.title.toLowerCase().includes(filters.search.toLowerCase())
        )
          return false;
        return true;
      });

      return (
        filteredEvents.length > 0 ||
        (!filters.department && !filters.status && !filters.search)
      );
    });
  }, [data.lines, filters]);

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
        return "border-red-600";
      case "high":
        return "border-orange-500";
      case "medium":
        return "border-yellow-500";
      case "low":
        return "border-green-500";
      default:
        return "border-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Departamento
            </label>
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, department: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos</option>
              {data.departments.map((dept) => (
                <option
                  key={dept.name}
                  value={dept.name}
                >
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Línea
            </label>
            <select
              value={filters.line}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, line: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todas</option>
              {data.lines.map((line) => (
                <option
                  key={line.id}
                  value={line.name}
                >
                  {line.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Todos</option>
              <option value="open">Abierto</option>
              <option value="in-progress">En Progreso</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Búsqueda
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              placeholder="Buscar eventos..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      {/* Production Lines */}
      <div className="space-y-4">
        {filteredData.map((line) => (
          <div
            key={line.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow"
          >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {line.name}
                </h3>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between">
                {/* State Timeline */}
                <div className="flex-1 mr-4">
                  <StateTimeline
                    events={line.events}
                    onEventClick={onEventClick}
                  />
                </div>

                {/* Availability Indicator */}
                <div className="flex-shrink-0">
                  <AvailabilityIndicator
                    availability={line.availability}
                    showLabel={false}
                    size="md"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Events Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Eventos Abiertos
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Evento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Línea
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Departamento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Prioridad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Duración
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredData.flatMap((line) =>
                line.events
                  .filter(
                    (event) =>
                      event.status === "open" || event.status === "in-progress"
                  )
                  .map((event) => (
                    <tr
                      key={event.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => onEventClick?.(event)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {event.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {event.line}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                          style={{
                            backgroundColor: getDepartmentColor(
                              event.department
                            ),
                          }}
                        >
                          {event.department}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            event.status === "open"
                              ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                              : event.status === "in-progress"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                              : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          }`}
                        >
                          {event.status === "open"
                            ? "Abierto"
                            : event.status === "in-progress"
                            ? "En Progreso"
                            : "Cerrado"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div
                          className={`w-4 h-4 rounded-full border-2 ${getPriorityColor(
                            event.priority
                          )}`}
                        ></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(event.start, event.end)}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDashboard;
