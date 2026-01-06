import type React from "react";

export interface ValidationErrorListProps {
  errors: string[] | React.ReactNode[];
  title?: string;
  className?: string;
  /**
   * ID para accesibilidad
   */
  id?: string;
}

/**
 * Componente para mostrar una lista de errores de validación
 * Mejorado para mejor integración con react-hook-form y accesibilidad
 */
export const ValidationErrorList: React.FC<ValidationErrorListProps> = ({
  errors,
  title = "Errores de validación:",
  className = "",
  id,
}) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className={`bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 ${className}`}
      id={id}
      role="alert"
    >
      <h4 className="text-red-400 font-semibold mb-2">{title}</h4>
      <ul className="text-red-300 text-sm space-y-1 list-disc list-inside">
        {errors.map((error, index) => (
          <li key={index}>{typeof error === "string" ? error : error}</li>
        ))}
      </ul>
    </div>
  );
};
