import type React from "react";
import { useState } from "react";

import { FaFloppyDisk, FaXmark } from "react-icons/fa6";

import { Button } from "@components/atoms";

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
  const [isValid, setIsValid] = useState(false);

  const handleSubmit = () => {
    const form = document.getElementById(
      "create-device-and-signal-form"
    ) as HTMLFormElement;

    if (form) {
      form.requestSubmit();
    }
  };

  return (
    <Modal
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button
            color="default"
            disabled={isLoading}
            size="md"
            variant="solid"
            onClick={onClose}
          >
            <FaXmark className="mr-2" />
            Cancelar
          </Button>
          <Button
            color="primary"
            disabled={isLoading || !isValid}
            isLoading={isLoading}
            size="md"
            variant="solid"
            onClick={handleSubmit}
          >
            <FaFloppyDisk className="mr-2" />
            Crear Dispositivo y Señal
          </Button>
        </div>
      }
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
        onValidationChange={setIsValid}
      />
    </Modal>
  );
};
