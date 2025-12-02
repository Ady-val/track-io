import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import apiClient from "../lib/api";

export interface User {
  id: number;
  name: string;
  username: string;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

const usersApi = {
  getUsers: async (params?: {
    limit?: number;
    offset?: number;
    name?: string;
    username?: string;
  }) => {
    const response = await apiClient.get("/users", { params });

    return response.data;
  },
  createUser: async (data: {
    name: string;
    username: string;
    password: string;
  }) => {
    const response = await apiClient.post("/users", data);

    return response.data;
  },
  updateUser: async (
    id: number,
    data: { name?: string; username?: string; password?: string }
  ) => {
    const response = await apiClient.patch(`/users/${id}`, data);

    return response.data;
  },
  deleteUser: async (id: number) => {
    const response = await apiClient.delete(`/users/${id}`);

    return response.data;
  },
  getUserRoles: async (id: number) => {
    const response = await apiClient.get(`/users/${id}/roles`);

    return response.data;
  },
  assignRole: async (userId: number, roleId: number) => {
    const response = await apiClient.post(`/users/${userId}/roles`, { roleId });

    return response.data;
  },
  removeRole: async (userId: number, roleId: number) => {
    const response = await apiClient.delete(`/users/${userId}/roles/${roleId}`);

    return response.data;
  },
};

export function useUsers(params?: {
  limit?: number;
  offset?: number;
  name?: string;
  username?: string;
}) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: () => usersApi.getUsers(params),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; username?: string; password?: string };
    }) => usersApi.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: usersApi.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUserRoles(userId: number) {
  return useQuery({
    queryKey: ["users", userId, "roles"],
    queryFn: () => usersApi.getUserRoles(userId),
    enabled: !!userId,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      usersApi.assignRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: ["users", variables.userId, "roles"],
      });
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
      usersApi.removeRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({
        queryKey: ["users", variables.userId, "roles"],
      });
    },
  });
}
