import type { DeviceSignal } from "../../types";

import React, { useState } from "react";

import { Modal } from "../atoms/Modal";
import { Select } from "../atoms/Select";
import { Textarea } from "../atoms/Textarea";
import { Button } from "../atoms/Button";
import { Text } from "../atoms/Text";

interface SignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, comment: string) => void;
  deviceSignal: DeviceSignal | null;
  isLoading?: boolean;
  requireReason?: boolean;
}

const REASONS = [
  { value: "falta de material", label: "Falta de Material" },
  { value: "cambio de pieza", label: "Cambio de Pieza" },
  { value: "ingenieria", label: "Ingeniería" },
  { value: "calidad", label: "Calidad" },
];

export const SignalModal: React.FC<SignalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  deviceSignal,
  isLoading = false,
  requireReason = true,
}) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (requireReason && !selectedReason) {
      setError("Debes seleccionar un motivo");

      return;
    }

    setError("");
    onConfirm(selectedReason || "", comment);
  };

  const handleClose = () => {
    setSelectedReason("");
    setComment("");
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={requireReason ? "Enviar Señal" : "Comentario"}
      onClose={handleClose}
    >
      <div className="space-y-4">
        {deviceSignal && requireReason && (
          <div>
            <Text className="text-gray-700" variant="body">
              Departamento: <strong>{deviceSignal.departmentName}</strong>
            </Text>
          </div>
        )}

        {requireReason && (
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="reason-select"
            >
              Motivo *
            </label>
            <Select
              fullWidth
              id="reason-select"
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
            >
              <option disabled value="">
                Selecciona un motivo
              </option>
              {REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <Textarea
            label={requireReason ? "Comentario (Opcional)" : "Comentario"}
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-300 rounded-md">
            <Text color="danger" variant="small">
              {error}
            </Text>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button color="default" isDisabled={isLoading} onPress={handleClose}>
            Cancelar
          </Button>
          <Button color="primary" isLoading={isLoading} onPress={handleConfirm}>
            Aceptar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
