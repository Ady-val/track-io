import type React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
  isInvalid?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  children,
  className = "",
  fullWidth = false,
  isInvalid = false,
  ...props
}) => {
  const baseClasses =
    "px-3 py-2 bg-slate-700 border rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-500 transition-colors h-10 min-h-10";
  const borderClass = isInvalid
    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
    : "border-slate-600 focus:border-blue-500";
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <select
      className={`${baseClasses} ${borderClass} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};
