import React, { useState } from "react";

import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  type Department,
} from "@/hooks/useCatalogs";

import { Button } from "../../atoms/Button";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

export function DepartmentsCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: departmentsData, isLoading } = useDepartments({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
  });

  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();

  const departments = departmentsData?.data ?? [];
  const totalItems = departmentsData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const columns: Array<TableColumn<Department>> = [
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

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({ name: department.name });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
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
        await createDepartmentMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedDepartment) {
        await updateDepartmentMutation.mutateAsync({
          id: selectedDepartment.id,
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
    if (selectedDepartment) {
      try {
        await deleteDepartmentMutation.mutateAsync(selectedDepartment.id);
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
      } catch (error) {
        console.error("Error deleting department:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "" });
    setFormErrors({});
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex-1 max-w-lg">
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar departamentos..."
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
          Crear Departamento
        </Button>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={departments}
        emptyMessage="No hay departamentos registrados"
        loading={isLoading}
        maxHeight="max-h-96"
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Departamento" : "Editar Departamento"}
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            required
            error={formErrors.name}
            label="Nombre"
            name="name"
            placeholder="Ingresa el nombre del departamento"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
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
                createDepartmentMutation.isPending ||
                updateDepartmentMutation.isPending
              }
              size="lg"
              type="submit"
            >
              {createDepartmentMutation.isPending ||
              updateDepartmentMutation.isPending
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
        loading={deleteDepartmentMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedDepartment?.name}"?`}
        title="Eliminar Departamento"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
