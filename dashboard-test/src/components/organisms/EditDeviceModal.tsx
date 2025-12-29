import type { Device, UpdateDeviceData } from "../../types/device";

import React, { useState, useEffect } from "react";

import { FaMicrochip, FaDesktop } from "react-icons/fa";

import deviceService from "../../lib/services/device.service";
import { Button } from "../atoms/Button";
import { Checkbox } from "../atoms/Checkbox";
import { Input } from "../atoms/Input";

import { Modal } from "./Modal";

interface EditDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: Device | null;
}

export const EditDeviceModal: React.FC<EditDeviceModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const [name, setName] = useState("");
  const [externalId, setExternalId] = useState("");
  const [isVirtualDevice, setIsVirtualDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (device && isOpen) {
      setName(device.name);
      setExternalId(device.externalId);
      setIsVirtualDevice(device.isVirtualDevice);
    }
  }, [device, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !name || !externalId) return;

    setIsLoading(true);
    try {
      const deviceData: UpdateDeviceData = {
        name,
        externalId,
        isVirtualDevice,
      };

      await deviceService.update(device.id, deviceData);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating device:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Editar Dispositivo"
      onClose={onClose}
      data-cy="edit-device-modal"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex items-center space-x-2 mb-4">
          <FaMicrochip className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-200">
            Información del Dispositivo
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="edit-device-name"
            >
              Nombre del Dispositivo
            </label>
            <Input
              autoFocus
              required
              id="edit-device-name"
              placeholder="Ej: Controlador Principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="edit-device-external-id"
            >
              External ID
            </label>
            <Input
              required
              id="edit-device-external-id"
              placeholder="Ej: CTR-1433"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="edit-device-area"
            >
              Área (No editable)
            </label>
            <Input
              disabled
              className="bg-slate-700 text-slate-400"
              id="edit-device-area"
              value={device.areaName}
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <FaDesktop className="text-purple-400 text-sm" />
              <span className="text-sm font-medium text-slate-300">
                Tipo de Dispositivo
              </span>
            </div>
            <Checkbox
              color="primary"
              isSelected={isVirtualDevice}
              size="md"
              onValueChange={setIsVirtualDevice}
            >
              <span className="text-sm text-slate-400">
                Dispositivo Virtual (para computadora)
              </span>
            </Checkbox>
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
            className="px-6 py-2 font-semibold"
            color="primary"
            disabled={isLoading || !name || !externalId}
            size="md"
            type="submit"
            variant="solid"
          >
            {isLoading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
