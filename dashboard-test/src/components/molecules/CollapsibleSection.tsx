import React, { useEffect, useState } from "react";

import { FaChevronLeft } from "react-icons/fa";

import { Spinner } from "@components/atoms";

export interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  isLoading?: boolean;
  onToggle?: (isExpanded: boolean) => void;
  className?: string;
  defaultExpanded?: boolean;
  forceExpanded?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  isLoading = false,
  onToggle,
  className = "",
  defaultExpanded = false,
  forceExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true);
      return;
    }
    setIsExpanded(defaultExpanded);
  }, [defaultExpanded, forceExpanded]);

  const handleToggle = () => {
    if (forceExpanded) {
      return;
    }

    const newExpanded = !isExpanded;

    setIsExpanded(newExpanded);
    onToggle?.(newExpanded);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`mb-8 ${className}`}>
      {/* Header clickeable */}
      <div
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${title}`}
        className="flex items-center justify-between cursor-pointer p-4 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors duration-200"
        role="button"
        tabIndex={0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
        <div className="flex items-center gap-2">
          {isLoading && <Spinner color="primary" size="sm" />}
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
