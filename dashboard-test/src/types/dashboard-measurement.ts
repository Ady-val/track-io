import type { MeasurementType } from "./measurement";

export interface CreateDashboardMeasurementWithMeasurementData {
  // Measurement
  externalId: string;
  name: string;
  type: MeasurementType;

  // DashboardMeasurement
  groupId?: number | null;
  minValue: number;
  maxValue: number;
}

export interface UpdateDashboardMeasurementWithMeasurementData {
  // Measurement (optional)
  externalId?: string;
  name?: string;
  type?: MeasurementType;

  // DashboardMeasurement (optional)
  groupId?: number | null;
  minValue?: number;
  maxValue?: number;
}

export interface DashboardMeasurementSingleResponse<T = any> {
  message: string;
  data: T;
}

