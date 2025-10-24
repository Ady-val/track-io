import { useState, useEffect, useCallback } from "react";
import { EscalationService } from "../lib/services/escalation.service";
import type {
  EscalationConfig,
  EscalationMessage,
  Torreta,
  Receptor,
  TorretaColor,
} from "../types/escalation";

interface UseEscalationConfigProps {
  deviceId: number;
  deviceSignalId: number;
}

export const useEscalationConfig = ({
  deviceId,
  deviceSignalId,
}: UseEscalationConfigProps) => {
  const [config, setConfig] = useState<EscalationConfig | null>(null);
  const [messages, setMessages] = useState<EscalationMessage[]>([]);
  const [torretas, setTorretas] = useState<Torreta[]>([]);
  const [receptors, setReceptors] = useState<Receptor[]>([]);
  const [torretaColors, setTorretaColors] = useState<TorretaColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = useCallback(async () => {
    if (!deviceId || !deviceSignalId) return;

    setLoading(true);
    setError(null);

    try {
      const [
        configData,
        messagesData,
        torretasData,
        receptorsData,
        torretaColorsData,
      ] = await Promise.all([
        EscalationService.getEscalationConfig(deviceId, deviceSignalId),
        EscalationService.getEscalationMessages(deviceId, deviceSignalId),
        EscalationService.getTorretas(),
        EscalationService.getReceptors(),
        EscalationService.getTorretaColors(),
      ]);

      // Siempre establecer los datos, incluso si no hay configuración
      setConfig(configData);
      setMessages(messagesData || []);
      setTorretas(torretasData || []);
      setReceptors(receptorsData || []);
      setTorretaColors(torretaColorsData || []);
      setDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
      // En caso de error, establecer valores por defecto
      setConfig(null);
      setMessages([]);
      setTorretas([]);
      setReceptors([]);
      setTorretaColors([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, deviceSignalId]);

  const saveConfig = useCallback(
    async (
      configData: EscalationConfig,
      messagesData?: EscalationMessage[]
    ): Promise<EscalationConfig | null> => {
      try {
        const savedConfig = await EscalationService.saveEscalationConfig(
          configData,
          messagesData
        );
        if (savedConfig) {
          setConfig(savedConfig);
          return savedConfig;
        }
        return null;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving config");
        return null;
      }
    },
    []
  );

  const saveMessage = useCallback(
    async (message: EscalationMessage): Promise<boolean> => {
      try {
        let savedMessage;
        if (message.id) {
          savedMessage = await EscalationService.updateEscalationMessage(
            message.id,
            message
          );
        } else {
          savedMessage =
            await EscalationService.createEscalationMessage(message);
        }

        if (savedMessage) {
          setMessages((prev) => {
            if (message.id) {
              return prev.map((m) => (m.id === message.id ? savedMessage : m));
            } else {
              return [...prev, savedMessage];
            }
          });
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error saving message");
        return false;
      }
    },
    []
  );

  const deleteMessage = useCallback(
    async (messageId: number): Promise<boolean> => {
      try {
        const success =
          await EscalationService.deleteEscalationMessage(messageId);
        if (success) {
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          return true;
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error deleting message");
        return false;
      }
    },
    []
  );

  useEffect(() => {
    // Reset dataLoaded cuando cambian los parámetros
    setDataLoaded(false);
  }, [deviceId, deviceSignalId]);

  useEffect(() => {
    if (deviceId && deviceSignalId && !dataLoaded) {
      loadData();
    }
  }, [deviceId, deviceSignalId, loadData, dataLoaded]);

  return {
    config,
    messages,
    torretas,
    receptors,
    torretaColors,
    loading,
    error,
    loadData,
    saveConfig,
    saveMessage,
    deleteMessage,
  };
};
