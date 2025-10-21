import React from "react";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from "react-icons/fa";

interface NotificationToastProps {
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  onClose: () => void;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  type,
  title,
  message,
  onClose,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500" />;
      case "error":
        return <FaExclamationTriangle className="text-red-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "info":
        return <FaInfoCircle className="text-blue-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case "success":
        return "bg-green-900/90 border-green-700";
      case "error":
        return "bg-red-900/90 border-red-700";
      case "warning":
        return "bg-yellow-900/90 border-yellow-700";
      case "info":
        return "bg-blue-900/90 border-blue-700";
      default:
        return "bg-gray-900/90 border-gray-700";
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg border ${getBackgroundColor()} min-w-80 max-w-96 shadow-lg`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white mb-1">{title}</h4>
          {message && <p className="text-xs text-gray-300">{message}</p>}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <FaTimes className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

