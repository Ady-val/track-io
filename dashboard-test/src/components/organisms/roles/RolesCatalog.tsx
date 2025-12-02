import React, { useState } from "react";

import { Module, Action } from "@/constants/permissions";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useModalError } from "@/hooks/useModalError";
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

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
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
  const [formData, setFormData] = useState({ name: "", description: "" });
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");

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
    setFormData({ name: "", description: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData({ name: role.name, description: role.description || "" });
    setFormErrors({});
    errorHandling.clearErrors();
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
        if (modules.length > 0 && permissions.length === 0) {
          await initializePermissionsMutation.mutateAsync();
        }
        await createRoleMutation.mutateAsync(formData);
        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedRole) {
        await updateRoleMutation.mutateAsync({
          id: selectedRole.id,
          data: formData,
        });
        setIsEditModalOpen(false);
      }

      setFormData({ name: "", description: "" });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el rol");
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedRole) {
      try {
        await deleteRoleMutation.mutateAsync(selectedRole.id);
        setIsDeleteModalOpen(false);
        setSelectedRole(null);
      } catch (error) {
        console.error("Error deleting role:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "" });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedRole(null);
  };

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

      <Modal
        isOpen={isCreateModalOpen || isEditModalOpen}
        title={isCreateModalOpen ? "Crear Rol" : "Editar Rol"}
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
            placeholder="Ingresa el nombre del rol"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            error={undefined}
            label="Descripción"
            name="description"
            placeholder="Ingresa una descripción (opcional)"
            value={formData.description}
            onChange={(value) =>
              setFormData({ ...formData, description: value as string })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={
                createRoleMutation.isPending || updateRoleMutation.isPending
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
                createRoleMutation.isPending || updateRoleMutation.isPending
              }
              size="md"
              type="submit"
              variant="solid"
            >
              {createRoleMutation.isPending || updateRoleMutation.isPending
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
          modules={modules}
          permissions={permissions}
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
