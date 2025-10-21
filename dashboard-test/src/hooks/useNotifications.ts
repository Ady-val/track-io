import { useState, useCallback } from "react";

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification = { ...notification, id };

      setNotifications((prev) => [...prev, newNotification]);

      return id;
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    );
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: "success", title, message });
    },
    [addNotification]
  );

  const showError = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: "error", title, message });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: "warning", title, message });
    },
    [addNotification]
  );

  const showInfo = useCallback(
    (title: string, message?: string) => {
      return addNotification({ type: "info", title, message });
    },
    [addNotification]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
