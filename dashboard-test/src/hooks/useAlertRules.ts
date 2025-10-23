import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import type {
  CreateAlertRuleData,
  UpdateAlertRuleData,
  AlertRuleFilters,
} from "@/types/alertRule";

import alertRuleService from "../lib/services/alertRule.service";

export const useAlertRules = (filters?: AlertRuleFilters) => {
  return useQuery({
    queryKey: ["alertRules", filters],
    queryFn: () => alertRuleService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useAlertRule = (id: string) => {
  return useQuery({
    queryKey: ["alertRule", id],
    queryFn: () => alertRuleService.getById(id),
    enabled: !!id,
  });
};

export const useCreateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAlertRuleData) => alertRuleService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
    },
  });
};

export const useUpdateAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRuleData }) =>
      alertRuleService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", id] });
    },
  });
};

export const useToggleAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertRuleService.toggle(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", id] });
    },
  });
};

export const useDeleteAlertRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => alertRuleService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
    },
  });
};
