import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  useRoles,
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  usePermissions,
  useModules,
  useInitializePermissions,
  type Role,
} from "@/hooks/useRoles";
import { createRoleSchema, updateRoleSchema } from "@/lib/validations/schemas";

import { ErrorMessage, ValidationErrorList, Button, Input } from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

import { PermissionMatrix } from "./PermissionMatrix";

export function RolesCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: rolesData, isLoading } = useRoles({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
  });

  const { data: permissionsData, isLoading: isLoadingPermissions } =
    usePermissions();
  const { data: modulesData, isLoading: isLoadingModules } = useModules();
  const initializePermissionsMutation = useInitializePermissions();

  const hasCreatePermission = useHasPermission(
    Module.ROLES_AND_PERMISSIONS,
    Action.CREATE
  );
  const hasUpdatePermission = useHasPermission(
    Module.ROLES_AND_PERMISSIONS,
    Action.UPDATE
  );
  const hasDeletePermission = useHasPermission(
    Module.ROLES_AND_PERMISSIONS,
    Action.DELETE
  );

  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const deleteRoleMutation = useDeleteRole();

  const roles = rolesData?.data ?? [];
  const totalItems = rolesData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const permissions = permissionsData?.data ?? [];
  const modules = modulesData?.data ?? [];

  // Form para crear
  const createForm = useFormValidation({
    schema: createRoleSchema,
    defaultValues: {
      name: "",
      description: undefined,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Rol creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateRoleSchema,
    defaultValues: {
      name: selectedRole?.name ?? "",
      description: selectedRole?.description,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Rol actualizado exitosamente",
  });

  const columns: Array<TableColumn<Role>> = [
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
      id: "description",
      label: "Descripción",
      key: "description",
    },
    {
      id: "permissions",
      label: "Permisos",
      key: "name",
      width: "150px",
      component: (_value, row) => {
        if (!hasUpdatePermission) {
          return null;
        }

        return (
          <Button
            color="primary"
            size="sm"
            variant="bordered"
            onClick={() => handleManagePermissions(row)}
          >
            Gestionar
          </Button>
        );
      },
    },
  ];

  const handleCreate = () => {
    createForm.resetForm({
      name: "",
      description: undefined,
    });
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    editForm.resetForm({
      name: role.name,
      description: role.description || undefined,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRole(role);
    setIsPermissionsModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      if (modules.length > 0 && permissions.length === 0) {
        await initializePermissionsMutation.mutateAsync();
      }
      await createRoleMutation.mutateAsync(data);
      createForm.toast.success("Rol creado exitosamente");
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selectedRole) return;

    try {
      editForm.clearAllErrors();
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        data,
      });
      editForm.toast.success("Rol actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (selectedRole) {
      try {
        await deleteRoleMutation.mutateAsync(selectedRole.id);
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
      } catch (error) {
        // El error se maneja automáticamente por la mutación
      }
    }
  };

  const handleCancel = () => {
    createForm.resetForm();
    editForm.resetForm();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedRole(null);
  };

  const isCreateLoading = createRoleMutation.isPending;
  const isEditLoading = updateRoleMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar roles..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreatePermission && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-role-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Rol
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={roles}
          data-cy="roles-table"
          emptyMessage="No hay roles registrados"
          loading={isLoading}
          onDelete={hasDeletePermission ? handleDelete : undefined}
          onEdit={hasUpdatePermission ? handleEdit : undefined}
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
        data-cy="create-role-modal"
        isOpen={isCreateModalOpen}
        title="Crear Rol"
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
                    placeholder="Ingresa el nombre del rol"
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
              name="description"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Descripción (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa una descripción"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="description"
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
        data-cy="edit-role-modal"
        isOpen={isEditModalOpen}
        title="Editar Rol"
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
                    placeholder="Ingresa el nombre del rol"
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
              name="description"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isInvalid={!!fieldState.error}
                    label="Descripción (Opcional)"
                    labelPlacement="outside"
                    placeholder="Ingresa una descripción"
                    size="md"
                    value={field.value || ""}
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="description"
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
        data-cy="delete-role-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteRoleMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedRole?.name}"?`}
        title="Eliminar Rol"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />

      {selectedRole && (
        <PermissionMatrix
          isLoading={isLoadingPermissions || isLoadingModules}
          isOpen={isPermissionsModalOpen}
          modules={Array.isArray(modules) ? modules : []}
          permissions={Array.isArray(permissions) ? permissions : []}
          role={selectedRole}
          onClose={() => {
            setIsPermissionsModalOpen(false);
            setSelectedRole(null);
          }}
        />
      )}
    </div>
  );
}
