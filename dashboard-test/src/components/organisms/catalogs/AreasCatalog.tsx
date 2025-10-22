import React, { useState } from "react";
import {
  useAreas,
  useCreateArea,
  useUpdateArea,
  useDeleteArea,
  Area,
} from "@/hooks/useCatalogs";
import { DataTable, TableColumn } from "../../molecules/DataTable";
import { Pagination } from "../../molecules/Pagination";
import { FormField } from "../../molecules/FormField";
import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { Modal } from "../Modal";

export function AreasCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: areasData, isLoading } = useAreas({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
  });

  const createAreaMutation = useCreateArea();
  const updateAreaMutation = useUpdateArea();
  const deleteAreaMutation = useDeleteArea();

  const areas = areasData?.data || [];
  const totalItems = areasData?.total || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const columns: TableColumn<Area>[] = [
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
  ];

  const handleCreate = () => {
    setFormData({ name: "" });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormData({ name: area.name });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (area: Area) => {
    setSelectedArea(area);
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
        await createAreaMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedArea) {
        await updateAreaMutation.mutateAsync({
          id: selectedArea.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "" });
      setFormErrors({});
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedArea) {
      try {
        await deleteAreaMutation.mutateAsync(selectedArea.id);
        setIsDeleteModalOpen(false);
        setSelectedArea(null);
      } catch (error) {
        console.error("Error deleting area:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "" });
    setFormErrors({});
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedArea(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            type="text"
            placeholder="Buscar áreas..."
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
          Crear Área
        </Button>
      </div>

      {/* Table */}
      <DataTable
        data={areas}
        columns={columns}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={isLoading}
        emptyMessage="No hay áreas registradas"
        maxHeight="max-h-96"
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={handleCancel}
        title={isCreateModalOpen ? "Crear Área" : "Editar Área"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Nombre"
            name="name"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
            placeholder="Ingresa el nombre del área"
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
                createAreaMutation.isPending || updateAreaMutation.isPending
              }
            >
              {createAreaMutation.isPending || updateAreaMutation.isPending
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
        title="Eliminar Área"
        message={`¿Estás seguro de querer eliminar "${selectedArea?.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        loading={deleteAreaMutation.isPending}
      />
    </div>
  );
}
