import type React from "react";

import type { CreateDeviceData } from "@/types/device";
import type { CreateDeviceSignalData } from "@/types/device-signal";

import { CreateDeviceAndSignalForm } from "./CreateDeviceAndSignalForm";
import { Modal } from "./Modal";

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
