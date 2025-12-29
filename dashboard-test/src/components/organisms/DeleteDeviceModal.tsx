import type { Device } from "../../types/device";

import React, { useState } from "react";

import { FaExclamationTriangle, FaTrash } from "react-icons/fa";

import deviceService from "../../lib/services/device.service";
import { Button } from "../atoms/Button";

import { Modal } from "./Modal";

interface DeleteDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: Device | null;
}

export const DeleteDeviceModal: React.FC<DeleteDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!device) return;

    setIsLoading(true);
    try {
      await deviceService.delete(device.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Eliminar Dispositivo"
      onClose={onClose}
      data-cy="delete-device-modal"
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-full">
            <FaExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">
              ¿Eliminar Dispositivo?
            </h3>
            <p className="text-slate-400">
              Esta acción eliminará el dispositivo y todas sus señales
              asociadas.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Dispositivo a eliminar:
          </h4>
          <div className="space-y-1">
            <p className="text-slate-300">
              <span className="font-medium">Nombre:</span> {device.name}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">External ID:</span>{" "}
              {device.externalId}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">Área:</span> {device.areaName}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">Señales:</span>{" "}
              {device.deviceSignals?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FaExclamationTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-200">
                Advertencia
              </h4>
              <p className="text-sm text-yellow-300 mt-1">
                Esta acción no se puede deshacer. El dispositivo y todas sus
                señales serán eliminados permanentemente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
            data-cy="delete-device-cancel-button"
            disabled={isLoading}
            size="md"
            type="button"
            variant="solid"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex items-center space-x-2 px-6 py-2 font-semibold"
            color="danger"
            data-cy="delete-device-confirm-button"
            disabled={isLoading}
            size="md"
            type="button"
            variant="solid"
            onPress={handleDelete}
          >
            <FaTrash className="w-4 h-4" />
            <span>{isLoading ? "Eliminando..." : "Eliminar Dispositivo"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
