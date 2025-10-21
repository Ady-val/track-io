import { useMutation, useQueryClient } from "@tanstack/react-query";
import alertMessageService from "../lib/services/alertMessage.service";
import type { NewMessageData } from "@/types/alertRule";

export const useCreateAlertMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertRuleId,
      data,
    }: {
      alertRuleId: string;
      data: NewMessageData;
    }) =>
      alertMessageService.create(alertRuleId, {
        ...data,
        status:
          data.grupo === "Critical"
            ? "critical"
            : data.grupo === "Warning"
              ? "warning"
              : "alert",
      }),
    onSuccess: (_, { alertRuleId }) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", alertRuleId] });
    },
  });
};

export const useUpdateAlertMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertRuleId,
      messageId,
      data,
    }: {
      alertRuleId: string;
      messageId: number;
      data: Partial<NewMessageData>;
    }) => alertMessageService.update(alertRuleId, messageId, data),
    onSuccess: (_, { alertRuleId }) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", alertRuleId] });
    },
  });
};

export const useDeleteAlertMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertRuleId,
      messageId,
    }: {
      alertRuleId: string;
      messageId: number;
    }) => alertMessageService.delete(alertRuleId, messageId),
    onSuccess: (_, { alertRuleId }) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", alertRuleId] });
    },
  });
};

export const useDuplicateAlertMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertRuleId,
      messageId,
    }: {
      alertRuleId: string;
      messageId: number;
    }) => alertMessageService.duplicate(alertRuleId, messageId),
    onSuccess: (_, { alertRuleId }) => {
      queryClient.invalidateQueries({ queryKey: ["alertRules"] });
      queryClient.invalidateQueries({ queryKey: ["alertRule", alertRuleId] });
    },
  });
};

