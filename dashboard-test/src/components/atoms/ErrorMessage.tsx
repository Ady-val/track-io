import type React from "react";

export interface ErrorMessageProps {
  title?: string;
  message: string | React.ReactNode;
  type?: "validation" | "server" | "generic";
  isServerError?: boolean; // true if status code >= 500
  className?: string;
  /**
   * ID para accesibilidad
   */
  id?: string;
}

/**
 * Componente para mostrar mensajes de error del servidor o errores generales
 * Mejorado para mejor integración con react-hook-form y accesibilidad
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = "generic",
  isServerError = false,
  className = "",
  id,
}) => {
  const getTitle = () => {
    if (title) return title;

    switch (type) {
      case "validation":
        return "Errores de validación:";
      case "server":
        return isServerError ? "Error del servidor:" : "Error:";
      default:
        return "Error:";
    }
  };

  if (!message) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className={`bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 ${className}`}
      id={id}
      role="alert"
    >
      <h4 className="text-red-400 font-semibold mb-2">{getTitle()}</h4>
      <div className="text-red-300 text-sm">
        {typeof message === "string" ? <p>{message}</p> : message}
      </div>
    </div>
  );
};
