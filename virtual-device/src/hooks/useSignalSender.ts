import type { DeviceSignal, Device } from "../types";

import { useState } from "react";

import { apiService } from "../services/api";

export const useSignalSender = () => {
  const [sendingSignals, setSendingSignals] = useState<Set<number>>(new Set());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());

  const sendSignal = async (
    deviceId: number,
    device: Device,
    deviceSignal: DeviceSignal
  ): Promise<{ success: boolean; value?: string; error?: string }> => {
    setSendingSignals((prev) => new Set(prev).add(deviceSignal.id));
    setErrors((prev) => {
      const newMap = new Map(prev);

      newMap.delete(deviceSignal.id);

      return newMap;
    });

    try {
      await apiService.sendSignal(deviceId, device, deviceSignal);

      console.log("Signal sent successfully:", {
        deviceExternalId: device.externalId,
        signalExternalValueId: deviceSignal.externalValueId,
      });

      return { success: true, value: deviceSignal.externalValueId };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setErrors((prev) => {
        const newMap = new Map(prev);

        newMap.set(deviceSignal.id, errorMessage);

        return newMap;
      });

      return { success: false, error: errorMessage };
    } finally {
      setSendingSignals((prev) => {
        const newSet = new Set(prev);

        newSet.delete(deviceSignal.id);

        return newSet;
      });
    }
  };

  const sendVirtualDeviceSignal = async (
    device: Device,
    deviceSignal: DeviceSignal,
    reason: string,
    comment?: string
  ): Promise<{ success: boolean; error?: string }> => {
    setSendingSignals((prev) => new Set(prev).add(deviceSignal.id));
    setErrors((prev) => {
      const newMap = new Map(prev);

      newMap.delete(deviceSignal.id);

      return newMap;
    });

    try {
      await apiService.sendVirtualDeviceSignal(
        reason || "",
        device,
        deviceSignal,
        comment
      );

      console.log("Virtual device signal sent successfully:", {
        deviceExternalId: device.externalId,
        signalExternalValueId: deviceSignal.externalValueId,
        reason,
        comment,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      setErrors((prev) => {
        const newMap = new Map(prev);

        newMap.set(deviceSignal.id, errorMessage);

        return newMap;
      });

      return { success: false, error: errorMessage };
    } finally {
      setSendingSignals((prev) => {
        const newSet = new Set(prev);

        newSet.delete(deviceSignal.id);

        return newSet;
      });
    }
  };

  const clearError = (signalId: number) => {
    setErrors((prev) => {
      const newMap = new Map(prev);

      newMap.delete(signalId);

      return newMap;
    });
  };

  const isSending = (signalId: number) => sendingSignals.has(signalId);
  const getError = (signalId: number) => errors.get(signalId);

  return {
    sendSignal,
    sendVirtualDeviceSignal,
    isSending,
    getError,
    clearError,
    sendingSignals,
    errors,
  };
};
