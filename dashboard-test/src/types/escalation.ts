export interface EscalationMessage {
  id?: number;
  escalationConfigId?: number;
  level: "alert" | "warning" | "escalation1" | "escalation2" | "escalation3" | "close";
  messageType: "torreta" | "receptor" | "email";
  targetId: string;
  message: string;
  color?: string;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export interface EscalationConfig {
  id?: number;
  deviceId: number;
  deviceSignalId: number;
  endpointUrl: string;
  warningDelayMinutes: number;
  escalation1DelayMinutes: number;
  escalation2DelayMinutes: number;
  escalation3DelayMinutes: number;
  isActive: boolean;
  messages?: EscalationMessage[];
}

export interface EscalationLevel {
  level: "alert" | "warning" | "escalation1" | "escalation2" | "escalation3" | "close";
  label: string;
  delayMinutes: number;
  messages: EscalationMessage[];
}

export interface Torreta {
  id: number;
  name: string;
  externalId: string;
  isActive: boolean;
}

export interface Receptor {
  id: number;
  name: string;
  externalId: string;
  isActive: boolean;
}

export interface TorretaColor {
  id: number;
  name: string;
  htmlColor: string;
  deviceColorId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Email {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}