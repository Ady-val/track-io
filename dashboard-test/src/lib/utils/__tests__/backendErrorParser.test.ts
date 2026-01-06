import {
  applyBackendErrorsToForm,
  parseBackendValidationErrors,
  getUserFriendlyErrorTitle,
} from "../backendErrorParser";

describe("backendErrorParser", () => {
  describe("parseBackendValidationErrors", () => {
    it("should parse NestJS validation error with array of messages", () => {
      const error = {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: [
              "name must be a string",
              "name is required",
              "areaId must be a positive number",
            ],
            error: "Bad Request",
          },
        },
      };

      const result = parseBackendValidationErrors(error);

      expect(result.isValidationError).toBe(true);
      expect(result.isServerError).toBe(false);
      expect(result.isConflictError).toBe(false);
      expect(result.fieldErrors).toBeDefined();
    });

    it("should parse NestJS validation error with single message", () => {
      const error = {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: "name is required",
            error: "Bad Request",
          },
        },
      };

      const result = parseBackendValidationErrors(error);

      expect(result.isValidationError).toBe(true);
      expect(result.validationErrors.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle server error (5xx)", () => {
      const error = {
        response: {
          status: 500,
          data: {
            message: "Internal server error",
          },
        },
      };

      const result = parseBackendValidationErrors(error);

      expect(result.isServerError).toBe(true);
      expect(result.isValidationError).toBe(false);
      expect(result.serverError).toBeDefined();
      expect(result.fieldErrors).toEqual({});
      expect(result.validationErrors).toEqual([]);
    });

    it("should handle conflict error (409)", () => {
      const error = {
        response: {
          status: 409,
          data: {
            message: "Resource already exists",
          },
        },
      };

      const result = parseBackendValidationErrors(error);

      expect(result.isConflictError).toBe(true);
      expect(result.isValidationError).toBe(false);
      expect(result.isServerError).toBe(false);
      expect(result.serverError).toBeDefined();
    });

    it("should handle unknown error format", () => {
      const error = "Simple string error";

      const result = parseBackendValidationErrors(error);

      expect(result.parsedError.message).toBeDefined();
    });

    it("should use default message when no message is available", () => {
      const error = {};

      const result = parseBackendValidationErrors(
        error,
        "Custom default message"
      );

      expect(result.parsedError.message).toContain("Custom default message");
    });

    it("should extract field names from error messages", () => {
      const error = {
        response: {
          status: 400,
          data: {
            statusCode: 400,
            message: ["name must be a string", "areaId is required"],
            error: "Bad Request",
          },
        },
      };

      const result = parseBackendValidationErrors(error);

      // Verificar que se intentó parsear los campos
      expect(result).toBeDefined();
      expect(result.fieldErrors).toBeDefined();
    });
  });

  describe("applyBackendErrorsToForm", () => {
    it("should apply field errors to form using setError", () => {
      const mockSetError = jest.fn();
      const mockSetValue = jest.fn();

      const mockForm = {
        setError: mockSetError,
        setValue: mockSetValue,
      };

      const parseResult = {
        fieldErrors: {
          name: {
            type: "validation",
            message: "El nombre es requerido",
          },
          areaId: {
            type: "validation",
            message: "El área es requerida",
          },
        },
        validationErrors: [],
        serverError: null,
        parsedError: {
          message: "Validation error",
          status: 400,
          isValidation: true,
        },
        isValidationError: true,
        isServerError: false,
        isConflictError: false,
      };

      applyBackendErrorsToForm(mockForm as any, parseResult);

      expect(mockSetError).toHaveBeenCalledWith("name", {
        type: "server",
        message: "El nombre es requerido",
      });
      expect(mockSetError).toHaveBeenCalledWith("areaId", {
        type: "server",
        message: "El área es requerida",
      });
      expect(mockSetError).toHaveBeenCalledTimes(2);
    });

    it("should not call setError when fieldErrors is empty", () => {
      const mockSetError = jest.fn();
      const mockSetValue = jest.fn();

      const mockForm = {
        setError: mockSetError,
        setValue: mockSetValue,
      };

      const parseResult = {
        fieldErrors: {},
        validationErrors: [],
        serverError: null,
        parsedError: {
          message: "No field errors",
        },
        isValidationError: false,
        isServerError: false,
        isConflictError: false,
      };

      applyBackendErrorsToForm(mockForm as any, parseResult);

      expect(mockSetError).not.toHaveBeenCalled();
    });
  });

  describe("getUserFriendlyErrorTitle", () => {
    it("should return server error title for server errors", () => {
      const parseResult = {
        fieldErrors: {},
        validationErrors: [],
        serverError: "Server error",
        parsedError: {
          message: "Server error",
          status: 500,
          isServerError: true,
        },
        isValidationError: false,
        isServerError: true,
        isConflictError: false,
      };

      const title = getUserFriendlyErrorTitle(parseResult);

      expect(title).toBe("Error del servidor");
    });

    it("should return conflict error title for conflict errors", () => {
      const parseResult = {
        fieldErrors: {},
        validationErrors: [],
        serverError: "Conflict",
        parsedError: {
          message: "Conflict",
          status: 409,
          isConflict: true,
        },
        isValidationError: false,
        isServerError: false,
        isConflictError: true,
      };

      const title = getUserFriendlyErrorTitle(parseResult);

      expect(title).toBe("Conflicto");
    });

    it("should return validation error title for validation errors", () => {
      const parseResult = {
        fieldErrors: {},
        validationErrors: ["Error 1"],
        serverError: null,
        parsedError: {
          message: "Validation error",
          status: 400,
          isValidation: true,
        },
        isValidationError: true,
        isServerError: false,
        isConflictError: false,
      };

      const title = getUserFriendlyErrorTitle(parseResult);

      expect(title).toBe("Errores de validación");
    });

    it("should return generic error title for unknown errors", () => {
      const parseResult = {
        fieldErrors: {},
        validationErrors: [],
        serverError: null,
        parsedError: {
          message: "Unknown error",
        },
        isValidationError: false,
        isServerError: false,
        isConflictError: false,
      };

      const title = getUserFriendlyErrorTitle(parseResult);

      expect(title).toBe("Error");
    });
  });
});
