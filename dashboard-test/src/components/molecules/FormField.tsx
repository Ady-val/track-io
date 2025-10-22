import React from "react";
import { Input } from "../atoms/Input";
import { Label } from "../atoms/Label";
import { Select } from "../atoms/Select";

export interface FormFieldProps {
  label: string;
  name: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  options?: Array<{ value: string | number; label: string }>;
  select?: boolean;
}

export function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  disabled = false,
  className = "",
  options = [],
  select = false,
}: FormFieldProps) {
  const fieldId = `field-${name}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>

      {select ? (
        <Select
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }
        >
          <option value="">Seleccionar...</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          id={fieldId}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
