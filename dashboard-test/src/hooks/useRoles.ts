import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import apiClient from "../lib/api";

export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: number;
  module: string;
  action: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

const rolesApi = {
  getRoles: async (params?: {
    limit?: number;
    offset?: number;
    name?: string;
  }) => {
    const response = await apiClient.get("/roles", { params });

    return response.data;
  },
  createRole: async (data: { name: string; description?: string }) => {
    const response = await apiClient.post("/roles", data);

    return response.data;
  },
  updateRole: async (
    id: number,
    data: { name?: string; description?: string }
  ) => {
    const response = await apiClient.patch(`/roles/${id}`, data);

    return response.data;
  },
  deleteRole: async (id: number) => {
    const response = await apiClient.delete(`/roles/${id}`);

    return response.data;
  },
  getRolePermissions: async (id: number) => {
    const response = await apiClient.get(`/roles/${id}/permissions`);

    return response.data;
  },
  assignPermissions: async (id: number, permissionIds: number[]) => {
    const response = await apiClient.post(`/roles/${id}/permissions`, {
      permissionIds,
    });

    return response.data;
  },
  removePermissions: async (id: number, permissionIds: number[]) => {
    const response = await apiClient.delete(`/roles/${id}/permissions`, {
      data: { permissionIds },
    });

    return response.data;
  },
  getAllPermissions: async () => {
    const response = await apiClient.get("/permissions");

    return response.data;
  },
  getModules: async () => {
    const response = await apiClient.get("/permissions/modules");

    return response.data;
  },
  initializePermissions: async () => {
    const response = await apiClient.post("/permissions/initialize");

    return response.data;
  },
};

export function useRoles(params?: {
  limit?: number;
  offset?: number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["roles", params],
    queryFn: () => rolesApi.getRoles(params),
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; description?: string };
    }) => rolesApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useRolePermissions(roleId: number) {
  return useQuery({
    queryKey: ["roles", roleId, "permissions"],
    queryFn: () => rolesApi.getRolePermissions(roleId),
    enabled: !!roleId,
  });
}

export function useAssignPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => rolesApi.assignPermissions(roleId, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({
        queryKey: ["roles", variables.roleId, "permissions"],
      });
    },
  });
}

export function useRemovePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => rolesApi.removePermissions(roleId, permissionIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      queryClient.invalidateQueries({
        queryKey: ["roles", variables.roleId, "permissions"],
      });
    },
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => rolesApi.getAllPermissions(),
  });
}

export function useModules() {
  return useQuery({
    queryKey: ["permissions", "modules"],
    queryFn: () => rolesApi.getModules(),
  });
}

export function useInitializePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: rolesApi.initializePermissions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["permissions", "modules"] });
    },
  });
}
