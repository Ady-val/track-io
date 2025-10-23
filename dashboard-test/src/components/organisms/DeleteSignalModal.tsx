import type { Device } from "../../types/device";

import React, { useState } from "react";

import { FaExclamationTriangle, FaTrash } from "react-icons/fa";

import deviceSignalService from "../../lib/services/device-signal.service";
import { Button } from "../atoms/Button";

import { Modal } from "./Modal";

interface DeleteSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  signal: any;
  device: Device | null;
}

export const DeleteSignalModal: React.FC<DeleteSignalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  signal,
  device,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!signal) return;

    setIsLoading(true);
    try {
      await deviceSignalService.delete(signal.id);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error deleting signal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!signal || !device) return null;

  return (
    <Modal isOpen={isOpen} size="md" title="Eliminar Señal" onClose={onClose}>
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-full">
            <FaExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">
              ¿Eliminar Señal?
            </h3>
            <p className="text-slate-400">
              Esta acción eliminará la señal del dispositivo.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Señal a eliminar:
          </h4>
          <div className="space-y-1">
            <p className="text-slate-300">
              <span className="font-medium">Nombre:</span> {signal.name}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">External Value ID:</span>{" "}
              {signal.externalValueId}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">Departamento:</span>{" "}
              {signal.departmentName}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">Dispositivo:</span> {device.name}
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
                Esta acción no se puede deshacer. La señal será eliminada
                permanentemente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
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
            disabled={isLoading}
            size="md"
            type="button"
            variant="solid"
            onPress={handleDelete}
          >
            <FaTrash className="w-4 h-4" />
            <span>{isLoading ? "Eliminando..." : "Eliminar Señal"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
