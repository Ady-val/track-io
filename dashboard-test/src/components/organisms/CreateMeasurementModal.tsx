import type React from "react";

import type { CreateMeasurementData } from "@/types/measurement";

import { CreateMeasurementForm } from "./CreateMeasurementForm";
import { Modal } from "./Modal";

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
