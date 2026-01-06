import type { FieldValues, UseFormReturn } from "react-hook-form";
import type { z } from "zod";

import { useCallback, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  parseBackendValidationErrors,
  applyBackendErrorsToForm,
} from "@/lib/utils/backendErrorParser";

import { useModalError } from "./useModalError";
import { useToast } from "./useToast";

/**
 * Tipo helper para restringir esquemas Zod cuyo output sea compatible con FieldValues
 * Permite cualquier schema Zod válido - en tiempo de ejecución todos los schemas de formularios
 * producen objetos compatibles con FieldValues
 */
type ZodSchemaWithFieldValues = z.ZodTypeAny;

/**
 * Opciones para el hook useFormValidation
 */
export interface UseFormValidationOptions<
  TSchema extends ZodSchemaWithFieldValues,
> {
  /**
   * Esquema Zod para validación
   */
  schema: TSchema;
  /**
   * Valores por defecto del formulario
   */
  defaultValues?: Partial<z.infer<TSchema>>;
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
export interface UseFormValidationResult<
  TSchema extends ZodSchemaWithFieldValues,
> {
  /**
   * Instancia de react-hook-form
   */
  form: UseFormReturn<z.infer<TSchema> & FieldValues>;
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
  resetForm: (values?: Partial<z.infer<TSchema>>) => void;
}

/**
 * Hook unificado que combina react-hook-form, Zod y useModalError
 * Proporciona una API simple para manejar formularios con validación y errores
 */
export function useFormValidation<TSchema extends ZodSchemaWithFieldValues>(
  options: UseFormValidationOptions<TSchema>
): UseFormValidationResult<TSchema> {
  const {
    schema,
    defaultValues,
    mode = "onBlur",
    showToastOnError = true,
    showToastOnSuccess = false,
    successMessage,
  } = options;

  type FormType = z.infer<TSchema> & FieldValues;

  const form = useForm<FormType, unknown, FormType>({
    // @ts-expect-error - zodResolver acepta cualquier schema Zod válido en tiempo de ejecución.
    // TypeScript no puede inferir correctamente los tipos genéricos complejos de Zod,
    // pero sabemos que el schema es compatible porque todos los schemas de formularios
    // producen objetos que son compatibles con FieldValues.
    resolver: zodResolver(schema),
    // @ts-expect-error - defaultValues es Partial<z.infer<TSchema>> que es compatible
    // con DeepPartial<FormType> que espera useForm, pero TypeScript no puede inferirlo correctamente.
    defaultValues,
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

      applyBackendErrorsToForm(form as any, parseResult);

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
          toast.error(parseResult.validationErrors[0] || "Error de validación");
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
    (values?: Partial<z.infer<TSchema>>) => {
      form.reset(values as FormType);
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
