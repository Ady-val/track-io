import React from "react";

import { FaClock } from "react-icons/fa";

import { Text } from "../components/atoms/Text";
import { AreaDowntimesTable } from "../components/organisms";
import { useAreaDowntimes } from "../hooks/useAreaDowntimes";

export const AreaDowntimesPage: React.FC = () => {
  const { data, isLoading, error } = useAreaDowntimes({ limit: 10 });

  return (
    <div className="flex flex-col h-full p-6">
      {/* Header */}
      <div className="flex-shrink-0 pb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-xl">
            <FaClock className="w-6 h-6 text-white" />
          </div>
          <div>
            <Text color="primary" variant="h2">
              Tiempos de Paro por Área
            </Text>
            <Text className="mt-1" color="muted" variant="caption">
              Historial de tiempos de inactividad y eventos relacionados
            </Text>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden pb-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <Text color="danger">
              Error al cargar los datos: {error.message}
            </Text>
          </div>
        )}

        <div className="h-full">
          <AreaDowntimesTable
            className="h-full"
            data={data?.data ?? []}
            loading={isLoading}
          />
        </div>
      </div>
    </div>
  );
};
