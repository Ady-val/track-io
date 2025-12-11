import type React from "react";

import { Modal } from "./Modal";
import { CreateDeviceAndSignalForm } from "./CreateDeviceAndSignalForm";
import type { CreateDeviceData } from "@/types/device";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceAndSignalModalProps {
  isOpen: boolean;
  externalId: string;
  externalValueId: string;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (
    deviceData: CreateDeviceData,
    signalData: Omit<CreateDeviceSignalData, "deviceId">
  ) => void;
}

export const CreateDeviceAndSignalModal: React.FC<
  CreateDeviceAndSignalModalProps
> = ({
  isOpen,
  externalId,
  externalValueId,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      size="lg"
      title="Crear Dispositivo y Señal"
      onClose={onClose}
    >
      <CreateDeviceAndSignalForm
        externalId={externalId}
        externalValueId={externalValueId}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
};







