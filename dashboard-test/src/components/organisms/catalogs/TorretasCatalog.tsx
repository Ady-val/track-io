import React, { useState } from "react";

import {
  useTorretas,
  useCreateTorreta,
  useUpdateTorreta,
  useDeleteTorreta,
  type Torreta,
} from "@/hooks/useCatalogs";

import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Modal } from "../Modal";

export function TorretasCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTorreta, setSelectedTorreta] = useState<Torreta | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const { data: torretasData, isLoading } = useTorretas({
    active: undefined,
  });

  const createTorretaMutation = useCreateTorreta();
  const updateTorretaMutation = useUpdateTorreta();
  const deleteTorretaMutation = useDeleteTorreta();

  const torretas = torretasData?.data ?? [];
  const filteredTorretas = torretas.filter((torreta: { name: string }) =>
    torreta.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: Array<TableColumn<Torreta>> = [
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
      id: "description",
      label: "Descripción",
      key: "description",
      component: (value) => value ?? "-",
    },
    {
      id: "isActive",
      label: "Estado",
      key: "isActive",
      component: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    setFormData({ name: "", description: "" });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
    setFormData({ name: torreta.name, description: torreta.description ?? "" });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (torreta: Torreta) => {
    setSelectedTorreta(torreta);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string } = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);

      return;
    }

    try {
      if (isCreateModalOpen) {
        await createTorretaMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedTorreta) {
        await updateTorretaMutation.mutateAsync({
          id: selectedTorreta.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "", description: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedTorreta) {
      try {
        await deleteTorretaMutation.mutateAsync(selectedTorreta.id);
        setIsDeleteModalOpen(false);
        setSelectedTorreta(null);
      } catch (error) {
        console.error("Error deleting torreta:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setFormErrors({});
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedTorreta(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar torretas..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="ml-4"
          color="primary"
          size="lg"
          onClick={handleCreate}
        >
          Crear Torreta
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTorretas}
        emptyMessage="No hay torretas registradas"
        loading={isLoading}
        maxHeight="max-h-96"
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Torreta" : "Editar Torreta"}
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            required
            error={formErrors.name}
            label="Nombre"
            name="name"
            placeholder="Ingresa el nombre de la torreta"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            label="Descripción"
            name="description"
            placeholder="Ingresa la descripción de la torreta (opcional)"
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value as string })
            }
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              size="lg"
              type="button"
              variant="bordered"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              color="primary"
              disabled={
                createTorretaMutation.isPending ||
                updateTorretaMutation.isPending
              }
              size="lg"
              type="submit"
            >
              {createTorretaMutation.isPending ||
              updateTorretaMutation.isPending
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
        cancelText="Cancelar"
        confirmText="Eliminar"
        isOpen={isDeleteModalOpen}
        loading={deleteTorretaMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedTorreta?.name}"?`}
        title="Eliminar Torreta"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
