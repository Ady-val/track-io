import React from "react";

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "warning",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  critical = false,
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: "⚠️",
          iconColor: "text-red-500",
          buttonColor: "bg-red-600 hover:bg-red-700",
          borderColor: "border-red-500",
        };
      case "warning":
        return {
          icon: "⚠️",
          iconColor: "text-yellow-500",
          buttonColor: "bg-yellow-600 hover:bg-yellow-700",
          borderColor: "border-yellow-500",
        };
      case "info":
        return {
          icon: "ℹ️",
          iconColor: "text-blue-500",
          buttonColor: "bg-blue-600 hover:bg-blue-700",
          borderColor: "border-blue-500",
        };
      default:
        return {
          icon: "❓",
          iconColor: "text-gray-500",
          buttonColor: "bg-gray-600 hover:bg-gray-700",
          borderColor: "border-gray-500",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={`relative bg-slate-900 border-2 ${
          styles.borderColor
        } rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 ${
          critical ? "animate-pulse" : ""
        }`}
      >
        <div className="flex items-center space-x-4 mb-4">
          <div className={`text-4xl ${styles.iconColor}`}>{styles.icon}</div>
          <h3 className="text-xl font-bold text-slate-100">{title}</h3>
        </div>

        <p className="text-slate-300 mb-6 leading-relaxed">{message}</p>

        {critical && (
          <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-3 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-300 text-sm font-medium">
                Acción Crítica - Requiere Confirmación
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 ${styles.buttonColor} text-white rounded-lg transition-colors font-medium`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
