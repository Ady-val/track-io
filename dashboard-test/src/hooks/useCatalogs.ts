import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import apiClient from "../lib/api";

export interface Area {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Department {
  id: number;
  name: string;
  htmlColor?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Torreta {
  id: number;
  name: string;
  description?: string;
  externalId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface TorretaColor {
  id: number;
  name: string;
  htmlColor: string;
  deviceColorId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Receptor {
  id: number;
  externalId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Email {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

const catalogApi = {
  getAreas: async (params?: {
    limit?: number;
    offset?: number;
    name?: string;
  }) => {
    const response = await apiClient.get("/areas", { params });

    return response.data;
  },
  createArea: async (data: { name: string }) => {
    const response = await apiClient.post("/areas", data);

    return response.data;
  },
  updateArea: async (id: number, data: { name: string }) => {
    const response = await apiClient.patch(`/areas/${id}`, data);

    return response.data;
  },
  deleteArea: async (id: number) => {
    const response = await apiClient.delete(`/areas/${id}`);

    return response.data;
  },

  getDepartments: async (params?: {
    limit?: number;
    offset?: number;
    name?: string;
  }) => {
    const response = await apiClient.get("/departments", { params });

    return response.data;
  },
  createDepartment: async (data: { name: string; htmlColor?: string }) => {
    const response = await apiClient.post("/departments", data);

    return response.data;
  },
  updateDepartment: async (
    id: number,
    data: { name?: string; htmlColor?: string }
  ) => {
    const response = await apiClient.patch(`/departments/${id}`, data);

    return response.data;
  },
  deleteDepartment: async (id: number) => {
    const response = await apiClient.delete(`/departments/${id}`);

    return response.data;
  },

  getTorretas: async (params?: { active?: boolean }) => {
    const response = await apiClient.get("/torretas", { params });

    return response.data;
  },
  createTorreta: async (data: {
    name: string;
    description?: string;
    externalId?: string;
  }) => {
    const response = await apiClient.post("/torretas", data);

    return response.data;
  },
  updateTorreta: async (
    id: number,
    data: { name: string; description?: string; externalId?: string }
  ) => {
    const response = await apiClient.put(`/torretas/${id}`, data);

    return response.data;
  },
  deleteTorreta: async (id: number) => {
    const response = await apiClient.delete(`/torretas/${id}`);

    return response.data;
  },

  getTorretaColors: async () => {
    const response = await apiClient.get("/torreta-colors");

    return response.data;
  },
  createTorretaColor: async (data: {
    name: string;
    htmlColor: string;
    deviceColorId: string;
    order: number;
  }) => {
    const response = await apiClient.post("/torreta-colors", data);

    return response.data;
  },
  updateTorretaColor: async (
    id: number,
    data: {
      name: string;
      htmlColor: string;
      deviceColorId: string;
      order: number;
    }
  ) => {
    const response = await apiClient.put(`/torreta-colors/${id}`, data);

    return response.data;
  },
  deleteTorretaColor: async (id: number) => {
    const response = await apiClient.delete(`/torreta-colors/${id}`);

    return response.data;
  },

  getReceptors: async (params?: { active?: boolean }) => {
    const response = await apiClient.get("/receptors", { params });

    return response.data;
  },
  createReceptor: async (data: { externalId: string; name: string }) => {
    const response = await apiClient.post("/receptors", data);

    return response.data;
  },
  updateReceptor: async (
    id: number,
    data: { externalId: string; name: string }
  ) => {
    const response = await apiClient.put(`/receptors/${id}`, data);

    return response.data;
  },
  deleteReceptor: async (id: number) => {
    const response = await apiClient.delete(`/receptors/${id}`);

    return response.data;
  },

  getEmails: async (params?: {
    limit?: number;
    offset?: number;
    name?: string;
    email?: string;
  }) => {
    const response = await apiClient.get("/emails", { params });

    return response.data;
  },
  createEmail: async (data: { name: string; email: string }) => {
    const response = await apiClient.post("/emails", data);

    return response.data;
  },
  updateEmail: async (id: number, data: { name?: string; email?: string }) => {
    const response = await apiClient.patch(`/emails/${id}`, data);

    return response.data;
  },
  deleteEmail: async (id: number) => {
    const response = await apiClient.delete(`/emails/${id}`);

    return response.data;
  },
};

export function useAreas(params?: {
  limit?: number;
  offset?: number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["areas", params],
    queryFn: () => catalogApi.getAreas(params),
  });
}

export function useCreateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}

export function useUpdateArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { name: string } }) =>
      catalogApi.updateArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}

export function useDeleteArea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
    },
  });
}

export function useDepartments(params?: {
  limit?: number;
  offset?: number;
  name?: string;
}) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => catalogApi.getDepartments(params),
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; htmlColor?: string };
    }) => catalogApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}

export function useTorretas(params?: { active?: boolean }) {
  return useQuery({
    queryKey: ["torretas", params],
    queryFn: () => catalogApi.getTorretas(params),
  });
}

export function useCreateTorreta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createTorreta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torretas"] });
    },
  });
}

export function useUpdateTorreta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name: string; description?: string };
    }) => catalogApi.updateTorreta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torretas"] });
    },
  });
}

export function useDeleteTorreta() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteTorreta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torretas"] });
    },
  });
}

export function useTorretaColors() {
  return useQuery({
    queryKey: ["torreta-colors"],
    queryFn: catalogApi.getTorretaColors,
  });
}

export function useCreateTorretaColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createTorretaColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torreta-colors"] });
    },
  });
}

export function useUpdateTorretaColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name: string;
        htmlColor: string;
        deviceColorId: string;
        order: number;
      };
    }) => catalogApi.updateTorretaColor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torreta-colors"] });
    },
  });
}

export function useDeleteTorretaColor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteTorretaColor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["torreta-colors"] });
    },
  });
}

export function useReceptors(params?: { active?: boolean }) {
  return useQuery({
    queryKey: ["receptors", params],
    queryFn: () => catalogApi.getReceptors(params),
  });
}

export function useCreateReceptor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createReceptor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptors"] });
    },
  });
}

export function useUpdateReceptor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { externalId: string; name: string };
    }) => catalogApi.updateReceptor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptors"] });
    },
  });
}

export function useDeleteReceptor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteReceptor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["receptors"] });
    },
  });
}

export function useEmails(params?: {
  limit?: number;
  offset?: number;
  name?: string;
  email?: string;
}) {
  return useQuery({
    queryKey: ["emails", params],
    queryFn: () => catalogApi.getEmails(params),
  });
}

export function useCreateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.createEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useUpdateEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: { name?: string; email?: string };
    }) => catalogApi.updateEmail(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}

export function useDeleteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: catalogApi.deleteEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emails"] });
    },
  });
}
