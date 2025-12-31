import React, { useState } from "react";

import { Module, Action } from "@/constants/permissions";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  type Department,
} from "@/hooks/useCatalogs";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useModalError } from "@/hooks/useModalError";

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

export function DepartmentsCatalog() {
  const hasCreate = useHasPermission(Module.CATALOGS, Action.CREATE);
  const hasUpdate = useHasPermission(Module.CATALOGS, Action.UPDATE);
  const hasDelete = useHasPermission(Module.CATALOGS, Action.DELETE);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [formData, setFormData] = useState({ name: "", htmlColor: "#ffffff" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

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
    },
    {
      id: "htmlColor",
      label: "Color",
      key: "htmlColor",
      component: (value) => {
        const colorValue = (value as string | undefined) || "#ffffff";

        return (
          <div className="flex items-center">
            <div
              className="w-6 h-6 rounded border border-gray-300 mr-2"
              style={{ backgroundColor: colorValue }}
            />
            <span className="font-mono text-sm">{colorValue}</span>
          </div>
        );
      },
    },
  ];

  const handleCreate = () => {
    setFormData({ name: "", htmlColor: "#ffffff" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      name: department.name,
      htmlColor: department.htmlColor || "#ffffff",
    });
    setFormErrors({});
    errorHandling.clearErrors();
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
      errorHandling.setValidationErrors(
        Object.values(errors).filter((err): err is string => !!err)
      );

      return;
    }

    try {
      errorHandling.clearErrors();

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

      setFormData({ name: "", htmlColor: "#ffffff" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el departamento");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedDepartment) {
      try {
        await deleteDepartmentMutation.mutateAsync(selectedDepartment.id);
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
      } catch (error) {
        errorHandling.setServerError("Error al eliminar el departamento");
        errorHandling.handleApiError(error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", htmlColor: "#ffffff" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar departamentos..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-department-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Departamento
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={departments}
          data-cy="departments-table"
          emptyMessage="No hay departamentos registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      {totalPages > 1 && (
        <div className="flex-shrink-0 mt-4">
          <Pagination
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <Modal
        data-cy={
          isCreateModalOpen
            ? "create-department-modal"
            : "edit-department-modal"
        }
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Departamento" : "Editar Departamento"}
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
            placeholder="Ingresa el nombre del departamento"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <div className="space-y-2">
            <label
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              htmlFor="color-input"
            >
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-slate-800"
                id="color-input"
                type="color"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
              />
              <input
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="#ffffff"
                type="text"
                value={formData.htmlColor}
                onChange={(e) =>
                  setFormData({ ...formData, htmlColor: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createDepartmentMutation.isPending ||
                updateDepartmentMutation.isPending
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
                createDepartmentMutation.isPending ||
                updateDepartmentMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
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

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        data-cy="delete-department-confirmation-modal"
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
