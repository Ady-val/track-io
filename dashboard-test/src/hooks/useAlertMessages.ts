import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { NewMessageData } from "@/types/alertRule";

import alertMessageService from "../lib/services/alertMessage.service";

export const useCreateAlertMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      alertRuleId,
      data,
      messageGroupId,
    }: {
      alertRuleId: string;
      data: NewMessageData;
      messageGroupId: number;
    }) => {
      // For torreta type, color (deviceColorId) is required
      // For receptor and email, message is required
      const payload: any = {
        messageType: data.messageType,
        targetId: data.targetId,
        messageGroupId,
        status: "pending",
      };

      if (data.messageType === "torreta") {
        if (!data.color) {
          throw new Error("Color (deviceColorId) is required for torreta messages");
        }
        payload.color = data.color;
      } else {
        if (!data.message || data.message.trim().length === 0) {
          throw new Error("Message is required for receptor and email messages");
        }
        payload.message = data.message;
      }

      return alertMessageService.create(alertRuleId, payload);
    },
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
      alertRuleId: _alertRuleId,
      messageId,
    }: {
      alertRuleId: string;
      messageId: number;
    }) => alertMessageService.delete(messageId),
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
