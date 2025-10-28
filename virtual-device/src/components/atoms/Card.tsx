import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  const defaultClassName = `bg-blue-100 border border-blue-300 rounded-lg p-4 ${className}`;

  return <div className={defaultClassName}>{children}</div>;
};
