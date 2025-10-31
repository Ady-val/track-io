import type { Device } from "../../types/device";

import React, { useState, useEffect } from "react";

import { FaMicrochip } from "react-icons/fa";

import { useDepartments } from "../../hooks/useCatalogs";
import deviceSignalService from "../../lib/services/device-signal.service";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";

import { Modal } from "./Modal";

interface AddSignalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  device: Device | null;
}

export const AddSignalModal: React.FC<AddSignalModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  device,
}) => {
  const [name, setName] = useState("");
  const [externalValueId, setExternalValueId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { data: departmentsData } = useDepartments();
  const departments = departmentsData?.data ?? [];

  useEffect(() => {
    if (isOpen) {
      setName("");
      setExternalValueId("");
      setDepartmentId(departments[0]?.id?.toString() ?? "");
    }
  }, [isOpen, departments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!device || !name || !externalValueId || !departmentId) return;

    setIsLoading(true);
    try {
      await deviceSignalService.create({
        name,
        deviceId: device.id,
        departmentId: Number(departmentId),
        externalValueId,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error creating signal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!device) return null;

  return (
    <Modal
      isOpen={isOpen}
      size="md"
      title="Agregar Señal al Dispositivo"
      onClose={onClose}
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="flex items-center space-x-2 mb-4">
          <FaMicrochip className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-semibold text-slate-200">
            Nueva Señal para {device.name}
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="signal-name"
            >
              Nombre del Botón
            </label>
            <Input
              autoFocus
              required
              id="signal-name"
              placeholder="Ej: Botón 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="signal-external-value"
            >
              External Value ID
            </label>
            <Input
              required
              id="signal-external-value"
              placeholder="Ej: 432"
              value={externalValueId}
              onChange={(e) => setExternalValueId(e.target.value)}
            />
          </div>

          <div>
            <label
              className="block text-sm font-medium text-slate-300 mb-2"
              htmlFor="signal-department"
            >
              Departamento
            </label>
            <Select
              required
              id="signal-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Seleccionar departamento</option>
              {departments.map((dept: { id: number; name: string }) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </Select>
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
            disabled={isLoading || !name || !externalValueId || !departmentId}
            size="md"
            type="submit"
            variant="solid"
          >
            {isLoading ? "Creando..." : "Crear Señal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
