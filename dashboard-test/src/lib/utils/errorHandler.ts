/**
 * Utility functions for handling API errors in a consistent way
 */

export interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
      error?: string;
    };
  };
  message?: string;
}

export interface ParsedError {
  message: string;
  status?: number;
  isConflict?: boolean;
  isValidation?: boolean;
  isNotFound?: boolean;
  isServerError?: boolean;
}

/**
 * Parses API errors and extracts meaningful information
 * @param error - The error object from API calls
 * @param defaultMessage - Default message if no message can be extracted
 * @returns Parsed error information
 */
export function parseApiError(
  error: unknown,
  defaultMessage: string = "Ocurrió un error inesperado. Por favor, intenta nuevamente."
): ParsedError {
  if (typeof error === "string") {
    return {
      message: error,
    };
  }

  if (error && typeof error === "object" && "message" in error) {
    const errorWithMessage = error as { message: string };

    return {
      message: errorWithMessage.message,
    };
  }

  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as ApiError;
    const status = apiError.response?.status;

    let serverMessage = apiError.response?.data?.message ?? apiError.response?.data?.error;

    if (!serverMessage && "message" in apiError) {
      const errorMessage = (apiError as { message: string }).message;

      if (status) {
        switch (status) {
          case 409:
            serverMessage = errorMessage.includes("409")
              ? "El recurso que intentas crear ya existe."
              : errorMessage;
            break;
          case 400:
            serverMessage = "Los datos proporcionados no son válidos.";
            break;
          case 404:
            serverMessage = "El recurso no fue encontrado.";
            break;
          default:
            serverMessage = errorMessage;
        }
      } else {
        serverMessage = errorMessage;
      }
    }

    return {
      message: serverMessage ?? defaultMessage,
      status,
      isConflict: status === 409,
      isValidation: status === 400,
      isNotFound: status === 404,
      isServerError: status !== undefined && status >= 500,
    };
  }

  return {
    message: defaultMessage,
  };
}

/**
 * Extracts error message from various error types
 * @param error - The error object
 * @param defaultMessage - Default message if extraction fails
 * @returns Error message string
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string = "Ocurrió un error inesperado."
): string {
  return parseApiError(error, defaultMessage).message;
}

/**
 * Checks if error is a conflict (409)
 */
export function isConflictError(error: unknown): boolean {
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as ApiError;

    return apiError.response?.status === 409;
  }

  return false;
}

/**
 * Checks if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as ApiError;

    return apiError.response?.status === 400;
  }

  return false;
}

/**
 * Gets user-friendly message based on error status
 */
export function getUserFriendlyMessage(error: unknown): string {
  const parsed = parseApiError(error);

  if (parsed.isConflict) {
    return "El recurso que intentas crear ya existe.";
  }

  if (parsed.isValidation) {
    return "Los datos proporcionados no son válidos.";
  }

  if (parsed.isNotFound) {
    return "El recurso no fue encontrado.";
  }

  if (parsed.isServerError) {
    return "Error en el servidor. Por favor, intenta nuevamente más tarde.";
  }

  return parsed.message;
}

