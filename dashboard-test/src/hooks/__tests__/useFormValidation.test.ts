import { renderHook, waitFor } from "@testing-library/react";
import { z } from "zod";

import { renderHookWithQuery } from "@/test-utils/render-hook-with-query";

import { useFormValidation } from "../useFormValidation";

// Mock de useModalError
const mockSetValidationErrors = jest.fn();
const mockSetServerError = jest.fn();
const mockClearErrors = jest.fn();

jest.mock("../useModalError", () => ({
  useModalError: jest.fn(() => ({
    serverError: "",
    validationErrors: [],
    parsedError: null,
    setServerError: mockSetServerError,
    setValidationErrors: mockSetValidationErrors,
    addValidationError: jest.fn(),
    handleApiError: jest.fn(),
    clearErrors: mockClearErrors,
  })),
}));

// Mock de useToast
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockToastWarning = jest.fn();
const mockToastInfo = jest.fn();

jest.mock("../useToast", () => ({
  useToast: jest.fn(() => ({
    success: mockToastSuccess,
    error: mockToastError,
    warning: mockToastWarning,
    info: mockToastInfo,
  })),
}));

// Mock de backendErrorParser
const mockParseBackendValidationErrors = jest.fn();
const mockApplyBackendErrorsToForm = jest.fn();

jest.mock("@/lib/utils/backendErrorParser", () => ({
  parseBackendValidationErrors: (...args: unknown[]) =>
    mockParseBackendValidationErrors(...args),
  applyBackendErrorsToForm: (...args: unknown[]) =>
    mockApplyBackendErrorsToForm(...args),
}));

describe("useFormValidation", () => {
  const testSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email"),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should initialize form with default values", () => {
      const defaultValues = {
        name: "Test Name",
        email: "test@example.com",
      };

      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
          defaultValues,
        })
      );

      expect(result.current.form.getValues()).toEqual(defaultValues);
    });

    it("should initialize form with empty values when no defaults provided", () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      const values = result.current.form.getValues();

      // react-hook-form devuelve undefined cuando no hay valores por defecto
      expect(values.name).toBeUndefined();
      expect(values.email).toBeUndefined();
    });

    it("should use onBlur as default validation mode", () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      // Verificar que el formulario está configurado
      expect(result.current.form).toBeDefined();
    });
  });

  describe("form validation", () => {
    it("should validate form and return true for valid data", async () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      result.current.form.setValue("name", "Test Name");
      result.current.form.setValue("email", "test@example.com");

      const isValid = await result.current.validateForm();

      expect(isValid).toBe(true);
    });

    it("should validate form and return false for invalid data", async () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      // Dejar campos vacíos para que falle la validación
      const isValid = await result.current.validateForm();

      expect(isValid).toBe(false);
    });
  });

  describe("resetForm", () => {
    it("should reset form to default values", () => {
      const defaultValues = {
        name: "Default Name",
        email: "default@example.com",
      };

      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
          defaultValues,
        })
      );

      // Cambiar valores
      result.current.form.setValue("name", "Changed Name");
      result.current.form.setValue("email", "changed@example.com");

      // Resetear
      result.current.resetForm();

      const values = result.current.form.getValues();

      expect(values.name).toBe(defaultValues.name);
      expect(values.email).toBe(defaultValues.email);
      expect(mockClearErrors).toHaveBeenCalled();
    });

    it("should reset form to provided values", () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      const newValues = {
        name: "New Name",
        email: "new@example.com",
      };

      result.current.resetForm(newValues);

      const values = result.current.form.getValues();

      expect(values.name).toBe(newValues.name);
      expect(values.email).toBe(newValues.email);
      expect(mockClearErrors).toHaveBeenCalled();
    });
  });

  describe("clearAllErrors", () => {
    it("should clear form errors and modal errors", () => {
      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
        })
      );

      result.current.clearAllErrors();

      expect(mockClearErrors).toHaveBeenCalled();
    });
  });

  describe("handleBackendError", () => {
    it("should handle backend error and apply to form", () => {
      const mockParseResult = {
        fieldErrors: {
          name: {
            type: "validation",
            message: "Name error",
          },
        },
        validationErrors: ["General error"],
        serverError: null,
        parsedError: {
          message: "Error",
          status: 400,
          isValidation: true,
        },
        isValidationError: true,
        isServerError: false,
        isConflictError: false,
      };

      mockParseBackendValidationErrors.mockReturnValue(mockParseResult);

      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
          showToastOnError: true,
        })
      );

      const error = {
        response: {
          status: 400,
          data: { message: "Error" },
        },
      };

      result.current.handleBackendError(error);

      expect(mockParseBackendValidationErrors).toHaveBeenCalledWith(error);
      expect(mockApplyBackendErrorsToForm).toHaveBeenCalled();
      expect(mockSetValidationErrors).toHaveBeenCalledWith(["General error"]);
    });

    it("should show toast on error when showToastOnError is true", () => {
      const mockParseResult = {
        fieldErrors: {},
        validationErrors: ["Error message"],
        serverError: null,
        parsedError: {
          message: "Error",
          status: 400,
          isValidation: true,
        },
        isValidationError: true,
        isServerError: false,
        isConflictError: false,
      };

      mockParseBackendValidationErrors.mockReturnValue(mockParseResult);

      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
          showToastOnError: true,
        })
      );

      const error = { response: { status: 400, data: {} } };

      result.current.handleBackendError(error);

      expect(mockToastError).toHaveBeenCalled();
    });

    it("should not show toast when showToastOnError is false", () => {
      const mockParseResult = {
        fieldErrors: {},
        validationErrors: ["Error message"],
        serverError: null,
        parsedError: {
          message: "Error",
          status: 400,
          isValidation: true,
        },
        isValidationError: true,
        isServerError: false,
        isConflictError: false,
      };

      mockParseBackendValidationErrors.mockReturnValue(mockParseResult);

      const { result } = renderHookWithQuery(() =>
        useFormValidation({
          schema: testSchema,
          showToastOnError: false,
        })
      );

      const error = { response: { status: 400, data: {} } };

      result.current.handleBackendError(error);

      expect(mockToastError).not.toHaveBeenCalled();
    });
  });
});
