import type { IconType } from "react-icons";

export interface Message {
  id: number;
  tipoReceptor: "reloj" | "torreta" | "correo" | "generico";
  receptor: string;
  receptorNombre?: string;
  message?: string;
  grupo: string;
  status: string;
}

export type SensorTypeValue =
  | "temperatura"
  | "humedad"
  | "presion"
  | "nivel"
  | "vibracion"
  | "flujo"
  | "totalizador";

export interface SensorType {
  value: SensorTypeValue;
  label: string;
  icon: IconType;
  color: string;
}

export interface AlertRule {
  id: string;
  name: string;
  sensorTag: string;
  sensorType: SensorTypeValue;
  mode: "setpoint" | "window";
  operator?: string;
  setpoint?: number;
  minValue?: number;
  maxValue?: number;
  isEnabled: boolean;
  edit: boolean;
  mensajes: Message[];
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
}

export interface UsuarioCorreo {
  id: number;
  nombre: string;
  email: string;
  departamento: string;
}

export interface NewMessageData {
  tipoReceptor: string;
  receptor: string;
  receptorNombre: string;
  message: string;
}

export interface RawDataItem {
  id: number;
  externalId: string;
  value: string;
  createdAt: string;
}
