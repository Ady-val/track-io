import React, { useState } from "react";
import {
  useReceptors,
  useCreateReceptor,
  useUpdateReceptor,
  useDeleteReceptor,
  Receptor,
} from "@/hooks/useCatalogs";
import { DataTable, TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { Modal } from "../Modal";

export function ReceptorsCatalog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReceptor, setSelectedReceptor] = useState<Receptor | null>(
    null
  );
  const [formData, setFormData] = useState({ externalId: "", name: "" });
  const [formErrors, setFormErrors] = useState<{
    externalId?: string;
    name?: string;
  }>({});

  const { data: receptorsData, isLoading } = useReceptors({
    active: undefined,
  });

  const createReceptorMutation = useCreateReceptor();
  const updateReceptorMutation = useUpdateReceptor();
  const deleteReceptorMutation = useDeleteReceptor();

  const receptors = receptorsData?.data || [];
  const filteredReceptors = receptors.filter(
    (receptor) =>
      receptor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receptor.externalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: TableColumn<Receptor>[] = [
    {
      id: "id",
      label: "ID",
      key: "id",
      width: "80px",
    },
    {
      id: "externalId",
      label: "ID Externo",
      key: "externalId",
    },
    {
      id: "name",
      label: "Nombre",
      key: "name",
      width: "100%",
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
    setFormData({ externalId: "", name: "" });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    setFormData({ externalId: receptor.externalId, name: receptor.name });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (receptor: Receptor) => {
    setSelectedReceptor(receptor);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { externalId?: string; name?: string } = {};
    if (!formData.externalId.trim()) {
      errors.externalId = "El ID externo es requerido";
    }
    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (isCreateModalOpen) {
        await createReceptorMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedReceptor) {
        await updateReceptorMutation.mutateAsync({
          id: selectedReceptor.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ externalId: "", name: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedReceptor) {
      try {
        await deleteReceptorMutation.mutateAsync(selectedReceptor.id);
        setIsDeleteModalOpen(false);
        setSelectedReceptor(null);
      } catch (error) {
        console.error("Error deleting receptor:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ externalId: "", name: "" });
    setFormErrors({});
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedReceptor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Buscar receptores..."
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
          Crear Receptor
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={filteredReceptors}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
        emptyMessage="No hay receptores registrados"
        maxHeight="max-h-96"
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={handleCancel}
        title={isCreateModalOpen ? "Crear Receptor" : "Editar Receptor"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="ID Externo"
            name="externalId"
            value={formData.externalId}
            onChange={(value) =>
              setFormData({ ...formData, externalId: value as string })
            }
            placeholder="Ingresa el ID externo del receptor"
            required
            error={formErrors.externalId}
          />

          <FormField
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
            placeholder="Ingresa el nombre del receptor"
            required
            error={formErrors.name}
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
                createReceptorMutation.isPending ||
                updateReceptorMutation.isPending
              }
            >
              {createReceptorMutation.isPending ||
              updateReceptorMutation.isPending
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
        title="Eliminar Receptor"
        message={`¿Estás seguro de querer eliminar "${selectedReceptor?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteReceptorMutation.isPending}
      />
    </div>
  );
}
