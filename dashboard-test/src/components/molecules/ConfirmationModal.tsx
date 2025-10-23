import { Button } from "../atoms/Button";
import { Icon } from "../atoms/Icon";
import { Modal } from "../organisms/Modal";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  loading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "danger",
  loading = false,
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: "alert-triangle",
          iconColor: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
      case "warning":
        return {
          icon: "alert-circle",
          iconColor: "text-yellow-600",
          confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
        };
      case "info":
        return {
          icon: "info",
          iconColor: "text-blue-600",
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
        };
      default:
        return {
          icon: "alert-triangle",
          iconColor: "text-red-600",
          confirmButton: "bg-red-600 hover:bg-red-700 text-white",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal isOpen={isOpen} size="sm" title={title} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center mb-4">
          <div className={`flex-shrink-0 ${styles.iconColor}`}>
            <Icon className="w-6 h-6" name={styles.icon} />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">{message}</p>
        </div>

        <div className="flex justify-end space-x-3">
          <Button disabled={loading} variant="bordered" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            className={styles.confirmButton}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Procesando...
              </div>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
