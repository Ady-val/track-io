import React from "react";

export interface CheckboxProps {
  isSelected?: boolean;
  onValueChange?: (isSelected: boolean) => void;
  color?: "primary" | "secondary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  isDisabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  isSelected = false,
  onValueChange,
  color = "primary",
  size = "md",
  isDisabled = false,
  children,
  className = "",
}) => {
  const baseClasses = "inline-flex items-center cursor-pointer";
  const disabledClasses = isDisabled ? "opacity-50 cursor-not-allowed" : "";

  const colorClasses = {
    primary: "text-blue-600",
    secondary: "text-slate-600",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600",
  };

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const checkboxSizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const classes = `${baseClasses} ${disabledClasses} ${colorClasses[color]} ${sizeClasses[size]} ${className}`;

  return (
    <label className={classes}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => onValueChange?.(e.target.checked)}
        disabled={isDisabled}
        className={`${checkboxSizeClasses[size]} rounded border-2 border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mr-2`}
      />
      {children}
    </label>
  );
};
