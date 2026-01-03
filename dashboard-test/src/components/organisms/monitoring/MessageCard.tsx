import type React from "react";

import { FaTrash } from "react-icons/fa6";
import { Button, Text } from "@components/atoms";

import type { AlertMessage } from "@/types/alertRule";
import type { Torreta, Receptor, Email, TorretaColor } from "@/types/escalation";

const getMessageTypeLabel = (messageType: string | undefined): string => {
  if (!messageType) return "Sin tipo";
  const normalized = messageType.toLowerCase();
  switch (normalized) {
    case "torreta":
      return "Torreta";
    case "receptor":
      return "Receptor";
    case "email":
      return "Email";
    default:
      return messageType;
  }
};

const getMessageIdentifier = (
  message: AlertMessage,
  torretas: Torreta[],
  receptors: Receptor[],
  _emails: Email[]
): string => {
  const messageType = message.messageType?.toLowerCase();
  switch (messageType) {
    case "torreta":
      const torreta = torretas.find((t) => t.externalId === message.targetId);
      return torreta ? `TOR${torreta.id}` : message.targetId || "Sin torreta";
    case "receptor":
      const receptor = receptors.find((r) => r.externalId === message.targetId);
      return receptor ? `REC${receptor.id}` : message.targetId || "Sin receptor";
    case "email":
      return message.targetId || "Sin email";
    default:
      return message.targetId || "Sin identificador";
  }
};

const getMessageDisplayInfo = (
  message: AlertMessage,
  torretaColors: TorretaColor[]
): { text: string; color?: string } => {
  const messageType = message.messageType?.toLowerCase();
  if (messageType === "torreta") {
    const torretaColor = torretaColors.find(
      (c) => c.deviceColorId === message.color
    );
    return {
      text: torretaColor
        ? `${torretaColor.name} - ${torretaColor.deviceColorId}`
        : message.color || "Sin color",
      color: torretaColor?.htmlColor,
    };
  }
  return {
    text: message.message || "Sin mensaje",
  };
};

export interface MessageCardProps {
  message: AlertMessage;
  torretas: Torreta[];
  receptors: Receptor[];
  emails: Email[];
  torretaColors: TorretaColor[];
  onDelete: (messageId: number) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  torretas,
  receptors,
  emails,
  torretaColors,
  onDelete,
}) => {
  const messageTypeLabel = getMessageTypeLabel(message.messageType);
  const messageIdentifier = getMessageIdentifier(
    message,
    torretas,
    receptors,
    emails
  );
  const displayInfo = getMessageDisplayInfo(message, torretaColors);

  return (
    <div className="bg-slate-700 rounded-lg p-2 flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Punto azul */}
        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />

        {/* Tipo e identificador */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Text className="text-sm font-medium text-slate-100">
            {messageTypeLabel}
          </Text>
          <Text className="text-xs text-slate-400">{messageIdentifier}</Text>
        </div>

        {/* Información adicional */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {message.messageType?.toLowerCase() === "torreta" && displayInfo.color ? (
            <>
              <div
                className="w-4 h-4 rounded flex-shrink-0"
                style={{ backgroundColor: displayInfo.color }}
              />
              <Text
                className="text-xs text-slate-400 truncate"
                color="muted"
                variant="caption"
              >
                {displayInfo.text}
              </Text>
            </>
          ) : (
            <Text
              className="text-xs text-slate-400 truncate"
              color="muted"
              variant="caption"
            >
              {displayInfo.text}
            </Text>
          )}
        </div>
      </div>

      {/* Botón eliminar */}
      <Button
        className="px-3 py-1.5 font-semibold flex-shrink-0"
        color="danger"
        size="md"
        title="Eliminar mensaje"
        variant="solid"
        onPress={() => onDelete(message.id)}
      >
        <FaTrash className="w-4 h-4" />
      </Button>
    </div>
  );
};
