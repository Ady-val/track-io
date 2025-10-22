import React, { useState } from "react";
import {
  useTorretas,
  useCreateTorreta,
  useUpdateTorreta,
  useDeleteTorreta,
  Torreta,
} from "@/hooks/useCatalogs";
import { DataTable, TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
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

  const torretas = torretasData?.data || [];
  const filteredTorretas = torretas.filter((torreta) =>
    torreta.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<Torreta>[] = [
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
      component: (value) => value || "-",
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
    setFormData({ name: torreta.name, description: torreta.description || "" });
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
            type="text"
            placeholder="Buscar torretas..."
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
          Crear Torreta
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={filteredTorretas}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
        emptyMessage="No hay torretas registradas"
        maxHeight="max-h-96"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={handleCancel}
        title={isCreateModalOpen ? "Crear Torreta" : "Editar Torreta"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
            placeholder="Ingresa el nombre de la torreta"
            required
            error={formErrors.name}
          />

          <FormField
            label="Descripción"
            name="description"
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value as string })
            }
            placeholder="Ingresa la descripción de la torreta (opcional)"
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
                createTorretaMutation.isPending ||
                updateTorretaMutation.isPending
              }
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
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Torreta"
        message={`¿Estás seguro de querer eliminar "${selectedTorreta?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteTorretaMutation.isPending}
      />
    </div>
  );
}
