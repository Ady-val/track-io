import { useCallback, useContext } from "react";

import { ToastContext } from "@/components/providers/ToastProvider";
import { useNotifications } from "./useNotifications";

/**
 * Hook simplificado para mostrar notificaciones toast
 * Usa ToastProvider global si está disponible, sino usa useNotifications local
 */
export function useToast() {
  // Intentar obtener el contexto (puede ser undefined si no hay provider)
  const toastContext = useContext(ToastContext);
  const localNotifications = useNotifications();

  const showToast = useCallback(
    (
      type: "success" | "error" | "warning" | "info",
      message: string,
      title?: string
    ) => {
      if (toastContext) {
        // Usar sistema global
        toastContext.showToast({
          type,
          message,
          title: title || getDefaultTitle(type),
          duration: 5000,
        });
      } else {
        // Usar sistema local como fallback
        switch (type) {
          case "success":
            localNotifications.showSuccess(title || "Éxito", message);
            break;
          case "error":
            localNotifications.showError(title || "Error", message);
            break;
          case "warning":
            localNotifications.showWarning(title || "Advertencia", message);
            break;
          case "info":
            localNotifications.showInfo(title || "Información", message);
            break;
        }
      }
    },
    [toastContext, localNotifications]
  );

  return {
    /**
     * Muestra una notificación de éxito
     */
    success: useCallback(
      (message: string, title?: string) => {
        showToast("success", message, title);
      },
      [showToast]
    ),

    /**
     * Muestra una notificación de error
     */
    error: useCallback(
      (message: string, title?: string) => {
        showToast("error", message, title);
      },
      [showToast]
    ),

    /**
     * Muestra una notificación de advertencia
     */
    warning: useCallback(
      (message: string, title?: string) => {
        showToast("warning", message, title);
      },
      [showToast]
    ),

    /**
     * Muestra una notificación informativa
     */
    info: useCallback(
      (message: string, title?: string) => {
        showToast("info", message, title);
      },
      [showToast]
    ),
  };
}

function getDefaultTitle(
  type: "success" | "error" | "warning" | "info"
): string {
  switch (type) {
    case "success":
      return "Éxito";
    case "error":
      return "Error";
    case "warning":
      return "Advertencia";
    case "info":
      return "Información";
  }
}
