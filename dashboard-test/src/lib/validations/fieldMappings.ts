/**
 * Mapeo de campos del backend a campos del frontend
 * Útil para mapear errores de validación del backend a los campos correctos del formulario
 */

export const backendToFrontendFieldMap: Record<string, string> = {
  // Device fields
  name: "name",
  areaId: "areaId",
  externalId: "externalId",
  isVirtualDevice: "isVirtualDevice",

  // Device Signal fields
  deviceId: "deviceId",
  departmentId: "departmentId",
  externalValueId: "externalValueId",

  // User fields
  username: "username",
  password: "password",
  roleIds: "roleIds",

  // Email fields
  email: "email",

  // Department fields
  htmlColor: "htmlColor",

  // Torreta fields
  description: "description",
  isActive: "isActive",

  // Torreta Color fields
  deviceColorId: "deviceColorId",

  // Receptor fields
  // (same as device fields)

  // Role fields
  description: "description",

  // Measurement fields
  type: "type",

  // Alert Rule fields
  measurementId: "measurementId",
  mode: "mode",
  operator: "operator",
  setpoint: "setpoint",
  minValue: "minValue",
  maxValue: "maxValue",
  enabled: "enabled",

  // Dashboard Measurement Group fields
  dashboardMeasurements: "dashboardMeasurements",
  chartTimeRange: "chartTimeRange",
  chartMinValue: "chartMinValue",
  chartMaxValue: "chartMaxValue",
  chartMeasurementIds: "chartMeasurementIds",
};

/**
 * Mapea un campo del backend al campo correspondiente del frontend
 */
export function mapBackendFieldToFrontend(backendField: string): string {
  return backendToFrontendFieldMap[backendField] || backendField;
}

/**
 * Mensajes de error user-friendly en español
 * Mapea mensajes técnicos del backend a mensajes más amigables
 */
export const errorMessageMap: Record<string, string> = {
  "name must be a string": "El nombre debe ser texto",
  "name is required": "El nombre es requerido",
  "name cannot be empty": "El nombre no puede estar vacío",
  "name must not exceed 255 characters":
    "El nombre no puede exceder 255 caracteres",
  "name must not exceed 100 characters":
    "El nombre no puede exceder 100 caracteres",

  "areaId must be a number": "El área debe ser un número",
  "areaId must be a positive number":
    "El ID del área debe ser un número positivo",
  "areaId is required": "El área es requerida",

  "externalId must be a string": "El External ID debe ser texto",
  "externalId is required": "El External ID es requerido",
  "externalId cannot be empty": "El External ID no puede estar vacío",

  "username must be a string": "El nombre de usuario debe ser texto",
  "username is required": "El nombre de usuario es requerido",
  "username must be at least 3 characters":
    "El nombre de usuario debe tener al menos 3 caracteres",
  "username must not exceed 255 characters":
    "El nombre de usuario no puede exceder 255 caracteres",

  "password must be a string": "La contraseña debe ser texto",
  "password is required": "La contraseña es requerida",
  "password must be at least 6 characters":
    "La contraseña debe tener al menos 6 caracteres",
  "password must not exceed 255 characters":
    "La contraseña no puede exceder 255 caracteres",

  "email must be a valid email address":
    "Debe ser un correo electrónico válido",
  "email is required": "El correo electrónico es requerido",

  "htmlColor must be a valid hex color (e.g., #FF0000)":
    "El color debe ser un código hexadecimal válido (ej: #FF0000)",

  "deviceColorId must be a string": "El ID del dispositivo debe ser texto",
  "deviceColorId is required": "El ID del dispositivo es requerido",
  "deviceColorId cannot be empty": "El ID del dispositivo no puede estar vacío",

  "deviceId must be a number": "El dispositivo debe ser un número",
  "deviceId must be a positive number":
    "El ID del dispositivo debe ser un número positivo",
  "deviceId is required": "El dispositivo es requerido",

  "departmentId must be a number": "El departamento debe ser un número",
  "departmentId must be a positive number":
    "El ID del departamento debe ser un número positivo",
  "departmentId is required": "El departamento es requerido",

  "externalValueId must be a string": "El External Value ID debe ser texto",
  "externalValueId is required": "El External Value ID es requerido",
  "externalValueId cannot be empty":
    "El External Value ID no puede estar vacío",

  "measurementId must be an integer":
    "El measurement ID debe ser un número entero",
  "measurementId is required": "El measurement ID es requerido",

  "mode must be one of the following values: setpoint, window":
    "El modo debe ser: setpoint o window",
  "mode is required": "El modo es requerido",

  "setpoint must be a number": "El setpoint debe ser un número",
  "setpoint is required": "El setpoint es requerido",

  "minValue must be a number": "El valor mínimo debe ser un número",
  "minValue is required": "El valor mínimo es requerido",

  "maxValue must be a number": "El valor máximo debe ser un número",
  "maxValue is required": "El valor máximo es requerido",

  "dashboardMeasurements must be an array":
    "Los dashboard measurements deben ser un array",
  "dashboardMeasurements should not be empty":
    "Debes seleccionar al menos un dashboard measurement",
};

/**
 * Convierte un mensaje de error del backend a un mensaje user-friendly
 */
export function getFriendlyErrorMessage(backendMessage: string): string {
  // Buscar coincidencia exacta
  if (errorMessageMap[backendMessage]) {
    return errorMessageMap[backendMessage];
  }

  // Buscar coincidencia parcial (para casos como "name must be a string" vs "name must be a string")
  for (const [key, value] of Object.entries(errorMessageMap)) {
    if (backendMessage.includes(key) || key.includes(backendMessage)) {
      return value;
    }
  }

  // Si no hay mapeo, devolver el mensaje original
  return backendMessage;
}
