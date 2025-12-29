import type { User } from "@/contexts/AuthContext";
import type { Device } from "@/types";
import type { AlertRule } from "@/types/alertRule";
import type { Measurement } from "@/types/measurement";

export const createMockDevice = (overrides?: Partial<Device>): Device => ({
  id: 1,
  name: "Test Device",
  externalId: "DEV-001",
  areaId: 1,
  areaName: "Test Area",
  isVirtualDevice: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 1,
  name: "Test User",
  username: "testuser",
  ...overrides,
});

export const createMockAlertRule = (
  overrides?: Partial<AlertRule>
): AlertRule => ({
  id: "1",
  name: "Test Alert Rule",
  measurementId: 1,
  mode: "setpoint",
  operator: ">",
  setpoint: 100,
  isEnabled: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMeasurement = (
  overrides?: Partial<Measurement>
): Measurement => ({
  id: 1,
  name: "Test Measurement",
  externalId: "MEAS-001",
  type: "temperature",
  status: "active",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});
