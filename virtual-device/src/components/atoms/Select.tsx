import type React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  children,
  className = "",
  fullWidth = false,
  ...props
}) => {
  const baseClasses =
    "px-3 py-2 bg-blue-100 border border-blue-300 rounded-md text-blue-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-400";
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <select className={`${baseClasses} ${widthClass} ${className}`} {...props}>
      {children}
    </select>
  );
};
