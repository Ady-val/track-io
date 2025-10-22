import React, { useState } from "react";
import {
  useTorretaColors,
  useCreateTorretaColor,
  useUpdateTorretaColor,
  useDeleteTorretaColor,
  TorretaColor,
} from "@/hooks/useCatalogs";
import { DataTable, TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { Modal } from "../Modal";

export function TorretaColorsCatalog() {
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

  const { data: colorsData, isLoading } = useTorretaColors();

  const createColorMutation = useCreateTorretaColor();
  const updateColorMutation = useUpdateTorretaColor();
  const deleteColorMutation = useDeleteTorretaColor();

  const colors = colorsData?.data || [];
  const filteredColors = colors.filter((color) =>
    color.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<TorretaColor>[] = [
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
      return;
    }

    try {
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
      console.error("Error submitting form:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedColor) {
      try {
        await deleteColorMutation.mutateAsync(selectedColor.id);
        setIsDeleteModalOpen(false);
        setSelectedColor(null);
      } catch (error) {
        console.error("Error deleting color:", error);
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
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedColor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Buscar colores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Button
          onClick={handleCreate}
          color="primary"
          size="lg"
          className="ml-4"
        >
          Crear Color
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={filteredColors}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
        emptyMessage="No hay colores registrados"
        maxHeight="max-h-96"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={handleCancel}
        title={
          isCreateModalOpen
            ? "Crear Color de Torreta"
            : "Editar Color de Torreta"
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
            placeholder="Ingresa el nombre del color"
            required
            error={formErrors.name}
          />

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
                placeholder="#000000"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <FormField
            label="ID del Dispositivo"
            name="deviceColorId"
            value={formData.deviceColorId}
            onChange={(value) =>
              setFormData({ ...formData, deviceColorId: value as string })
            }
            placeholder="Ingresa el ID del dispositivo"
            required
            error={formErrors.deviceColorId}
          />

          <FormField
            label="Orden"
            name="order"
            type="number"
            value={formData.order}
            onChange={(value) =>
              setFormData({ ...formData, order: Number(value) })
            }
            placeholder="0"
            required
            error={formErrors.order}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              size="lg"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              color="primary"
              size="lg"
              disabled={
                createColorMutation.isPending || updateColorMutation.isPending
              }
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

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Color"
        message={`¿Estás seguro de querer eliminar "${selectedColor?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteColorMutation.isPending}
      />
    </div>
  );
}
