import type React from "react";
import { Text } from "@components/atoms";

export interface ConnectionIndicatorProps {
  isConnected: boolean;
  connectedText?: string;
  disconnectedText?: string;
  size?: "sm" | "md";
}

export const ConnectionIndicator: React.FC<ConnectionIndicatorProps> = ({
  isConnected,
  connectedText = "Conexión Activa",
  disconnectedText = "Desconectado",
  size = "sm",
}) => {
  const dotSize = size === "sm" ? "w-2 h-2" : "w-3 h-3";
  const textVariant = size === "sm" ? "small" : "caption";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dotSize} rounded-full ${
          isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
        }`}
      />
      <Text color="secondary" variant={textVariant}>
        {isConnected ? connectedText : disconnectedText}
      </Text>
    </div>
  );
};
