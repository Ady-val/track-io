import type React from "react";

export interface AlertRule {
  id: string;
  name: string;
  measurementId: number;
  mode: "setpoint" | "window";
  operator?: string;
  setpoint?: number;
  minValue?: number;
  maxValue?: number;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
  measurement?: Measurement;
  messages?: AlertMessage[];
  sensorId?: number;
  edit?: boolean;
  mensajes?: AlertMessage[];
}

export interface AlertMessage {
  id: number;
  tipoReceptor: "reloj" | "correo" | "torreta";
  receptor: string;
  receptorNombre?: string;
  message: string;
  grupo: string;
  status: "warning" | "alert" | "critical";
  alertRuleId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Measurement {
  id: number;
  externalId: string;
  name: string;
  type: SensorTypeValue;
  area?: string;
  status: "active" | "inactive" | "maintenance";
  createdAt?: string;
  updatedAt?: string;
}

export type Sensor = Measurement;
export type Message = AlertMessage;

export type SensorTypeValue =
  | "temperature"
  | "humidity"
  | "pressure"
  | "level"
  | "vibration"
  | "flow"
  | "shape"
  | "totalizador";

export interface SensorType {
  value: SensorTypeValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export interface Operator {
  value: string;
  label: string;
}

export interface GrupoMensaje {
  id: number;
  nombre: string;
  color: string;
  descripcion: string;
}

export interface Receptor {
  id: number;
  nombre: string;
  capcode: string;
  departamento: string;
  email?: string;
}

export interface UsuarioCorreo {
  id: number;
  nombre: string;
  email?: string;
  departamento: string;
}

export interface NewMessageData {
  tipoReceptor: "reloj" | "correo" | "torreta";
  receptor: string;
  receptorNombre?: string;
  message: string;
  grupo: string;
}

export interface CreateAlertRuleData {
  name: string;
  measurementId: number;
  mode: "setpoint" | "window";
  operator?: string;
  setpoint?: number;
  minValue?: number;
  maxValue?: number;
  isEnabled?: boolean;
}

export interface UpdateAlertRuleData {
  name?: string;
  measurementId?: number;
  mode?: "setpoint" | "window";
  operator?: string;
  setpoint?: number;
  minValue?: number;
  maxValue?: number;
  isEnabled?: boolean;
}

export interface AlertRuleFilters {
  measurementId?: number;
  isEnabled?: boolean;
  mode?: string;
}

export interface AlertRuleResponse {
  message: string;
  data: AlertRule[];
  total: number;
}

export interface AlertRuleSingleResponse {
  message: string;
  data: AlertRule;
}

export interface MeasurementResponse {
  message: string;
  data: Measurement[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ReceptorsResponse {
  message: string;
  data: Receptor[];
  total: number;
}

export interface MessageGroupsResponse {
  message: string;
  data: GrupoMensaje[];
  total: number;
}

export interface TorretaColorsResponse {
  message: string;
  data: TorretaColor[];
  total: number;
}

export interface TorretaColor {
  id: number;
  name: string;
  hexCode: string;
}
