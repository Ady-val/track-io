import type React from "react";

import { Modal } from "./Modal";
import { CreateDeviceForm } from "./CreateDeviceForm";
import type { CreateDeviceData } from "@/types/device";

export interface CreateDeviceModalProps {
  isOpen: boolean;
  externalId: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeviceData) => void;
}

export const CreateDeviceModal: React.FC<CreateDeviceModalProps> = ({
  isOpen,
  externalId,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Crear Nuevo Dispositivo"
      onClose={onClose}
    >
      <CreateDeviceForm
        externalId={externalId}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
};




