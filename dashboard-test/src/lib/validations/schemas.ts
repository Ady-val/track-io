import { z } from "zod";

/**
 * Esquemas de validación Zod sincronizados con los DTOs del backend-receptor
 * Estos esquemas reflejan exactamente las reglas de validación de class-validator
 */

// ============================================================================
// Device Schemas
// ============================================================================

export const createDeviceSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  areaId: z.number().positive("El ID del área debe ser un número positivo"),
  externalId: z.string().min(1, "El External ID no puede estar vacío"),
  isVirtualDevice: z.boolean().optional(),
});

export const updateDeviceSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  areaId: z
    .number()
    .positive("El ID del área debe ser un número positivo")
    .optional(),
  externalId: z
    .string()
    .min(1, "El External ID no puede estar vacío")
    .optional(),
  isVirtualDevice: z.boolean().optional(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceSchema>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceSchema>;

// ============================================================================
// Device Signal Schemas
// ============================================================================

export const createDeviceSignalSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  deviceId: z
    .number()
    .positive("El ID del dispositivo debe ser un número positivo"),
  departmentId: z
    .number()
    .positive("El ID del departamento debe ser un número positivo"),
  externalValueId: z
    .string()
    .min(1, "El External Value ID no puede estar vacío"),
});

export const updateDeviceSignalSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  deviceId: z
    .number()
    .positive("El ID del dispositivo debe ser un número positivo")
    .optional(),
  departmentId: z
    .number()
    .positive("El ID del departamento debe ser un número positivo")
    .optional(),
  externalValueId: z
    .string()
    .min(1, "El External Value ID no puede estar vacío")
    .optional(),
});

export type CreateDeviceSignalInput = z.infer<typeof createDeviceSignalSchema>;
export type UpdateDeviceSignalInput = z.infer<typeof updateDeviceSignalSchema>;

// ============================================================================
// User Schemas
// ============================================================================

export const createUserSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(255, "El nombre de usuario no puede exceder 255 caracteres"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(255, "La contraseña no puede exceder 255 caracteres"),
  roleIds: z.array(z.number().positive()).optional(),
});

export const updateUserSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .optional(),
  username: z
    .string()
    .min(3, "El nombre de usuario debe tener al menos 3 caracteres")
    .max(255, "El nombre de usuario no puede exceder 255 caracteres")
    .optional(),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(255, "La contraseña no puede exceder 255 caracteres")
    .optional(),
  roleIds: z.array(z.number().positive()).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

// ============================================================================
// Dashboard Measurement (with Measurement) Schemas
// ============================================================================

const measurementTypeEnum = z.enum([
  "temperature",
  "humidity",
  "pressure",
  "level",
  "flow",
  "vibration",
  "status",
]);

export const createDashboardMeasurementWithMeasurementSchema = z
  .object({
    externalId: z.string().min(1, "El External ID no puede estar vacío"),
    name: z.string().min(1, "El nombre no puede estar vacío"),
    type: measurementTypeEnum,
    groupId: z.number().int().positive().nullable().optional(),
    minValue: z.number({
      required_error: "El valor mínimo es requerido",
      invalid_type_error: "El valor mínimo debe ser un número",
    }),
    maxValue: z.number({
      required_error: "El valor máximo es requerido",
      invalid_type_error: "El valor máximo debe ser un número",
    }),
  })
  .refine((data) => data.minValue < data.maxValue, {
    message: "El valor mínimo debe ser menor que el valor máximo",
    path: ["minValue"],
  });

export const updateDashboardMeasurementWithMeasurementSchema = z
  .object({
    externalId: z.string().min(1, "El External ID no puede estar vacío").optional(),
    name: z.string().min(1, "El nombre no puede estar vacío").optional(),
    type: measurementTypeEnum.optional(),
    groupId: z.number().int().positive().nullable().optional(),
    minValue: z
      .number({
        required_error: "El valor mínimo es requerido",
        invalid_type_error: "El valor mínimo debe ser un número",
      })
      .optional(),
    maxValue: z
      .number({
        required_error: "El valor máximo es requerido",
        invalid_type_error: "El valor máximo debe ser un número",
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.minValue === undefined ||
      data.maxValue === undefined ||
      data.minValue < data.maxValue,
    {
      message: "El valor mínimo debe ser menor que el valor máximo",
      path: ["minValue"],
    }
  );

// ============================================================================
// Email Schemas
// ============================================================================

export const createEmailSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  email: z
    .string()
    .email("Debe ser un correo electrónico válido")
    .min(1, "El correo electrónico no puede estar vacío"),
});

export const updateEmailSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  email: z
    .string()
    .email("Debe ser un correo electrónico válido")
    .min(1, "El correo electrónico no puede estar vacío")
    .optional(),
});

export type CreateEmailInput = z.infer<typeof createEmailSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;

// ============================================================================
// Area Schemas
// ============================================================================

export const createAreaSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
});

export const updateAreaSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
});

export type CreateAreaInput = z.infer<typeof createAreaSchema>;
export type UpdateAreaInput = z.infer<typeof updateAreaSchema>;

