import React, { useState, useEffect, useMemo, useRef } from "react";

import { useModalError } from "@/hooks/useModalError";
import {
  useRolePermissions,
  useAssignPermissions,
  useRemovePermissions,
  type Role,
  type Permission,
} from "@/hooks/useRoles";

import { Button } from "../../atoms/Button";
import { Modal } from "../Modal";

interface PermissionMatrixProps {
  role: Role;
  permissions: Permission[];
  modules: string[];
  isLoading?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const ACTIONS = ["create", "read", "update", "delete"];

const ACTION_LABELS: Record<string, string> = {
  create: "Crear",
  read: "Leer",
  update: "Actualizar",
  delete: "Eliminar",
};

export function PermissionMatrix({
  role,
  permissions,
  modules,
  isLoading = false,
  isOpen,
  onClose,
}: PermissionMatrixProps) {
  const { data: rolePermissionsData, isLoading: isLoadingPermissions } =
    useRolePermissions(role.id);
  const assignPermissionsMutation = useAssignPermissions();
  const removePermissionsMutation = useRemovePermissions();
  const errorHandling = useModalError("Error al procesar la solicitud");

  const previousRoleIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const rolePermissions = rolePermissionsData?.data ?? [];
  const rolePermissionIdsArray = useMemo(
    () => rolePermissions.map((p) => p.id).sort((a, b) => a - b),
    [rolePermissions]
  );

  const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(
    () => new Set(rolePermissionIdsArray)
  );

  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      previousRoleIdRef.current = null;

      return;
    }

    const isNewRole = previousRoleIdRef.current !== role.id;
    const shouldInitialize = !isInitializedRef.current || isNewRole;

