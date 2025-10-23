import React from "react";

import { FaExclamationTriangle, FaRedo, FaWifi } from "react-icons/fa";

import { Button, Text } from "@components/atoms";

interface DataErrorStateProps {
  title?: string;
  error?: Error | string;
  onRetry?: () => void;
  type?: "network" | "server" | "generic";
}

export const DataErrorState: React.FC<DataErrorStateProps> = ({
  title,
  error,
  onRetry,
  type = "generic",
}) => {
  const getTitle = () => {
    if (title) return title;

    switch (type) {
      case "network":
        return "Error de Conexión";
      case "server":
        return "Error del Servidor";
      default:
        return "Error al Cargar Datos";
    }
  };

  const getDescription = () => {
    const errorMessage = error instanceof Error ? error.message : error;

    if (errorMessage) {
      return errorMessage;
    }

    switch (type) {
      case "network":
        return "No se pudo conectar con el servidor. Verifica tu conexión a internet.";
      case "server":
        return "El servidor no está respondiendo correctamente. Intenta nuevamente.";
      default:
        return "Ocurrió un error inesperado al cargar los datos.";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "network":
        return <FaWifi className="w-16 h-16 mx-auto mb-4 text-red-400" />;
      default:
        return (
          <FaExclamationTriangle className="w-16 h-16 mx-auto mb-4 text-red-400" />
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {getIcon()}
      <Text className="mb-2 text-red-400" variant="h3">
        {getTitle()}
      </Text>
      <Text className="mb-6 max-w-md" color="muted" variant="body">
        {getDescription()}
      </Text>
      {onRetry && (
        <Button
          color="primary"
          startContent={<FaRedo className="w-4 h-4" />}
          variant="solid"
          onClick={onRetry}
        >
          Reintentar
        </Button>
      )}
    </div>
  );
};
