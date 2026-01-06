import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  type Department,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from "@/lib/validations/schemas";

import { Button, ErrorMessage, Input, ValidationErrorList } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
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

  // Form para crear
  const createForm = useFormValidation({
    schema: createDepartmentSchema,
    defaultValues: {
      name: "",
      htmlColor: undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Departamento creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateDepartmentSchema,
    defaultValues: {
      name: selectedDepartment?.name ?? "",
      htmlColor: selectedDepartment?.htmlColor,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Departamento actualizado exitosamente",
  });

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
    createForm.resetForm({ name: "", htmlColor: undefined });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    editForm.resetForm({
      name: department.name,
      htmlColor: department.htmlColor,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createDepartmentMutation.mutateAsync(data);
      createForm.toast.success("Departamento creado exitosamente");
      createForm.resetForm({ name: "", htmlColor: undefined });
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedDepartment) return;

    try {
      editForm.clearAllErrors();
      const updateData = {
        name: data.name ?? selectedDepartment.name,
        htmlColor: data.htmlColor ?? selectedDepartment.htmlColor,
      };

      await updateDepartmentMutation.mutateAsync({
        id: selectedDepartment.id,
        data: updateData,
      });
      editForm.toast.success("Departamento actualizado exitosamente");
      editForm.resetForm(updateData);
      setIsEditModalOpen(false);
      setSelectedDepartment(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedDepartment) {
      try {
        await deleteDepartmentMutation.mutateAsync(selectedDepartment.id);
        setIsDeleteModalOpen(false);
        setSelectedDepartment(null);
      } catch {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm({ name: "", htmlColor: undefined });
    if (selectedDepartment?.name) {
      editForm.resetForm({
        name: selectedDepartment.name,
        htmlColor: selectedDepartment.htmlColor,
      });
    }
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedDepartment(null);
  };

  const isCreateLoading = createDepartmentMutation.isPending;
  const isEditLoading = updateDepartmentMutation.isPending;

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

      {/* Modal de Crear */}
      <Modal
        data-cy="create-department-modal"
        isOpen={isCreateModalOpen}
        title="Crear Departamento"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          {createForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={createForm.modalError.validationErrors}
            />
          )}

          {createForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                createForm.modalError.parsedError?.isServerError ?? false
              }
              message={createForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={createForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del departamento"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={createForm.form.control}
              name="htmlColor"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="color-input-create"
                  >
                    Color (Hex)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-slate-800"
                      id="color-input-create"
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input
                      {...field}
                      fullWidth
                      errorMessage={fieldState.error?.message}
                      id="create-department-color-input"
                      isInvalid={!!fieldState.error}
                      placeholder="#FF0000"
                      size="md"
                      type="text"
                      value={field.value || ""}
                      variant="bordered"
                    />
                  </div>
                  {field.value && (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-slate-600"
                        style={{ backgroundColor: field.value }}
                      />
                      <span className="text-sm text-slate-400">
                        Vista previa del color
                      </span>
                    </div>
                  )}
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="htmlColor"
                  />
                </>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isCreateLoading}
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
                isCreateLoading || createForm.form.formState.isSubmitting
              }
              isLoading={isCreateLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Editar */}
      <Modal
        data-cy="edit-department-modal"
        isOpen={isEditModalOpen}
        title="Editar Departamento"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          {editForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={editForm.modalError.validationErrors}
            />
          )}

          {editForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                editForm.modalError.parsedError?.isServerError ?? false
              }
              message={editForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={editForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ingresa el nombre del departamento"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={editForm.form.control}
              name="htmlColor"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="color-input-edit"
                  >
                    Color (Hex)
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      className="w-12 h-10 border border-slate-600 rounded cursor-pointer bg-slate-800"
                      id="color-input-edit"
                      type="color"
                      value={field.value || "#000000"}
                      onChange={(e) => field.onChange(e.target.value)}
                    />
                    <Input
                      {...field}
                      fullWidth
                      errorMessage={fieldState.error?.message}
                      id="edit-department-color-input"
                      isInvalid={!!fieldState.error}
                      placeholder="#FF0000"
                      size="md"
                      type="text"
                      value={field.value || ""}
                      variant="bordered"
                    />
                  </div>
                  {field.value && (
                    <div className="mt-2 flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded border border-slate-600"
                        style={{ backgroundColor: field.value }}
                      />
                      <span className="text-sm text-slate-400">
                        Vista previa del color
                      </span>
                    </div>
                  )}
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="htmlColor"
                  />
                </>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isEditLoading}
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
              disabled={isEditLoading || editForm.form.formState.isSubmitting}
              isLoading={isEditLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Actualizar
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
