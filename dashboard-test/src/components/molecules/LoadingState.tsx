import type React from "react";

import { Spinner, Text } from "@components/atoms";

export interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Cargando...",
  size = "lg",
}) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <Spinner color="primary" size={size} />
        <Text color="muted" variant="body">
          {message}
        </Text>
      </div>
    </div>
  );
};
