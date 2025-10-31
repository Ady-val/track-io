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
  autoFocus?: boolean;
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
  autoFocus = false,
}: FormFieldProps) {
  const fieldId = `field-${name}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} required={required}>
        {label}
      </Label>

      {select ? (
        <Select
          className={
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }
          disabled={disabled}
          id={fieldId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
          autoFocus={autoFocus}
          className={
            error
              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
              : ""
          }
          disabled={disabled}
          id={fieldId}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
