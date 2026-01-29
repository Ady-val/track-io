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
  chartMinValue?: number | null;
  chartMaxValue?: number | null;
  chartMeasurementIds?: number[] | null;
  chart2TimeRange?: number;
  chart2MinValue?: number | null;
  chart2MaxValue?: number | null;
  chart2MeasurementIds?: number[] | null;
  dashboardMeasurementOrder?: number[];
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
  chartMinValue?: number | null;
  chartMaxValue?: number | null;
  chartMeasurementIds?: number[] | null;
  chart2TimeRange?: number;
  chart2MinValue?: number | null;
  chart2MaxValue?: number | null;
  chart2MeasurementIds?: number[] | null;
}

export interface UpdateDashboardMeasurementGroupData {
  name?: string;
  dashboardMeasurements?: DashboardMeasurementItemInput[];
  chartTimeRange?: number | null;
  chartMinValue?: number | null;
  chartMaxValue?: number | null;
  chartMeasurementIds?: number[] | null;
  chart2TimeRange?: number | null;
  chart2MinValue?: number | null;
  chart2MaxValue?: number | null;
  chart2MeasurementIds?: number[] | null;
}
