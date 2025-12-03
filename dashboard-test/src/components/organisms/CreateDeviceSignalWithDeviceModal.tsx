import type React from "react";

import { Modal } from "./Modal";
import { CreateDeviceSignalWithDeviceForm } from "./CreateDeviceSignalWithDeviceForm";
import type { Device } from "@/types/device";
import type { CreateDeviceSignalData } from "@/types/device-signal";

export interface CreateDeviceSignalWithDeviceModalProps {
  isOpen: boolean;
  device: Device;
  externalValueId: string;
  usedDepartments?: number[];
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateDeviceSignalData) => void;
}

export const CreateDeviceSignalWithDeviceModal: React.FC<
  CreateDeviceSignalWithDeviceModalProps
> = ({
  isOpen,
  device,
  externalValueId,
  usedDepartments = [],
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Crear Señal para Dispositivo Existente"
      onClose={onClose}
    >
      <CreateDeviceSignalWithDeviceForm
        device={device}
        externalValueId={externalValueId}
        usedDepartments={usedDepartments}
        isLoading={isLoading}
        onCancel={onClose}
        onSubmit={onSubmit}
      />
    </Modal>
  );
};

