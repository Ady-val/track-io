import type React from "react";

import { FaPlus } from "react-icons/fa6";
import { Button, Input, Select } from "@components/atoms";

import type { NewMessageData } from "@/types/alertRule";
import type { Torreta, Receptor, Email, TorretaColor } from "@/types/escalation";

const MESSAGE_TYPES = [
  { value: "torreta", label: "Torreta" },
  { value: "receptor", label: "Receptor" },
  { value: "email", label: "Email" },
];

const getTextColorForBackground = (backgroundColor: string): string => {
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#ffffff";
};

const getTargetOptions = (
  messageType: string,
  torretas: Torreta[],
  receptors: Receptor[],
  emails: Email[]
) => {
  switch (messageType) {
    case "torreta":
      return Array.isArray(torretas)
        ? torretas
            .filter((t) => t.externalId != null && t.externalId.trim() !== "")
            .map((t) => ({
              value: t.externalId!,
              label: `${t.name} (${t.externalId})`,
            }))
        : [];
    case "receptor":
      return Array.isArray(receptors) && receptors.length > 0
        ? receptors
            .filter((r) => r.externalId != null && r.externalId.trim() !== "")
            .map((r) => ({
              value: r.externalId,
              label: `${r.name} (${r.externalId})`,
            }))
        : [];
    case "email":
      return Array.isArray(emails)
        ? emails.map((e) => ({
            value: e.email,
            label: `${e.name} - ${e.email}`,
          }))
        : [];
    default:
      return [];
  }
};

const isMessageFormValid = (messageData: NewMessageData): boolean => {
  if (!messageData.messageType || !messageData.targetId) {
    return false;
  }
  if (messageData.messageType === "torreta") {
    return !!messageData.color;
  }
  return !!messageData.message && messageData.message.trim().length > 0;
};

export interface MessageFormProps {
  messageData: NewMessageData;
  torretas: Torreta[];
  receptors: Receptor[];
  emails: Email[];
  torretaColors: TorretaColor[];
  onUpdate: (updates: Partial<NewMessageData>) => void;
  onCreate: () => void;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  messageData,
  torretas,
  receptors,
  emails,
  torretaColors,
  onUpdate,
  onCreate,
}) => {
  return (
    <div className="bg-slate-700 rounded-lg p-2">
      <div className="flex items-center space-x-2">
        <Select
          className="w-32"
          value={messageData.messageType ?? ""}
          onChange={(e) =>
            onUpdate({
              messageType: e.target.value as "torreta" | "receptor" | "email",
              targetId: undefined,
              message: undefined,
              color: undefined,
            })
          }
        >
          <option value="">Tipo</option>
          {MESSAGE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>

        {messageData.messageType && (
          <Select
            className="w-48"
            value={messageData.targetId ?? ""}
            onChange={(e) => onUpdate({ targetId: e.target.value })}
          >
            <option value="">Dispositivo</option>
            {getTargetOptions(
              messageData.messageType,
              torretas,
              receptors,
              emails
            ).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        )}

        {messageData.messageType === "torreta" && (
          <Select
            className="w-48"
            value={messageData.color ?? ""}
            onChange={(e) => onUpdate({ color: e.target.value })}
          >
            <option value="">Color</option>
            {Array.isArray(torretaColors) &&
              torretaColors
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((color) => (
                  <option
                    key={color.id}
                    style={{
                      backgroundColor: color.htmlColor,
                      color: getTextColorForBackground(color.htmlColor),
                    }}
                    value={color.deviceColorId}
                  >
                    {color.name} - {color.deviceColorId}
                  </option>
                ))}
          </Select>
        )}

        {messageData.messageType !== "torreta" && (
          <Input
            className="flex-1 min-w-0"
            fullWidth
            placeholder="Mensaje"
            size="md"
            value={messageData.message ?? ""}
            variant="bordered"
            onChange={(e) => onUpdate({ message: e.target.value })}
          />
        )}

        <Button
          className={`flex items-center justify-center w-8 h-8 font-semibold ${
            isMessageFormValid(messageData)
              ? ""
              : "opacity-50 cursor-not-allowed"
          }`}
          color="success"
          disabled={!isMessageFormValid(messageData)}
          size="sm"
          title="Agregar mensaje"
          variant="solid"
          onPress={onCreate}
        >
          <FaPlus className="w-4 h-4 text-white" />
        </Button>
      </div>
    </div>
  );
};
