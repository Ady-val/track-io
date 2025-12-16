import React, { useState, useEffect } from "react";

import { Module, Action } from "@/constants/permissions";
import { useHasPermission } from "@/hooks/useHasPermission";
import { useModalError } from "@/hooks/useModalError";
import { useRoles } from "@/hooks/useRoles";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useUserRoles,
  useAssignRole,
  useRemoveRole,
  type User,
} from "@/hooks/useUsers";

import { ErrorMessage, ValidationErrorList } from "../../atoms";
import { Button } from "../../atoms/Button";
import { Icon } from "../../atoms/Icon";
import { Label } from "../../atoms/Label";
import { SearchInput } from "../../atoms/SearchInput";
import { Select } from "../../atoms/Select";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FormField } from "../../molecules/FormField";
import { Pagination } from "../../molecules/Pagination";
import { Modal } from "../Modal";

export function UsersCatalog() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] =
    useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    roleIds: [] as number[],
  });
  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    username?: string;
    password?: string;
  }>({});
  const [passwordErrors, setPasswordErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const errorHandling = useModalError("Error al procesar la solicitud");
  const passwordErrorHandling = useModalError("Error al cambiar la contraseña");

  const hasCreatePermission = useHasPermission(Module.USERS, Action.CREATE);
  const hasUpdatePermission = useHasPermission(Module.USERS, Action.UPDATE);
  const hasDeletePermission = useHasPermission(Module.USERS, Action.DELETE);

  const itemsPerPage = 10;
  const offset = (currentPage - 1) * itemsPerPage;

  const { data: usersData, isLoading } = useUsers({
    limit: itemsPerPage,
    offset,
    name: searchTerm || undefined,
    username: searchTerm || undefined,
  });

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const assignRoleMutation = useAssignRole();
  const removeRoleMutation = useRemoveRole();

  const { data: allRolesData } = useRoles();
  const { data: userRolesData } = useUserRoles(selectedUser?.id ?? 0);

  const allRoles = allRolesData?.data ?? [];
  const userRoles = userRolesData?.data ?? [];

  const users = usersData?.data ?? [];
  const totalItems = usersData?.total ?? 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const columns: Array<TableColumn<User>> = [
    {
      id: "name",
      label: "Nombre",
      key: "name",
    },
    {
      id: "username",
      label: "Usuario",
      key: "username",
    },
    {
      id: "createdBy",
      label: "Creado por",
      key: "createdBy",
    },
    ...(hasUpdatePermission || hasDeletePermission
      ? [
          {
            id: "actions",
            label: "Acciones",
            key: "name" as keyof User,
            width: "150px",
            component: (_value: unknown, row: User) => (
              <div className="flex space-x-2">
                {hasUpdatePermission && (
                  <>
                    <Button
                      className="text-blue-400 hover:text-blue-300 border-slate-600 hover:border-blue-400"
                      size="sm"
                      variant="bordered"
                      onClick={() => handleEdit(row)}
                    >
                      <Icon className="w-4 h-4" name="edit" />
                    </Button>
                    <Button
                      className="text-yellow-400 hover:text-yellow-300 border-slate-600 hover:border-yellow-400"
                      size="sm"
                      variant="bordered"
                      onClick={() => handleChangePassword(row)}
                    >
                      <Icon className="w-4 h-4" name="lock" />
                    </Button>
                  </>
                )}
                {hasDeletePermission && (
                  <Button
                    className="text-red-400 hover:text-red-300 border-slate-600 hover:border-red-400"
                    size="sm"
                    variant="bordered"
                    onClick={() => handleDelete(row)}
                  >
                    <Icon className="w-4 h-4" name="trash" />
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  useEffect(() => {
    if (isEditModalOpen && selectedUser && userRoles.length > 0) {
      setFormData((prev) => ({
        ...prev,
        roleIds: userRoles.map((r: { id: number }) => r.id),
      }));
    }
  }, [isEditModalOpen, selectedUser, userRoles]);

  const handleCreate = () => {
    setFormData({ name: "", username: "", password: "", roleIds: [] });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "",
      roleIds: [],
    });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsEditModalOpen(true);
  };

  const handleChangePassword = (user: User) => {
    setSelectedUser(user);
    setPasswordData({ password: "", confirmPassword: "" });
    setPasswordErrors({});
    passwordErrorHandling.clearErrors();
    setIsChangePasswordModalOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { name?: string; username?: string } = {};

    if (!formData.name.trim()) {
      errors.name = "El nombre es requerido";
    }

    if (!formData.username.trim()) {
      errors.username = "El nombre de usuario es requerido";
    } else if (formData.username.length < 3) {
      errors.username = "El nombre de usuario debe tener al menos 3 caracteres";
    }

    if (isCreateModalOpen) {
      if (!formData.password.trim()) {
        setFormErrors({ ...errors, password: "La contraseña es requerida" });
        errorHandling.setValidationErrors(["La contraseña es requerida"]);

        return;
      } else if (formData.password.length < 6) {
        setFormErrors({
          ...errors,
          password: "La contraseña debe tener al menos 6 caracteres",
        });
        errorHandling.setValidationErrors([
          "La contraseña debe tener al menos 6 caracteres",
        ]);

        return;
      }
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
        const { roleIds, ...userData } = formData;
        const newUser = await createUserMutation.mutateAsync(userData);

        if (roleIds.length > 0 && newUser.data?.id) {
          for (const roleId of roleIds) {
            await assignRoleMutation.mutateAsync({
              userId: newUser.data.id,
              roleId,
            });
          }
        }

        setIsCreateModalOpen(false);
      } else if (isEditModalOpen && selectedUser) {
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: {
            name: formData.name,
            username: formData.username,
          },
        });

        const currentRoleIds = new Set(
          userRoles.map((r: { id: number }) => r.id)
        );
        const newRoleIds = new Set(formData.roleIds);

        const toAdd = formData.roleIds.filter(
          (id: number) => !currentRoleIds.has(id)
        );
        const toRemove = Array.from(currentRoleIds) as number[];
        const toRemoveFiltered = toRemove.filter(
          (id: number) => !newRoleIds.has(id)
        );

        for (const roleId of toAdd) {
          await assignRoleMutation.mutateAsync({
            userId: selectedUser.id,
            roleId: Number(roleId),
          });
        }

        for (const roleId of toRemoveFiltered) {
          await removeRoleMutation.mutateAsync({
            userId: selectedUser.id,
            roleId: Number(roleId),
          });
        }

        setIsEditModalOpen(false);
      }

      setFormData({ name: "", username: "", password: "", roleIds: [] });
      setFormErrors({});
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar el usuario");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: { password?: string; confirmPassword?: string } = {};

    if (!passwordData.password.trim()) {
      errors.password = "La contraseña es requerida";
    } else if (passwordData.password.length < 6) {
      errors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = "Confirma la contraseña";
    } else if (passwordData.password !== passwordData.confirmPassword) {
      errors.confirmPassword = "Las contraseñas no coinciden";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      passwordErrorHandling.setValidationErrors(
        Object.values(errors).filter((err): err is string => !!err)
      );

      return;
    }

    try {
      passwordErrorHandling.clearErrors();

      if (selectedUser) {
        await updateUserMutation.mutateAsync({
          id: selectedUser.id,
          data: {
            password: passwordData.password,
          },
        });
        setIsChangePasswordModalOpen(false);
        setPasswordData({ password: "", confirmPassword: "" });
        setPasswordErrors({});
      }
    } catch (error) {
      passwordErrorHandling.handleApiError(
        error,
        "Error al cambiar la contraseña"
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser) {
      try {
        await deleteUserMutation.mutateAsync(selectedUser.id);
        setIsDeleteModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", username: "", password: "", roleIds: [] });
    setFormErrors({});
    errorHandling.clearErrors();
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(e.target.selectedOptions);
    const selectedRoleIds = selectedOptions.map((option) =>
      Number(option.value)
    );

    setFormData((prev) => ({ ...prev, roleIds: selectedRoleIds }));
  };

  const handlePasswordCancel = () => {
    setPasswordData({ password: "", confirmPassword: "" });
    setPasswordErrors({});
    passwordErrorHandling.clearErrors();
    setIsChangePasswordModalOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar usuarios..."
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
            Crear Usuario
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={users}
          emptyMessage="No hay usuarios registrados"
          loading={isLoading}
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
        isOpen={isCreateModalOpen}
        title="Crear Usuario"
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
            placeholder="Ingresa el nombre completo"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            required
            error={formErrors.username}
            label="Nombre de Usuario"
            name="username"
            placeholder="Ingresa el nombre de usuario"
            value={formData.username}
            onChange={(value) =>
              setFormData({ ...formData, username: value as string })
            }
          />

          <FormField
            required
            error={formErrors.password}
            label="Contraseña"
            name="password"
            placeholder="Ingresa la contraseña"
            type="password"
            value={formData.password}
            onChange={(value) =>
              setFormData({ ...formData, password: value as string })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="roles-select">Roles</Label>
            <Select
              fullWidth
              multiple
              className="min-h-[120px]"
              id="roles-select"
              value={formData.roleIds.map(String)}
              onChange={handleRoleChange}
            >
              {allRoles.length === 0 ? (
                <option disabled value="">
                  No hay roles disponibles
                </option>
              ) : (
                allRoles.map(
                  (role: {
                    id: number;
                    name: string;
                    description?: string;
                  }) => (
                    <option key={role.id} value={role.id}>
                      {role.name}{" "}
                      {role.description ? `- ${role.description}` : ""}
                    </option>
                  )
                )
              )}
            </Select>
            <p className="text-xs text-slate-400">
              Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar
              múltiples roles
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={createUserMutation.isPending}
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
              disabled={createUserMutation.isPending}
              size="md"
              type="submit"
              variant="solid"
            >
              {createUserMutation.isPending ? "Guardando..." : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        title="Editar Usuario"
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
            placeholder="Ingresa el nombre completo"
            value={formData.name}
            onChange={(value) =>
              setFormData({ ...formData, name: value as string })
            }
          />

          <FormField
            required
            error={formErrors.username}
            label="Nombre de Usuario"
            name="username"
            placeholder="Ingresa el nombre de usuario"
            value={formData.username}
            onChange={(value) =>
              setFormData({ ...formData, username: value as string })
            }
          />

          <div className="space-y-2">
            <Label htmlFor="roles-select-edit">Roles</Label>
            <Select
              fullWidth
              multiple
              className="min-h-[120px]"
              id="roles-select-edit"
              value={formData.roleIds.map(String)}
              onChange={handleRoleChange}
            >
              {allRoles.length === 0 ? (
                <option disabled value="">
                  No hay roles disponibles
                </option>
              ) : (
                allRoles.map(
                  (role: {
                    id: number;
                    name: string;
                    description?: string;
                  }) => (
                    <option key={role.id} value={role.id}>
                      {role.name}{" "}
                      {role.description ? `- ${role.description}` : ""}
                    </option>
                  )
                )
              )}
            </Select>
            <p className="text-xs text-slate-400">
              Mantén presionada la tecla Ctrl (o Cmd en Mac) para seleccionar
              múltiples roles
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={updateUserMutation.isPending}
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
              disabled={updateUserMutation.isPending}
              size="md"
              type="submit"
              variant="solid"
            >
              {updateUserMutation.isPending ? "Guardando..." : "Actualizar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isChangePasswordModalOpen}
        title={`Cambiar Contraseña - ${selectedUser?.name}`}
        onClose={handlePasswordCancel}
      >
        <form className="space-y-4" onSubmit={handlePasswordSubmit}>
          {passwordErrorHandling.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={passwordErrorHandling.validationErrors}
            />
          )}

          {passwordErrorHandling.serverError && (
            <ErrorMessage
              isServerError={
                passwordErrorHandling.parsedError?.isServerError ?? false
              }
              message={passwordErrorHandling.serverError}
              type="server"
            />
          )}

          <FormField
            autoFocus
            required
            error={passwordErrors.password}
            label="Nueva Contraseña"
            name="password"
            placeholder="Ingresa la nueva contraseña"
            type="password"
            value={passwordData.password}
            onChange={(value) =>
              setPasswordData({ ...passwordData, password: value as string })
            }
          />

          <FormField
            required
            error={passwordErrors.confirmPassword}
            label="Confirmar Contraseña"
            name="confirmPassword"
            placeholder="Confirma la nueva contraseña"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(value) =>
              setPasswordData({
                ...passwordData,
                confirmPassword: value as string,
              })
            }
          />

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={updateUserMutation.isPending}
              size="md"
              type="button"
              variant="solid"
              onPress={handlePasswordCancel}
            >
              Cancelar
            </Button>
            <Button
              className="px-6 py-2 font-semibold"
              color="primary"
              disabled={updateUserMutation.isPending}
              size="md"
              type="submit"
              variant="solid"
            >
              {updateUserMutation.isPending
                ? "Guardando..."
                : "Cambiar Contraseña"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        isOpen={isDeleteModalOpen}
        loading={deleteUserMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selectedUser?.name}"?`}
        title="Eliminar Usuario"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
