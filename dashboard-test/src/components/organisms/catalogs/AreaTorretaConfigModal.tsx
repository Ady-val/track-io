import React, { useState, useEffect } from "react";
import { FaPlus, FaTrash, FaEdit, FaTimes } from "react-icons/fa";
import { type Area } from "@/hooks/useCatalogs";
import { useAreaTorretaConfigs, useCreateAreaTorretaConfig, useUpdateAreaTorretaConfig, useDeleteAreaTorretaConfig } from "@/hooks/useAreaTorretaConfig";
import { useTorretas } from "@/hooks/useCatalogs";
import { Button } from "../../atoms/Button";
import { Text } from "../../atoms/Text";
import { Modal } from "../Modal";
import { FormField } from "../../molecules/FormField";
import { useModalError } from "@/hooks/useModalError";
import type { AreaTorretaConfig } from "@/lib/services/areaTorretaConfig.service";

interface AreaTorretaConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  area: Area | null;
}

export const AreaTorretaConfigModal: React.FC<AreaTorretaConfigModalProps> = ({
  isOpen,
  onClose,
  area,
}) => {
  const [isAddMode, setIsAddMode] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AreaTorretaConfig | null>(null);
  const [formData, setFormData] = useState({
    torretaExternalId: "",
    configurationType: "area" as "area" | "department",
  });
  const [formErrors, setFormErrors] = useState<{
    torretaExternalId?: string;
    configurationType?: string;
  }>({});
  const [localError, setLocalError] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  const errorHandling = useModalError("Error al procesar la solicitud");

  const { data: configs = [], isLoading: configsLoading } = useAreaTorretaConfigs(
    area?.id ?? 0
  );
  const { data: torretasData } = useTorretas({ active: true });
  const torretas = torretasData?.data ?? [];

  const createMutation = useCreateAreaTorretaConfig();
  const updateMutation = useUpdateAreaTorretaConfig();
  const deleteMutation = useDeleteAreaTorretaConfig();

  const availableTorretas = torretas.filter(
    (torreta) =>
      torreta.externalId &&
      (!editingConfig || torreta.externalId === editingConfig.torretaExternalId) &&
      !configs.some(
        (config) =>
          config.torretaExternalId === torreta.externalId &&
          config.id !== editingConfig?.id
      )
  );

  useEffect(() => {
    if (!isOpen) {
      setIsAddMode(false);
      setEditingConfig(null);
      setFormData({ torretaExternalId: "", configurationType: "area" });
      setFormErrors({});
      setLocalError(null);
      setLocalLoading(false);
      errorHandling.clearErrors();
    }
  }, [isOpen]);

  const handleAdd = () => {
    setIsAddMode(true);
    setEditingConfig(null);
    setFormData({ torretaExternalId: "", configurationType: "area" });
    setFormErrors({});
    setLocalError(null);
    errorHandling.clearErrors();
  };

  const handleEdit = (config: AreaTorretaConfig) => {
    setEditingConfig(config);
    setIsAddMode(false);
    setFormData({
      torretaExternalId: config.torretaExternalId,
      configurationType: config.configurationType,
    });
    setFormErrors({});
    setLocalError(null);
    errorHandling.clearErrors();
  };

  const handleCancel = () => {
    setIsAddMode(false);
    setEditingConfig(null);
    setFormData({ torretaExternalId: "", configurationType: "area" });
    setFormErrors({});
    setLocalError(null);
    errorHandling.clearErrors();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { torretaExternalId?: string; configurationType?: string } = {};

    if (!formData.torretaExternalId) {
      errors.torretaExternalId = "La torreta es requerida";
    }

    if (!formData.configurationType) {
      errors.configurationType = "El tipo de configuración es requerido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLocalLoading(true);
      setLocalError(null);
      errorHandling.clearErrors();

      if (isAddMode && area) {
        await createMutation.mutateAsync({
          areaId: area.id,
          torretaExternalId: formData.torretaExternalId,
          configurationType: formData.configurationType,
        });
      } else if (editingConfig && area) {
        await updateMutation.mutateAsync({
          id: editingConfig.id,
          data: {
            configurationType: formData.configurationType,
          },
          areaId: area.id,
        });
      }

      handleCancel();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al guardar la configuración";
      setLocalError(errorMessage);
      errorHandling.handleApiError(error, errorMessage);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDelete = async (config: AreaTorretaConfig) => {
    if (!area) return;

    if (
      window.confirm(
        `¿Estás seguro de eliminar la configuración de la torreta "${config.torretaExternalId}"?`
      )
    ) {
      try {
        setLocalLoading(true);
        setLocalError(null);
        errorHandling.clearErrors();

        await deleteMutation.mutateAsync({
          id: config.id,
          areaId: area.id,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error al eliminar la configuración";
        setLocalError(errorMessage);
        errorHandling.handleApiError(error, errorMessage);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const getTorretaName = (externalId: string) => {
    const torreta = torretas.find((t) => t.externalId === externalId);
    return torreta?.name ?? externalId;
  };

  if (!isOpen || !area) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={`Configurar Torretas - ${area.name}`}
    >
      <div className="space-y-6">
        {localError && (
          <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
            <Text color="danger">Error: {localError}</Text>
          </div>
        )}

        {localLoading && (
          <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
            <Text color="primary">Cargando configuración...</Text>
          </div>
        )}

        {configsLoading && (
          <div className="mb-4 p-4 bg-blue-900/50 border border-blue-700 rounded-lg">
            <Text color="primary">Cargando configuraciones...</Text>
          </div>
        )}

        {/* Lista de configuraciones existentes */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <Text color="primary" variant="h4">
              Configuraciones
            </Text>
            <Button
              color="primary"
              size="sm"
              variant="solid"
              onPress={handleAdd}
              disabled={isAddMode || !!editingConfig}
            >
              <FaPlus className="mr-2" />
              Agregar
            </Button>
          </div>

          {configs.length === 0 && !configsLoading ? (
            <div className="text-center py-8">
              <Text color="muted" variant="body">
                No hay configuraciones. Haz clic en "Agregar" para crear una.
              </Text>
            </div>
          ) : (
            <div className="space-y-2">
              {configs.map((config) => (
                <div
                  key={config.id}
                  className="flex items-center justify-between p-4 bg-slate-700 rounded-lg border border-slate-600"
                >
                  <div className="flex-1">
                    <Text color="primary" variant="body">
                      {getTorretaName(config.torretaExternalId)}
                    </Text>
                    <Text className="mt-1" color="muted" variant="caption">
                      Tipo:{" "}
                      <span className="font-semibold">
                        {config.configurationType === "area"
                          ? "Por Área"
                          : "Por Departamento"}
                      </span>
                    </Text>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      className="flex items-center justify-center w-8 h-8 font-semibold"
                      color="warning"
                      size="sm"
                      title="Editar configuración"
                      variant="solid"
                      onPress={() => handleEdit(config)}
                      disabled={isAddMode || !!editingConfig}
                    >
                      <FaEdit className="w-4 h-4 text-white" />
                    </Button>
                    <Button
                      className="flex items-center justify-center w-8 h-8 font-semibold"
                      color="danger"
                      size="sm"
                      title="Eliminar configuración"
                      variant="solid"
                      onPress={() => handleDelete(config)}
                      disabled={
                        isAddMode ||
                        !!editingConfig ||
                        deleteMutation.isPending
                      }
                    >
                      <FaTrash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario para agregar/editar */}
        {(isAddMode || editingConfig) && (
          <div className="border-t border-slate-600 pt-6">
            <Text className="mb-4" color="primary" variant="h4">
              {isAddMode ? "Agregar Configuración" : "Editar Configuración"}
            </Text>

            {errorHandling.validationErrors.length > 0 && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <ul className="list-disc list-inside text-sm">
                  {errorHandling.validationErrors.map((error, idx) => (
                    <li key={idx}>
                      <Text color="danger">{error}</Text>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {errorHandling.serverError && (
              <div className="mb-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
                <Text color="danger">Error: {errorHandling.serverError}</Text>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                label="Torreta"
                name="torretaExternalId"
                required
                select
                disabled={!!editingConfig}
                value={formData.torretaExternalId}
                onChange={(value) =>
                  setFormData({ ...formData, torretaExternalId: value as string })
                }
                options={availableTorretas
                  .filter((t) => t.externalId)
                  .map((torreta) => ({
                    value: torreta.externalId!,
                    label: `${torreta.name} (${torreta.externalId})`,
                  }))}
                error={formErrors.torretaExternalId}
              />

              <FormField
                label="Tipo de Configuración"
                name="configurationType"
                required
                select
                value={formData.configurationType}
                onChange={(value) =>
                  setFormData({
                    ...formData,
                    configurationType: value as "area" | "department",
                  })
                }
                options={[
                  {
                    value: "area",
                    label: "Por Área (R1/Y1/G1 según estado del área)",
                  },
                  {
                    value: "department",
                    label:
                      "Por Departamento (Color del departamento del evento)",
                  },
                ]}
                error={formErrors.configurationType}
              />

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-600">
                <Button
                  color="default"
                  type="button"
                  variant="solid"
                  onPress={handleCancel}
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                >
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  type="submit"
                  variant="solid"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? "Guardando..."
                    : isAddMode
                      ? "Crear"
                      : "Actualizar"}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Modal>
  );
};

