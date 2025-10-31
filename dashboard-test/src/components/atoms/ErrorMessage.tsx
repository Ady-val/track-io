import type React from "react";

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: "validation" | "server" | "generic";
  isServerError?: boolean; // true if status code >= 500
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = "generic",
  isServerError = false,
  className = "",
}) => {
  const getTitle = () => {
    if (title) return title;

    switch (type) {
      case "validation":
        return "Errores de validación:";
      case "server":
        // Only show "Error del servidor" for 500+ errors
        return isServerError ? "Error del servidor:" : "Error:";
      default:
        return "Error:";
    }
  };

  return (
    <div
      className={`bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 ${className}`}
    >
      <h4 className="text-red-400 font-semibold mb-2">{getTitle()}</h4>
      <p className="text-red-300 text-sm">{message}</p>
    </div>
  );
};

