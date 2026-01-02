import type React from "react";
import { useEffect } from "react";

import { FaXmark } from "react-icons/fa6";

import { Card, CardBody, Text } from "@components/atoms";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string | React.ReactNode;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  hideHeader?: boolean;
  footer?: React.ReactNode;
  "data-cy"?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  hideHeader = false,
  footer,
  "data-cy": dataCy,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md", // 448px
    md: "max-w-lg", // 512px
    lg: "max-w-2xl", // 672px
    xl: "max-w-4xl", // 896px
    "2xl": "max-w-[38rem]", // 608px - Golden ratio optimized
    "3xl": "max-w-5xl", // 1024px
  };

  const handleBackdropKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-label="Close modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        role="button"
        tabIndex={0}
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200`}
        data-cy={dataCy || "modal"}
        role="dialog"
      >
        <Card className="bg-slate-800 border-slate-600 shadow-2xl flex flex-col h-full max-h-[85vh]">
          <CardBody className="p-0 flex flex-col h-full overflow-hidden">
            {/* Header - Fijo */}
            {!hideHeader && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 flex-shrink-0">
                {typeof title === "string" ? (
                  <Text className="text-lg font-medium" variant="h4">
                    {title}
                  </Text>
                ) : (
                  title
                )}
                <button
                  className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-700/50 rounded"
                  data-cy="close-modal"
                  onClick={onClose}
                >
                  <FaXmark className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Content - Scrollable */}
            <div
              className={`${hideHeader ? "p-6" : "p-6"} ${footer ? "pb-0" : ""} flex flex-col flex-1 min-h-0 overflow-y-auto overflow-x-hidden`}
            >
              {children}
            </div>

            {/* Footer - Fijo */}
            {footer && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex-shrink-0">
                {footer}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