// ============================================================================
// Department Schemas
// ============================================================================

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  htmlColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "El color debe ser un código hexadecimal válido (ej: #FF0000)",
    })
    .optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  htmlColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "El color debe ser un código hexadecimal válido (ej: #FF0000)",
    })
    .optional(),
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;

// ============================================================================
// Torreta Schemas
// ============================================================================

export const createTorretaSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  externalId: z
    .string()
    .max(255, "El External ID no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

export const updateTorretaSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .optional(),
  description: z
    .string()
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  externalId: z
    .string()
    .max(255, "El External ID no puede exceder 255 caracteres")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type CreateTorretaInput = z.infer<typeof createTorretaSchema>;
export type UpdateTorretaInput = z.infer<typeof updateTorretaSchema>;

// ============================================================================
// Torreta Color Schemas
// ============================================================================

export const createTorretaColorSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(100, "El nombre no puede exceder 100 caracteres"),
  htmlColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, {
    message: "El color debe ser un código hexadecimal válido (ej: #FF0000)",
  }),
  deviceColorId: z
    .string()
    .min(1, "El ID del dispositivo no puede estar vacío")
    .max(10, "El ID del dispositivo no puede exceder 10 caracteres"),
});

export const updateTorretaColorSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .optional(),
  htmlColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, {
      message: "El color debe ser un código hexadecimal válido (ej: #FF0000)",
    })
    .optional(),
  deviceColorId: z
    .string()
    .min(1, "El ID del dispositivo no puede estar vacío")
    .max(10, "El ID del dispositivo no puede exceder 10 caracteres")
    .optional(),
});

export type CreateTorretaColorInput = z.infer<typeof createTorretaColorSchema>;
export type UpdateTorretaColorInput = z.infer<typeof updateTorretaColorSchema>;

// ============================================================================
// Receptor Schemas
// ============================================================================

export const createReceptorSchema = z.object({
  externalId: z
    .string()
    .min(1, "El ID externo no puede estar vacío")
    .max(255, "El ID externo no puede exceder 255 caracteres"),
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  isActive: z.boolean().optional(),
});

export const updateReceptorSchema = z.object({
  externalId: z
    .string()
    .min(1, "El ID externo no puede estar vacío")
    .max(255, "El ID externo no puede exceder 255 caracteres")
    .optional(),
  name: z
    .string()
    .min(1, "El nombre no puede estar vacío")
    .max(255, "El nombre no puede exceder 255 caracteres")
    .optional(),
  isActive: z.boolean().optional(),
});

export type CreateReceptorInput = z.infer<typeof createReceptorSchema>;
export type UpdateReceptorInput = z.infer<typeof updateReceptorSchema>;

// ============================================================================
// Role Schemas
// ============================================================================

export const createRoleSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;

// ============================================================================
// Measurement Schemas
// ============================================================================

export const createMeasurementSchema = z.object({
  externalId: z.string().min(1, "El External ID no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  type: z.enum(["analog", "digital", "counter"], {
    message: "El tipo debe ser: analog, digital o counter",
  }),
});

export const updateMeasurementSchema = z.object({
  externalId: z
    .string()
    .min(1, "El External ID no puede estar vacío")
    .optional(),
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  type: z
    .enum(["analog", "digital", "counter"], {
      message: "El tipo debe ser: analog, digital o counter",
    })
    .optional(),
});

export type CreateMeasurementInput = z.infer<typeof createMeasurementSchema>;
export type UpdateMeasurementInput = z.infer<typeof updateMeasurementSchema>;

// ============================================================================
// Alert Rule Schemas
// ============================================================================

export const alertRuleModeSchema = z.enum(["setpoint", "window"], {
  message: "El modo debe ser: setpoint o window",
});

export const createAlertRuleSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre no puede estar vacío")
      .max(255, "El nombre no puede exceder 255 caracteres"),
    measurementId: z
      .number()
      .int("El measurement ID debe ser un número entero"),
    mode: alertRuleModeSchema,
    operator: z.string().optional(),
    setpoint: z.number().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "setpoint") {
        return (
          data.operator !== undefined &&
          data.operator !== "" &&
          data.setpoint !== undefined
        );
      }

      return true;
    },
    {
      message: "Para modo setpoint, el operador y el setpoint son requeridos",
      path: ["setpoint"],
    }
  )
  .refine(
    (data) => {
      if (data.mode === "window") {
        return data.minValue !== undefined && data.maxValue !== undefined;
      }

      return true;
    },
    {
      message: "Para modo window, los valores mínimo y máximo son requeridos",
      path: ["minValue"],
    }
  )
  .refine(
    (data) => {
      if (
        data.mode === "window" &&
        data.minValue !== undefined &&
        data.maxValue !== undefined
      ) {
        return data.minValue < data.maxValue;
      }

      return true;
    },
    {
      message: "El valor mínimo debe ser menor que el máximo",
      path: ["maxValue"],
    }
  );

