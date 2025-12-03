import type { AreaDowntime } from "../../types/areaDowntime";

import React, { useState } from "react";

import { FaChevronDown, FaChevronRight, FaCircle } from "react-icons/fa";

import { Spinner } from "../atoms/Spinner";

interface AreaDowntimesTableProps {
  data: AreaDowntime[];
  loading?: boolean;
  className?: string;
}

export const AreaDowntimesTable: React.FC<AreaDowntimesTableProps> = ({
  data,
  loading = false,
  className = "",
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (startAt: string, endsAt?: string) => {
    const start = new Date(startAt);
    const end = endsAt ? new Date(endsAt) : new Date();
    const durationMs = end.getTime() - start.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const formatEventDuration = (createdAt: string, closedAt?: string) => {
    if (!closedAt) return "-";

    const start = new Date(createdAt);
    const end = new Date(closedAt);
    const durationMs = end.getTime() - start.getTime();

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "text-red-500";
      case "in-progress":
        return "text-yellow-500";
      case "closed":
        return "text-green-500";
      default:
        return "text-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "open":
        return "Abierto";
      case "in-progress":
        return "En Progreso";
      case "closed":
        return "Cerrado";
      default:
        return status;
    }
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);

    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  if (loading) {
    return (
      <div
        className={`bg-slate-900 rounded-xl shadow-lg border-2 border-slate-700 ${className}`}
      >
        <div className="flex items-center justify-center p-12">
          <div className="flex items-center space-x-3">
            <Spinner color="primary" size="lg" />
            <span className="text-slate-300 text-lg">Cargando datos...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-900 rounded-xl shadow-lg overflow-hidden border-2 border-slate-700 flex flex-col ${className}`}
    >
      <div className="flex-1 overflow-y-auto overflow-x-auto table-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-800 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Activo
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Fin
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Duración
              </th>
              <th className="px-6 py-4 text-center text-sm font-bold text-slate-200 uppercase tracking-wider">
                Eventos
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-700">
            {data.map((downtime) => (
              <React.Fragment key={downtime.id}>
                {/* Main Row */}
                <tr className="hover:bg-slate-800 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg text-slate-300 font-medium">
                      {downtime.areaName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FaCircle
                        className={`w-3 h-3 mr-2 ${downtime.isActive ? "text-red-500" : "text-gray-500"}`}
                      />
                      <span className="text-lg text-slate-300 font-medium">
                        {downtime.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                    {formatDateTime(downtime.startAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                    {downtime.endsAt ? formatDateTime(downtime.endsAt) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                    {formatDuration(downtime.startAt, downtime.endsAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button
                      className="flex items-center justify-center w-full text-slate-300 hover:text-white transition-colors duration-200"
                      onClick={() => toggleRow(downtime.id)}
                    >
                      {expandedRows.has(downtime.id) ? (
                        <FaChevronDown className="w-4 h-4" />
                      ) : (
                        <FaChevronRight className="w-4 h-4" />
                      )}
                      <span className="ml-2 font-medium">
                        {downtime.events.length}
                      </span>
                    </button>
                  </td>
                </tr>

                {/* Sub-rows for Events */}
                {expandedRows.has(downtime.id) && (
                  <tr>
                    <td className="px-0 py-0" colSpan={6}>
                      <div className="bg-slate-800/50 border-t border-slate-600">
                        <div className="px-6 py-4">
                          <div className="text-sm font-bold text-slate-200 mb-3 uppercase tracking-wider border-b border-slate-600 pb-2">
                            Eventos Relacionados
                          </div>
                          <div className="overflow-x-auto rounded-lg border border-slate-600 bg-slate-800/30">
                            <table className="w-full">
                              <thead className="bg-slate-700">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Departamento
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Dispositivo
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Botón
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Status
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Abierto
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    En Progreso
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider border-r border-slate-600">
                                    Cerrado
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-200 uppercase tracking-wider">
                                    Duración
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-slate-800/40 divide-y divide-slate-600">
                                {downtime.events.map((event) => (
                                  <tr
                                    key={event.id}
                                    className="hover:bg-slate-600/50 transition-colors duration-200"
                                  >
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {event.departmentName}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {event.deviceName}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {event.deviceSignalName}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                      <span
                                        className={`font-medium ${getStatusColor(event.status)}`}
                                      >
                                        {getStatusText(event.status)}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {formatDateTime(event.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {event.inProgressAt
                                        ? formatDateTime(event.inProgressAt)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {event.closedAt
                                        ? formatDateTime(event.closedAt)
                                        : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-300">
                                      {formatEventDuration(
                                        event.createdAt,
                                        event.closedAt
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
