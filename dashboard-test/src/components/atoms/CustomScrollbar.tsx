import React from "react";

export interface CustomScrollbarProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "dashboard" | "table" | "dark";
}

export const CustomScrollbar: React.FC<CustomScrollbarProps> = ({
  children,
  className = "",
  variant = "default",
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case "dashboard":
        return "dashboard-scrollbar";
      case "table":
        return "table-scrollbar";
      case "dark":
        return "dark-scrollbar";
      default:
        return "";
    }
  };

  return (
    <div className={`${getVariantClass()} smooth-scroll ${className}`}>
      {children}
    </div>
  );
};
