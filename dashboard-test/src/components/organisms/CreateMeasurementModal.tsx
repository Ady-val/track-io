import type React from "react";

import { Modal } from "./Modal";
import { CreateMeasurementForm } from "./CreateMeasurementForm";
import type { CreateMeasurementData } from "@/types/measurement";

export interface CreateMeasurementModalProps {
  isOpen: boolean;
  externalId: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateMeasurementData) => void;
}

export const CreateMeasurementModal: React.FC<CreateMeasurementModalProps> = ({
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
      title="Crear Nuevo Dispositivo de Medición"
      onClose={onClose}
    >
      <CreateMeasurementForm
        externalId={externalId}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
};

