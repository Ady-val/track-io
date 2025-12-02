import React, { useState } from "react";

import { Module, Action } from "@/constants/permissions";
import {
  useTorretaColors,
  useCreateTorretaColor,
  useUpdateTorretaColor,
  useDeleteTorretaColor,
  type TorretaColor,
} from "@/hooks/useCatalogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useModalError } from "@/hooks/useModalError";

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Modal } from "../Modal";

export function TorretaColorsCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<TorretaColor | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    htmlColor: "#000000",
    deviceColorId: "",
    order: 0,
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    deviceColorId?: string;
    order?: string;
  }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

  const { data: colorsData, isLoading } = useTorretaColors();

  const createColorMutation = useCreateTorretaColor();
  const updateColorMutation = useUpdateTorretaColor();
  const deleteColorMutation = useDeleteTorretaColor();

  const colors = colorsData?.data ?? [];
  const filteredColors = colors.filter((color: { name: string }) =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Array<TableColumn<TorretaColor>> = [
    {
      id: "id",
      label: "ID",
      key: "id",
      width: "80px",
    },
    {
      id: "name",
      label: "Nombre",
      key: "name",
      width: "100%",
    },
    {
      id: "htmlColor",
      label: "Color",
      key: "htmlColor",
      component: (value) => (
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded border border-gray-300 mr-2"
            style={{ backgroundColor: value }}
          />
          <span className="font-mono text-sm">{value}</span>
        </div>
      ),
    },
    {
      id: "deviceColorId",
      label: "ID del Dispositivo",
      key: "deviceColorId",
    },
    {
      id: "order",
      label: "Orden",
      key: "order",
    },
  ];

  const handleCreate = () => {
    setFormData({
      name: "",
      htmlColor: "#000000",
      deviceColorId: "",
      order: 0,
    });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (color: TorretaColor) => {
    setSelectedColor(color);
    setFormData({
      name: color.name,
      htmlColor: color.htmlColor,
      deviceColorId: color.deviceColorId,
      order: color.order,
    });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleDelete = (color: TorretaColor) => {
    setSelectedColor(color);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; deviceColorId?: string; order?: string } =
      {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }
    if (!formData.deviceColorId.trim()) {
      errors.deviceColorId = "El ID del dispositivo es requerido";
    }
    if (formData.order < 0) {
      errors.order = "El orden debe ser mayor o igual a 0";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      errorHandling.setValidationErrors(
        Object.values(errors).filter((err): err is string => !!err)
      );

      return;
    }

    try {
      errorHandling.clearErrors();

      if (isCreateModalOpen) {
        await createColorMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedColor) {
        await updateColorMutation.mutateAsync({
          id: selectedColor.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({
        name: "",
        htmlColor: "#000000",
        deviceColorId: "",
        order: 0,
      });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el color");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedColor) {
      try {
        await deleteColorMutation.mutateAsync(selectedColor.id);
        setIsDeleteModalOpen(false);
        setSelectedColor(null);
      } catch {
        errorHandling.setError("Error al eliminar el color");
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      htmlColor: "#000000",
      deviceColorId: "",
      order: 0,
    });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedColor(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar colores..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            size="lg"
            onClick={handleCreate}
          >
            Crear Color
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filteredColors}
          emptyMessage="No hay colores registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={
          isCreateModalOpen
            ? "Crear Color de Torreta"
            : "Editar Color de Torreta"
        }
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          {errorHandling.validationErrors.length > 0 && (
            <ValidationErrorList errors={errorHandling.validationErrors} />
          )}

          {errorHandling.serverError && (
            <ErrorMessage
              isServerError={errorHandling.parsedError?.isServerError ?? false}
              message={errorHandling.serverError}
              type="server"
            />
          )}

          <FormField
            autoFocus
            required
            error={formErrors.name}
            label="Nombre"
            name="name"
            placeholder="Ingresa el nombre del color"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="color-input"
            >
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                id="color-input"
                type="color"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="#000000"
                type="text"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
              />
            </div>
          </div>

          <FormField
            required
            error={formErrors.deviceColorId}
            label="ID del Dispositivo"
            name="deviceColorId"
            placeholder="Ingresa el ID del dispositivo"
            value={formData.deviceColorId}
            onChange={(value) =>
              setFormData({ ...formData, deviceColorId: value as string })
            }
          />

          <FormField
            required
            error={formErrors.order}
            label="Orden"
            name="order"
            placeholder="0"
            type="number"
            value={formData.order}
            onChange={(value) =>
              setFormData({ ...formData, order: Number(value) })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createColorMutation.isPending || updateColorMutation.isPending
              }
              size="md"
              type="button"
              variant="solid"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              className="px-6 py-2 font-semibold"
              color="primary"
              disabled={
                createColorMutation.isPending || updateColorMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createColorMutation.isPending || updateColorMutation.isPending
                ? "Guardando..."
                : isCreateModalOpen
                  ? "Crear"
                  : "Actualizar"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        isOpen={isDeleteModalOpen}
        loading={deleteColorMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedColor?.name}"?`}
        title="Eliminar Color"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
