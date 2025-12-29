export interface RawDataItem {
  id: number;
  externalId: string;
  value: string;
  createdAt: string;
  type?: "signal" | "measurement";
}

export interface Message {
  id: number;
  content: string;
  type: "reloj" | "correo" | "torreta";
  createdAt: string;
  updatedAt: string;
}

export interface SensorTypeValue {
  id: number;
  name: string;
  value: string;
}

export interface SensorType {
  id: number;
  name: string;
  values: SensorTypeValue[];
}

export interface Sensor {
  id: number;
  name: string;
  type: string;
  externalId: string;
  isActive: boolean;
}

export interface AlertRuleCondition {
  field?: string;
  operator?: string;
  value?: unknown;
  [key: string]: unknown;
}

export interface AlertRuleAction {
  type?: string;
  target?: string;
  [key: string]: unknown;
}

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  conditions: AlertRuleCondition[];
  actions: AlertRuleAction[];
  createdAt: string;
  updatedAt: string;
}

export interface Operator {
  id: number;
  name: string;
  symbol: string;
}

export interface GrupoMensaje {
  id: number;
  name: string;
  description?: string;
}

export interface Receptor {
  id: number;
  externalId: string;
  name: string;
  isActive: boolean;
}

export interface UsuarioCorreo {
  id: number;
  email: string;
  name: string;
}

export interface NewMessageData {
  content: string;
  type: "reloj" | "correo" | "torreta";
  groupId?: number;
}
