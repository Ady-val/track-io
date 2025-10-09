import type React from "react";
import { Input, Label } from "@components/atoms";
import type { InputProps } from "@components/atoms";

export interface FormFieldProps extends Omit<InputProps, "id"> {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  required = false,
  error,
  ...inputProps
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Input id={id} {...inputProps} />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};
