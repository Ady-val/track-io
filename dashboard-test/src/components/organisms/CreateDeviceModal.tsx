import type React from "react";

import type { CreateDeviceData } from "@/types/device";

import { CreateDeviceForm } from "./CreateDeviceForm";
import { Modal } from "./Modal";

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

