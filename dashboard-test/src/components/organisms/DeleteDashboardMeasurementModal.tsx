import type React from "react";
import { useState } from "react";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";

import { Button } from "../atoms/Button";
import { Modal } from "./Modal";
import type { DashboardMeasurement } from "@/types/dashboard";

export interface DeleteDashboardMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: number) => Promise<void>;
  dashboard: DashboardMeasurement | null;
}

export const DeleteDashboardMeasurementModal: React.FC<
  DeleteDashboardMeasurementModalProps
> = ({ isOpen, onClose, onConfirm, dashboard }) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!dashboard) return null;

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onConfirm(dashboard.id);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Eliminar Dashboard Measurement"
      onClose={onClose}
    >
      <div className="space-y-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-12 h-12 bg-red-600/20 rounded-full">
            <FaExclamationTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200">
              ¿Eliminar Dashboard Measurement?
            </h3>
            <p className="text-slate-400">
              Esta acción eliminará el dashboard measurement y el measurement
              asociado. No se puede deshacer.
            </p>
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
          <h4 className="text-sm font-medium text-slate-200 mb-2">
            Elemento a eliminar:
          </h4>
          <div className="space-y-1">
            <p className="text-slate-300">
              <span className="font-medium">Nombre:</span>{" "}
              {dashboard.measurement.name}
            </p>
            <p className="text-slate-300">
              <span className="font-medium">External ID:</span>{" "}
              {dashboard.measurement.externalId}
            </p>
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
            isLoading={isLoading}
            size="md"
            type="button"
            variant="solid"
            onPress={handleDelete}
          >
            <FaTrash className="w-4 h-4" />
            <span>{isLoading ? "Eliminando..." : "Eliminar"}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};

