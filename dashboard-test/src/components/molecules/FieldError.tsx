import type React from "react";

import { Text } from "../atoms/Text";

export interface FieldErrorProps {
  /**
   * Mensaje de error a mostrar
   */
  error?: string | React.ReactNode;
  /**
   * Clase CSS adicional
   */
  className?: string;
  /**
   * ID del campo (para accesibilidad)
   */
  fieldId?: string;
}

/**
 * Componente para mostrar errores de validación por campo
 * Integrado con react-hook-form y compatible con HeroUI
 */
export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  className = "",
  fieldId,
}) => {
  if (!error) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={`mt-1 ${className}`}
      id={fieldId ? `${fieldId}-error` : undefined}
      role="alert"
    >
      <Text className="text-red-400" variant="caption">
        {typeof error === "string" ? error : error}
      </Text>
    </div>
  );
};
