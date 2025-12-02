export enum Module {
  AREAS = "areas",
  DEPARTMENTS = "departments",
  DEVICES = "devices",
  MEASUREMENTS = "measurements",
  SIGNALS = "signals",
  RAW_MEASUREMENTS = "raw-measurements",
  MESSAGE_GROUPS = "message-groups",
  MEASUREMENT_ALERTS = "measurement-alerts",
  ALERT_TRIGGERS = "alert-triggers",
  AREA_DOWNTIME = "area-downtime",
  AREA_TORRETA_CONFIG = "area-torreta-config",
  TORRETAS = "torretas",
  TORRETA_COLORS = "torreta-colors",
  RECEPTORS = "receptors",
  EVENTS = "events",
  EMAILS = "emails",
  USERS = "users",
  DASHBOARD = "dashboard",
  ROLES_AND_PERMISSIONS = "roles-and-permissions",
  CATALOGS = "catalogs", // Unifica AREAS, DEPARTMENTS, TORRETAS, TORRETA_COLORS, RECEPTORS, EMAILS
}

export enum Action {
  CREATE = "create",
  READ = "read",
  UPDATE = "update",
  DELETE = "delete",
}

export const ADMIN_USERNAME = "ADMIN";
