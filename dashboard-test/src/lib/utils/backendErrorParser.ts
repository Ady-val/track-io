import type { FieldErrors } from "react-hook-form";

import {
  getFriendlyErrorMessage,
  mapBackendFieldToFrontend,
} from "../validations/fieldMappings";

import { parseApiError, type ParsedError } from "./errorHandler";

/**
 * Formato de error de validación de NestJS (class-validator)
 */
export interface NestJSValidationError {
  statusCode: number;
  message: string | string[];
  error: string;
}

/**
 * Formato de error de validación con detalles por campo (NestJS ValidationPipe)
 */
export interface NestJSFieldValidationError {
  statusCode: number;
  message: string[];
  error: string;
}

/**
 * Error de API con respuesta estructurada
 */
export interface ApiErrorResponse {
  response?: {
    status?: number;
    data?:
      | NestJSValidationError
      | NestJSFieldValidationError
      | { message?: string; error?: string };
  };
  message?: string;
}

/**
 * Resultado del parsing de errores del backend
 */
export interface BackendErrorParseResult {
  /**
   * Errores mapeados a campos específicos del formulario
   * Útil para react-hook-form setError()
   */
  fieldErrors: FieldErrors;
  /**
   * Errores generales de validación (no asociados a un campo específico)
   */
  validationErrors: string[];
  /**
   * Error del servidor (5xx) o error general
   */
  serverError: string | null;
  /**
   * Información parseada del error
   */
  parsedError: ParsedError;
  /**
   * Indica si es un error de validación (400)
   */
  isValidationError: boolean;
  /**
   * Indica si es un error del servidor (5xx)
   */
  isServerError: boolean;
  /**
   * Indica si es un error de conflicto (409)
   */
  isConflictError: boolean;
}

/**
 * Extrae el nombre del campo de un mensaje de error del backend
 * Ejemplos:
 * - "name must be a string" -> "name"
 * - "areaId must be a positive number" -> "areaId"
 * - "email must be a valid email address" -> "email"
 */
function extractFieldNameFromMessage(message: string): string | null {
  // Patrón común: "fieldName must be..." o "fieldName is required"
  const match = message.match(
    /^([a-zA-Z_][a-zA-Z0-9_]*)\s+(must|is|should|cannot)/i
  );

  if (match?.[1]) {
    return match[1];
  }

  // Patrón alternativo: "fieldName: message"
  const colonMatch = message.match(/^([a-zA-Z_][a-zA-Z0-9_]*):/);

  if (colonMatch?.[1]) {
    return colonMatch[1];
  }

  return null;
}

/**
 * Parsea un mensaje de error del backend y lo mapea a un campo del formulario
 */
function parseFieldError(
  message: string
): { field: string; message: string } | null {
  const fieldName = extractFieldNameFromMessage(message);

  if (!fieldName) {
    return null;
  }

  const frontendField = mapBackendFieldToFrontend(fieldName);
  const friendlyMessage = getFriendlyErrorMessage(message);

  return {
    field: frontendField,
    message: friendlyMessage,
  };
}

/**
 * Parsea errores de validación de NestJS y los mapea a campos del formulario
 */
export function parseBackendValidationErrors(
  error: unknown,
  defaultMessage: string = "Ocurrió un error de validación"
): BackendErrorParseResult {
  const parsedApiError = parseApiError(error, defaultMessage);
  const fieldErrors: FieldErrors = {};
  const validationErrors: string[] = [];
  let serverError: string | null = null;

  // Si es un error del servidor (5xx), no intentar parsear campos
  if (parsedApiError.isServerError) {
    return {
      fieldErrors: {},
      validationErrors: [],
      serverError: parsedApiError.message,
      parsedError: parsedApiError,
      isValidationError: false,
      isServerError: true,
      isConflictError: false,
    };
  }

  // Si es un error de conflicto (409)
  if (parsedApiError.isConflict) {
    return {
      fieldErrors: {},
      validationErrors: [],
      serverError: parsedApiError.message,
      parsedError: parsedApiError,
      isValidationError: false,
      isServerError: false,
      isConflictError: true,
    };
  }

  // Intentar extraer mensajes de validación
  if (error && typeof error === "object" && "response" in error) {
    const apiError = error as ApiErrorResponse;
    const responseData = apiError.response?.data;

    if (responseData && typeof responseData === "object") {
      // Formato NestJS estándar
      if ("message" in responseData) {
        const messages = Array.isArray(responseData.message)
          ? responseData.message
          : [responseData.message];

        messages.forEach((msg) => {
          if (typeof msg === "string") {
            const fieldError = parseFieldError(msg);

            if (fieldError) {
              // Mapear a formato de react-hook-form
              if (!fieldErrors[fieldError.field]) {
                fieldErrors[fieldError.field] = {
                  type: "validation",
                  message: fieldError.message,
                };
              }
            } else {
              // Error general que no se puede mapear a un campo
              validationErrors.push(getFriendlyErrorMessage(msg));
            }
          }
        });
      }
    }
  }

  // Si no se encontraron errores de campo pero hay un error de validación
  if (
    parsedApiError.isValidation &&
    Object.keys(fieldErrors).length === 0 &&
    validationErrors.length === 0
  ) {
    validationErrors.push(parsedApiError.message);
  }

  // Si hay un error general que no es de validación
  if (
    !parsedApiError.isValidation &&
    !parsedApiError.isServerError &&
    !parsedApiError.isConflict
  ) {
    serverError = parsedApiError.message;
  }

  return {
    fieldErrors,
    validationErrors,
    serverError,
    parsedError: parsedApiError,
    isValidationError: parsedApiError.isValidation ?? false,
    isServerError: parsedApiError.isServerError ?? false,
    isConflictError: parsedApiError.isConflict ?? false,
  };
}

/**
 * Aplica errores del backend a un formulario de react-hook-form
 */
export function applyBackendErrorsToForm<T extends Record<string, unknown>>(
  form: {
    setError: (name: keyof T, error: { type: string; message: string }) => void;
    setValue: (name: keyof T, value: unknown) => void;
  },
  parseResult: BackendErrorParseResult
): void {
  // Aplicar errores por campo
  Object.entries(parseResult.fieldErrors).forEach(([field, error]) => {
    if (error && "message" in error && typeof error.message === "string") {
      form.setError(field as keyof T, {
        type: "server",
        message: error.message,
      });
    }
  });
}

/**
 * Obtiene un mensaje de error user-friendly basado en el tipo de error
 */
export function getUserFriendlyErrorTitle(
  parseResult: BackendErrorParseResult
): string {
  if (parseResult.isServerError) {
    return "Error del servidor";
  }
  if (parseResult.isConflictError) {
    return "Conflicto";
  }
  if (parseResult.isValidationError) {
    return "Errores de validación";
  }

  return "Error";
}
