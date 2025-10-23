import type { SelectProps } from "@components/atoms";

import type React from "react";

import { Select, Label } from "@components/atoms";

export interface SelectFieldProps extends Omit<SelectProps, "id"> {
  label: string;
  id: string;
  required?: boolean;
  error?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  id,
  required = false,
  error,
  children,
  ...selectProps
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <Select fullWidth id={id} {...selectProps}>
        {children}
      </Select>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};
