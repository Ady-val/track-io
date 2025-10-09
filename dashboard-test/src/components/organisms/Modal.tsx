import type React from "react";
import { useEffect } from "react";

import { Button, Card, CardBody, Text } from "@components/atoms";
import { FaTimes } from "react-icons/fa";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
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
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full ${sizeClasses[size]} animate-in fade-in zoom-in-95 duration-200`}
      >
        <Card className="bg-slate-800 border-slate-600 shadow-2xl">
          <CardBody className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-600">
              <Text variant="h3">{title}</Text>
              <Button
                color="default"
                isIconOnly
                size="sm"
                variant="light"
                onClick={onClose}
              >
                <FaTimes />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4">{children}</div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