export const updateAlertRuleSchema = z
  .object({
    name: z
      .string()
      .min(1, "El nombre no puede estar vacío")
      .max(255, "El nombre no puede exceder 255 caracteres")
      .optional(),
    measurementId: z
      .number()
      .int("El measurement ID debe ser un número entero")
      .optional(),
    mode: alertRuleModeSchema.optional(),
    operator: z.string().optional(),
    setpoint: z.number().optional(),
    minValue: z.number().optional(),
    maxValue: z.number().optional(),
    enabled: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.mode === "setpoint" && data.operator !== undefined) {
        return data.setpoint !== undefined;
      }

      return true;
    },
    {
      message: "Para modo setpoint, el setpoint es requerido",
      path: ["setpoint"],
    }
  )
  .refine(
    (data) => {
      if (data.mode === "window") {
        return data.minValue !== undefined && data.maxValue !== undefined;
      }

      return true;
    },
    {
      message: "Para modo window, los valores mínimo y máximo son requeridos",
      path: ["minValue"],
    }
  );

export type CreateAlertRuleInput = z.infer<typeof createAlertRuleSchema>;
export type UpdateAlertRuleInput = z.infer<typeof updateAlertRuleSchema>;

// ============================================================================
// Dashboard Measurement Group Schemas
// ============================================================================

export const dashboardMeasurementItemSchema = z.object({
  dashboardMeasurementId: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe ser un número positivo"),
});

export const createDashboardMeasurementGroupSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  dashboardMeasurements: z
    .array(dashboardMeasurementItemSchema)
    .min(1, "Debes seleccionar al menos un dashboard measurement"),
  chartTimeRange: z
    .number()
    .int()
    .refine((val) => [1, 10, 30, 60, 120, 240, 480].includes(val), {
      message:
        "El tiempo del eje X debe ser uno de: 1, 10, 30, 60, 120, 240, 480 minutos",
    })
    .optional(),
  chartMinValue: z.number().optional(),
  chartMaxValue: z.number().optional(),
  chartMeasurementIds: z.array(z.number().int().positive()).optional(),
});

export const updateDashboardMeasurementGroupSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  dashboardMeasurements: z
    .array(dashboardMeasurementItemSchema)
    .min(1, "Debes seleccionar al menos un dashboard measurement")
    .optional(),
  chartTimeRange: z
    .union([z.number().int(), z.null(), z.undefined()])
    .refine(
      (val) =>
        val === undefined ||
        val === null ||
        [1, 10, 30, 60, 120, 240, 480].includes(val),
      {
        message:
          "El tiempo del eje X debe ser uno de: 1, 10, 30, 60, 120, 240, 480 minutos",
      }
    )
    .transform((val) => (val === null ? undefined : val))
    .optional(),
  chartMinValue: z.union([z.number(), z.null()]).optional(),
  chartMaxValue: z.union([z.number(), z.null()]).optional(),
  chartMeasurementIds: z
    .union([z.array(z.number().int().positive()), z.null()])
    .optional(),
});

export type CreateDashboardMeasurementGroupInput = z.infer<
  typeof createDashboardMeasurementGroupSchema
>;
export type UpdateDashboardMeasurementGroupInput = z.infer<
  typeof updateDashboardMeasurementGroupSchema
>;

// ============================================================================
// Device with Signals Schema (for CreateDeviceWithSignalsModal)
// ============================================================================

const signalFormSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío"),
  externalValueId: z
    .string()
    .min(1, "El External Value ID no puede estar vacío"),
  departmentId: z
    .string()
    .min(1, "Debes seleccionar un departamento")
    .transform((val) => Number(val)),
});

export const createDeviceWithSignalsSchema = z
  .object({
    name: z.string().min(1, "El nombre no puede estar vacío"),
    externalId: z.string().min(1, "El External ID no puede estar vacío"),
    areaId: z
      .string()
      .min(1, "Debes seleccionar un área")
      .transform((val) => Number(val)),
    isVirtualDevice: z.boolean().optional(),
    signals: z
      .array(signalFormSchema)
      .min(1, "Debes agregar al menos una señal"),
  })
  .refine(
    (data) => {
      const names = data.signals.map((s) => s.name.trim().toLowerCase());
      const uniqueNames = new Set(names);

      return names.length === uniqueNames.size;
    },
    {
      message: "No se pueden repetir nombres entre señales",
      path: ["signals"],
    }
  )
  .refine(
    (data) => {
      const externalValueIds = data.signals.map((s) =>
        s.externalValueId.trim()
      );
      const uniqueExternalValueIds = new Set(externalValueIds);

      return externalValueIds.length === uniqueExternalValueIds.size;
    },
    {
      message: "No se pueden repetir External Value ID entre señales",
      path: ["signals"],
    }
  )
  .refine(
    (data) => {
      const departmentIds = data.signals.map((s) => s.departmentId);
      const uniqueDepartmentIds = new Set(departmentIds);

      return departmentIds.length === uniqueDepartmentIds.size;
    },
    {
      message: "No se pueden repetir departamentos entre señales",
      path: ["signals"],
    }
  );

export type CreateDeviceWithSignalsInput = z.infer<
  typeof createDeviceWithSignalsSchema
>;
