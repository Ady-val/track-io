export interface DashboardMeasurement {
  id: number;
  measurementId: number;
  minValue: number;
  maxValue: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  measurement: {
    id: number;
    externalId: string;
    name: string;
    type: MeasurementType;
    createdAt: string;
    updatedAt: string;
  };
}

export type MeasurementType =
  | "temperature"
  | "humidity"
  | "pressure"
  | "level"
  | "flow"
  | "vibration";

export interface MeasurementValueEvent {
  type: "measurement_value";
  data: {
    measurementId: number;
    value: string;
    createdAt: string;
  };
}

export interface MeasurementValueState {
  [measurementId: number]: {
    value: number;
    timestamp: string;
  };
}


