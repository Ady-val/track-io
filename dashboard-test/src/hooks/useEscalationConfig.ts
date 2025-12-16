import type {
  EscalationConfig,
  EscalationMessage,
  Torreta,
  Receptor,
  TorretaColor,
  Email,
} from "../types/escalation";

import { useState, useEffect, useCallback } from "react";

import { EscalationService } from "../lib/services/escalation.service";

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
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar datos globales siempre (no dependen de deviceId/deviceSignalId)
      const [torretasData, receptorsData, torretaColorsData, emailsData] =
        await Promise.all([
          EscalationService.getTorretas(),
          EscalationService.getReceptors(),
          EscalationService.getTorretaColors(),
          EscalationService.getEmails(),
        ]);

      setTorretas(torretasData || []);
      setReceptors(receptorsData || []);
      setTorretaColors(torretaColorsData || []);
      setEmails(emailsData || []);

      // Cargar datos específicos solo si tenemos deviceId y deviceSignalId
      if (deviceId && deviceSignalId) {
        const [configData, messagesData] = await Promise.all([
          EscalationService.getEscalationConfig(deviceId, deviceSignalId),
          EscalationService.getEscalationMessages(deviceId, deviceSignalId),
        ]);

        setConfig(configData);
        setMessages(messagesData || []);
      } else {
        setConfig(null);
        setMessages([]);
      }

      setDataLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading data");
      setConfig(null);
      setMessages([]);
      // No limpiar datos globales si ya se cargaron antes
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

  // Cargar datos globales siempre al montar y cuando cambian deviceId/deviceSignalId
  useEffect(() => {
    loadData();
  }, [deviceId, deviceSignalId, loadData]);

  return {
    config,
    messages,
    torretas,
    receptors,
    torretaColors,
    emails,
    loading,
    error,
    loadData,
    saveConfig,
    saveMessage,
    deleteMessage,
  };
};
