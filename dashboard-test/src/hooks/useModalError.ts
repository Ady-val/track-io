import { useState, useCallback } from "react";

import {
  parseApiError,
  extractErrorMessage,
  type ParsedError,
} from "@/lib/utils/errorHandler";

export interface UseModalErrorReturn {
  serverError: string;
  validationErrors: string[];
  setServerError: (error: string) => void;
  setValidationErrors: (errors: string[]) => void;
  addValidationError: (error: string) => void;
  handleApiError: (error: unknown, defaultMessage?: string) => void;
  clearErrors: () => void;
  parsedError: ParsedError | null;
}

/**
 * Hook for managing modal errors consistently
 * Provides state and utilities for handling API errors and validation errors
 */
export function useModalError(defaultServerMessage?: string): UseModalErrorReturn {
  const [serverError, setServerError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedError, setParsedError] = useState<ParsedError | null>(null);

  /**
   * Adds a single validation error
   */
  const addValidationError = useCallback((error: string) => {
    setValidationErrors((prev) => [...prev, error]);
  }, []);

  /**
   * Handles API errors by parsing and setting appropriate error messages
   */
  const handleApiError = useCallback(
    (error: unknown, customDefaultMessage?: string) => {
      const defaultMessage =
        customDefaultMessage ?? defaultServerMessage ?? "Ocurrió un error inesperado.";
      const parsed = parseApiError(error, defaultMessage);

      setParsedError(parsed);
      setServerError(parsed.message);

      // Log for debugging
      console.error("API Error:", error);
    },
    [defaultServerMessage]
  );

  /**
   * Clears all errors
   */
  const clearErrors = useCallback(() => {
    setServerError("");
    setValidationErrors([]);
    setParsedError(null);
  }, []);

  return {
    serverError,
    validationErrors,
    setServerError,
    setValidationErrors,
    addValidationError,
    handleApiError,
    clearErrors,
    parsedError,
  };
}

/**
 * Hook specifically for handling errors in create/update operations
 */
export function useFormErrorHandling<T>(
  onSuccess?: (data: T) => void,
  onError?: (error: unknown) => void
) {
  const errorHandling = useModalError();

  const handleSubmit = useCallback(
    async (submitFn: () => Promise<T>) => {
      try {
        errorHandling.clearErrors();
        const data = await submitFn();
        onSuccess?.(data);

        return data;
      } catch (error) {
        errorHandling.handleApiError(error);
        onError?.(error);

        throw error;
      }
    },
    [errorHandling, onSuccess, onError]
  );

  return {
    ...errorHandling,
    handleSubmit,
  };
}

