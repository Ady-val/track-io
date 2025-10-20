import React, { useState, useEffect } from "react";
import {
  getDepartmentColor,
  getStatusTextColor,
  getEventStatusColor,
} from "../../config/departmentColors";
import type { DashboardEventData } from "../../types/dashboard";

interface EventsTableProps {
  events: DashboardEventData[];
  title: string;
  onEventClick?: (event: DashboardEventData) => void;
  className?: string;
}

export const EventsTable: React.FC<EventsTableProps> = ({
  events,
  title,
  onEventClick,
  className = "",
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const calculateEventDuration = (startedAt: Date | string) => {
    const startTime = new Date(startedAt);
    const duration = Math.floor(
      (currentTime.getTime() - startTime.getTime()) / 1000
    );
    return formatDuration(Math.max(0, duration));
  };

  const formatDuration = (seconds: number) => {
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

  const getDepartmentCellStyle = (department: string) => {
    const color = getDepartmentColor(department);
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    const textColor = brightness > 128 ? "#000000" : "#ffffff";

    return {
      backgroundColor: color,
      color: textColor,
    };
  };

  return (
    <div
      className={`bg-slate-900 rounded-xl shadow-lg overflow-hidden border-2 border-slate-700 ${className}`}
    >
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-slate-100">
          {title} ({events.length})
        </h2>
      </div>

      <div className="overflow-x-auto table-scrollbar">
        <table className="w-full">
          <thead className="bg-slate-800">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Departamento
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Área
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Dispositivo
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Señal
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Inicio
              </th>
              <th className="px-6 py-4 text-left text-sm font-bold text-slate-200 uppercase tracking-wider">
                Duración
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-900 divide-y divide-slate-700">
            {events.map((event) => (
              <tr
                key={event.id}
                className="hover:bg-slate-800 transition-colors duration-200 cursor-pointer"
                onClick={() => onEventClick?.(event)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div
                    className="inline-flex items-center px-3 py-2 rounded-full text-lg font-semibold border"
                    style={{
                      backgroundColor: getEventStatusColor(event.status) + "40",
                      borderColor: getEventStatusColor(event.status),
                      color: "#FFFFFF",
                      textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                    }}
                  >
                    {event.department}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                  {event.area}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                  {event.device}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                  {event.signal}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                  {formatTimestamp(event.startedAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-lg text-slate-300 font-medium">
                  {calculateEventDuration(event.startedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {events.length === 0 && (
        <div className="p-8 text-center">
          <p className="text-slate-400 text-lg">No hay eventos disponibles</p>
        </div>
      )}
    </div>
  );
};
