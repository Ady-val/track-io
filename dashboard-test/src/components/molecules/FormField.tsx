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
          classNames={{
            inputWrapper: error
              ? "bg-slate-700 border-slate-600 hover:border-slate-500 focus-within:border-red-500 border-red-500"
              : "bg-slate-700 border-slate-600 hover:border-slate-500 focus-within:border-blue-500",
            input: "!text-white placeholder:text-slate-400",
            label: "!text-white text-sm",
          }}
          id={fieldId}
          isDisabled={disabled}
          name={name}
          placeholder={placeholder}
          required={required}
          type={type}
          value={String(value)}
          variant="bordered"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(e.target.value)
          }
          onValueChange={(val: string) => onChange(val)}
        />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
