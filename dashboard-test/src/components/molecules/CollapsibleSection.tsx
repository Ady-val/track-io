import React, { useState } from "react";
import { Card, CardBody, Text, Spinner } from "@components/atoms";
import { FaChevronLeft, FaChevronDown } from "react-icons/fa";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  isLoading = false,
  onToggle,
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  return (
    <div className={`mb-8 ${className}`}>
      {/* Header clickeable */}
      <div
        className="flex items-center justify-between cursor-pointer p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200"
        onClick={handleToggle}
      >
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        <div className="flex items-center gap-2">
          {isLoading && <Spinner size="sm" color="blue" />}
          <div
            className={`transform transition-transform duration-200 ${
              isExpanded ? "rotate-90" : "rotate-0"
            }`}
          >
            <FaChevronLeft className="text-slate-400 text-lg" />
          </div>
        </div>
      </div>

      {/* Contenido colapsible */}
      {isExpanded && <div className="mt-4 animate-fadeIn">{children}</div>}
    </div>
  );
};



