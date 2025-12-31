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
  chartTimeRange?: number; // minutos
  chartMinValue?: number;
  chartMaxValue?: number;
  chartMeasurementIds?: number[];
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
  dashboardMeasurementId: number;
}

export interface CreateDashboardMeasurementGroupData {
  name: string;
  dashboardMeasurements: DashboardMeasurementItemInput[];
  chartTimeRange?: number;
  chartMinValue?: number;
  chartMaxValue?: number;
  chartMeasurementIds?: number[];
}

export interface UpdateDashboardMeasurementGroupData {
  name?: string;
  dashboardMeasurements?: DashboardMeasurementItemInput[];
  chartTimeRange?: number;
  chartMinValue?: number;
  chartMaxValue?: number;
  chartMeasurementIds?: number[];
}
