export interface DashboardAreaData {
  area: string;
  departments?: Array<{
    department: string;
    status: string;
  }>;
  eventsTime: string;
}

export interface DashboardEventData {
  id: number;
  area: string;
  department: string;
  device: string;
  signal: string;
  status: string;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
}

export interface DashboardResponse {
  success: boolean;
  headers: string[];
  data: DashboardAreaData[];
}

export interface EventsResponse {
  success: boolean;
  data: DashboardEventData[];
  total: number;
}

export interface DashboardStatus {
  success: boolean;
  data: {
    openEvents: number;
    inProgressEvents: number;
    closedEvents: number;
    totalEvents: number;
  };
}

export type EventStatus = "open" | "in-progress" | "closed";
export type DepartmentStatus = "ok" | "alert" | "warning" | "critical" | "NA";

export type MeasurementType =
  | "temperature"
  | "humidity"
  | "pressure"
  | "level"
  | "vibration"
  | "flow"
  | "shape"
  | "totalizador"
  | "status";

export interface DashboardMeasurement {
  id: number;
  measurementId: number;
  externalId: string;
  name: string;
  type: MeasurementType;
  value: number;
  unit: string;
  timestamp: string;
  area?: string;
  status: "active" | "inactive" | "maintenance";
  maxValue?: number;
  minValue?: number;
  measurement: {
    id: number;
    name: string;
    externalId: string;
    type: MeasurementType;
  };
}

export interface MeasurementValueState {
  id: number;
  value: number;
  timestamp: string;
  status: "normal" | "warning" | "critical";
}

export interface MeasurementValueEvent {
  type: "value_update" | "status_change";
  measurementId: number;
  data: MeasurementValueState;
  timestamp: string;
}
