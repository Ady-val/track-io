import type React from "react";

import { Modal } from "./Modal";
import { CreateDeviceSignalForm } from "./CreateDeviceSignalForm";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceSignalModalProps {
  isOpen: boolean;
  deviceId: number;
  deviceName: string;
  externalValueId: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeviceSignalData) => void;
}

export const CreateDeviceSignalModal: React.FC<
  CreateDeviceSignalModalProps
> = ({
  isOpen,
  deviceId,
  deviceName,
  externalValueId,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Crear Nueva Señal del Dispositivo"
      onClose={onClose}
    >
      <CreateDeviceSignalForm
        deviceId={deviceId}
        deviceName={deviceName}
        externalValueId={externalValueId}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
};