    if (shouldInitialize && rolePermissionIdsArray.length >= 0) {
      setSelectedPermissions(new Set(rolePermissionIdsArray));
      isInitializedRef.current = true;
      previousRoleIdRef.current = role.id;
    }
  }, [isOpen, role.id, rolePermissionIdsArray]);

  const permissionMap = useMemo(() => {
    const map = new Map<string, Permission>();

    permissions.forEach((perm) => {
      const key = `${perm.module}:${perm.action}`;

      map.set(key, perm);
    });

    return map;
  }, [permissions]);

  const handleTogglePermission = (module: string, action: string) => {
    const key = `${module}:${action}`;
    const permission = permissionMap.get(key);

    if (!permission) return;

    const newSelected = new Set(selectedPermissions);

    if (newSelected.has(permission.id)) {
      newSelected.delete(permission.id);
    } else {
      newSelected.add(permission.id);
    }
    setSelectedPermissions(newSelected);
  };

  const handleSelectAllModule = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module);
    const allSelected = modulePermissions.every((p) =>
      selectedPermissions.has(p.id)
    );

    const newSelected = new Set(selectedPermissions);

    modulePermissions.forEach((perm) => {
      if (allSelected) {
        newSelected.delete(perm.id);
      } else {
        newSelected.add(perm.id);
      }
    });
    setSelectedPermissions(newSelected);
  };

  const handleSelectAll = () => {
    const allSelected = permissions.every((p) => selectedPermissions.has(p.id));

    if (allSelected) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(permissions.map((p) => p.id)));
    }
  };

  const handleSave = async () => {
    try {
      errorHandling.clearErrors();

      const currentIds = new Set(rolePermissionIdsArray);
      const newIds = new Set(selectedPermissions);

      const toAdd = Array.from(newIds).filter((id) => !currentIds.has(id));
      const toRemove = Array.from(currentIds).filter((id) => !newIds.has(id));

      const promises: Array<Promise<unknown>> = [];

      if (toAdd.length > 0) {
        promises.push(
          assignPermissionsMutation.mutateAsync({
            roleId: role.id,
            permissionIds: toAdd,
          })
        );
      }

      if (toRemove.length > 0) {
        promises.push(
          removePermissionsMutation.mutateAsync({
            roleId: role.id,
            permissionIds: toRemove,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      onClose();
    } catch (error) {
      errorHandling.handleApiError(error, "Error al guardar los permisos");
    }
  };

  const isModuleFullySelected = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module);

    return (
      modulePermissions.length > 0 &&
      modulePermissions.every((p) => selectedPermissions.has(p.id))
    );
  };

  const isModulePartiallySelected = (module: string) => {
    const modulePermissions = permissions.filter((p) => p.module === module);
    const selectedCount = modulePermissions.filter((p) =>
      selectedPermissions.has(p.id)
    ).length;

    return selectedCount > 0 && selectedCount < modulePermissions.length;
  };

  const allSelected = permissions.every((p) => selectedPermissions.has(p.id));
  const someSelected = permissions.some((p) => selectedPermissions.has(p.id));

  return (
    <Modal
      isOpen={isOpen}
      size="xl"
      title={`Gestionar Permisos - ${role.name}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-600">
          <div className="flex items-center space-x-2">
            <input
              ref={(input) => {
                if (input) input.indeterminate = someSelected && !allSelected;
              }}
              checked={allSelected}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
              type="checkbox"
              onChange={handleSelectAll}
            />
            <span className="text-sm font-semibold text-slate-300">
              Seleccionar Todos
            </span>
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading || isLoadingPermissions ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : modules.length === 0 || permissions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <p>
                {modules.length === 0 && permissions.length === 0
                  ? "No hay módulos ni permisos disponibles."
                  : modules.length === 0
                    ? "No hay módulos disponibles."
                    : "No hay permisos disponibles."}
              </p>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-slate-800 z-10">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-slate-300 border-b border-slate-600">
                    Módulo
                  </th>
                  {ACTIONS.map((action) => (
                    <th
                      key={action}
                      className="text-center p-3 text-sm font-semibold text-slate-300 border-b border-slate-600"
                    >
                      {ACTION_LABELS[action]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => {
                  const modulePermissions = permissions.filter(
                    (p) => p.module === module
                  );

                  if (modulePermissions.length === 0) return null;

                  const fullySelected = isModuleFullySelected(module);
                  const partiallySelected = isModulePartiallySelected(module);

                  return (
                    <tr
                      key={module}
                      className="border-b border-slate-700 hover:bg-slate-800/50"
                    >
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <input
                            ref={(input) => {
                              if (input)
                                input.indeterminate =
                                  partiallySelected && !fullySelected;
                            }}
                            checked={fullySelected}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
                            type="checkbox"
                            onChange={() => handleSelectAllModule(module)}
                          />
                          <span className="text-sm text-slate-300 capitalize">
                            {module.replace(/-/g, " ")}
                          </span>
                        </div>
                      </td>
                      {ACTIONS.map((action) => {
                        const key = `${module}:${action}`;
                        const permission = permissionMap.get(key);
                        const isSelected = permission
                          ? selectedPermissions.has(permission.id)
                          : false;

                        return (
                          <td key={action} className="p-3 text-center">
                            {permission ? (
                              <input
                                checked={isSelected}
                                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-primary focus:ring-primary"
                                type="checkbox"
                                onChange={() =>
                                  handleTogglePermission(module, action)
                                }
                              />
                            ) : (
                              <span className="text-slate-500 text-xs">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-600">
          <Button
            className="px-6 py-2 font-semibold"
            color="default"
            disabled={
              assignPermissionsMutation.isPending ||
              removePermissionsMutation.isPending
            }
            size="md"
            type="button"
            variant="solid"
            onPress={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="px-6 py-2 font-semibold"
            color="primary"
            disabled={
              assignPermissionsMutation.isPending ||
              removePermissionsMutation.isPending
            }
            size="md"
            type="button"
            variant="solid"
            onPress={handleSave}
          >
            {assignPermissionsMutation.isPending ||
            removePermissionsMutation.isPending
              ? "Guardando..."
              : "Guardar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
