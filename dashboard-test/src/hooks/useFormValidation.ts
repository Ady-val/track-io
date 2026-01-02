import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import type { FieldErrors, UseFormReturn } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import {
  applyBackendErrorsToForm,
  parseBackendValidationErrors,
} from "@/lib/utils/backendErrorParser";
import { useModalError } from "./useModalError";
import { useToast } from "./useToast";

/**
 * Opciones para el hook useFormValidation
 */
export interface UseFormValidationOptions<T extends z.ZodType> {
  /**
   * Esquema Zod para validación
   */
  schema: T;
  /**
   * Valores por defecto del formulario
   */
  defaultValues?: Partial<z.infer<T>>;
  /**
   * Modo de validación de react-hook-form
   * @default "onBlur"
   */
  mode?: "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all";
  /**
   * Si es true, muestra toast notifications automáticamente
   * @default true
   */
  showToastOnError?: boolean;
  /**
   * Si es true, muestra toast notifications en éxito
   * @default false
   */
  showToastOnSuccess?: boolean;
  /**
   * Mensaje de éxito personalizado
   */
  successMessage?: string;
}

/**
 * Resultado del hook useFormValidation
 */
export interface UseFormValidationResult<T extends z.ZodType> {
  /**
   * Instancia de react-hook-form
   */
  form: UseFormReturn<z.infer<T>>;
  /**
   * Hook de manejo de errores del modal
   */
  modalError: ReturnType<typeof useModalError>;
  /**
   * Hook de toast notifications
   */
  toast: ReturnType<typeof useToast>;
  /**
   * Maneja errores del backend y los aplica al formulario
   */
  handleBackendError: (error: unknown) => void;
  /**
   * Limpia todos los errores (formulario y modal)
   */
  clearAllErrors: () => void;
  /**
   * Valida el formulario manualmente
   */
  validateForm: () => Promise<boolean>;
  /**
   * Resetea el formulario y limpia errores
   */
  resetForm: (values?: Partial<z.infer<T>>) => void;
}

/**
 * Hook unificado que combina react-hook-form, Zod y useModalError
 * Proporciona una API simple para manejar formularios con validación y errores
 */
export function useFormValidation<T extends z.ZodType>(
  options: UseFormValidationOptions<T>
): UseFormValidationResult<T> {
  const {
    schema,
    defaultValues,
    mode = "onBlur",
    showToastOnError = true,
    showToastOnSuccess = false,
    successMessage,
  } = options;

  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues as z.infer<T>,
    mode,
  });

  const modalError = useModalError();
  const toast = useToast();

  /**
   * Maneja errores del backend y los aplica al formulario
   */
  const handleBackendError = useCallback(
    (error: unknown) => {
      const parseResult = parseBackendValidationErrors(error);

      // Aplicar errores a campos específicos del formulario
      applyBackendErrorsToForm(form, parseResult);

      // Mostrar errores de validación generales
      if (parseResult.validationErrors.length > 0) {
        modalError.setValidationErrors(parseResult.validationErrors);
      }

      // Mostrar error del servidor
      if (parseResult.serverError) {
        modalError.setServerError(parseResult.serverError);
      }

      // Mostrar toast si está habilitado
      if (showToastOnError) {
        if (parseResult.isServerError) {
          toast.error(parseResult.serverError || "Error del servidor");
        } else if (parseResult.validationErrors.length > 0) {
          toast.error(parseResult.validationErrors[0]);
        } else if (parseResult.serverError) {
          toast.error(parseResult.serverError);
        }
      }
    },
    [form, modalError, toast, showToastOnError]
  );

  /**
   * Limpia todos los errores
   */
  const clearAllErrors = useCallback(() => {
    form.clearErrors();
    modalError.clearErrors();
  }, [form, modalError]);

  /**
   * Valida el formulario manualmente
   */
  const validateForm = useCallback(async (): Promise<boolean> => {
    const isValid = await form.trigger();

    return isValid;
  }, [form]);

  /**
   * Resetea el formulario y limpia errores
   */
  const resetForm = useCallback(
    (values?: Partial<z.infer<T>>) => {
      form.reset(values as z.infer<T>);
      clearAllErrors();
    },
    [form, clearAllErrors]
  );

  /**
   * Limpiar errores cuando el formulario se resetea
   */
  useEffect(() => {
    const subscription = form.watch(() => {
      // Limpiar errores de validación cuando el usuario empieza a escribir
      if (modalError.validationErrors.length > 0) {
        modalError.setValidationErrors([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, modalError]);

  /**
   * Función helper para mostrar éxito
   */
  const showSuccess = useCallback(() => {
    if (showToastOnSuccess) {
      toast.success(successMessage || "Operación realizada con éxito");
    }
  }, [toast, showToastOnSuccess, successMessage]);

  return {
    form,
    modalError,
    toast: {
      ...toast,
      success: showToastOnSuccess ? showSuccess : toast.success,
    },
    handleBackendError,
    clearAllErrors,
    validateForm,
    resetForm,
  };
}
