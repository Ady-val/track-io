import type React from "react";

export interface ValidationErrorListProps {
  errors: string[];
  title?: string;
  className?: string;
}

export const ValidationErrorList: React.FC<ValidationErrorListProps> = ({
  errors,
  title = "Errores de validación:",
  className = "",
}) => {
  if (errors.length === 0) return null;

  return (
    <div
      className={`bg-red-900/20 border border-red-500 rounded-lg p-4 mb-4 ${className}`}
    >
      <h4 className="text-red-400 font-semibold mb-2">{title}</h4>
      <ul className="text-red-300 text-sm space-y-1">
        {errors.map((error, index) => (
          <li key={index}>• {error}</li>
        ))}
      </ul>
    </div>
  );
};

