import type { MeasurementType } from "./measurement";

export interface DashboardMeasurementItem {
  id: number;
  measurementId: number;
  minValue: number;
  maxValue: number;
  measurement: {
    id: number;
    name: string;
    externalId: string;
    type: MeasurementType;
  };
}

export interface DashboardMeasurementGroup {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  dashboardMeasurements: DashboardMeasurementItem[];
}

export interface DashboardMeasurementGroupResponse {
  message: string;
  data: DashboardMeasurementGroup[];
  total: number;
}

export interface DashboardMeasurementGroupSingleResponse {
  message: string;
  data: DashboardMeasurementGroup;
}

export interface DashboardMeasurementItemInput {
  measurementId: number;
  minValue: number;
  maxValue: number;
}

export interface CreateDashboardMeasurementGroupData {
  name: string;
  dashboardMeasurements: DashboardMeasurementItemInput[];
}

export interface UpdateDashboardMeasurementGroupData {
  name?: string;
  dashboardMeasurements?: DashboardMeasurementItemInput[];
}
