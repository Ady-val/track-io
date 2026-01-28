export type MeasurementType =
  | "temperature"
  | "humidity"
  | "dew_point"
  | "ppm"
  | "pressure"
  | "level"
  | "vibration"
  | "flow"
  | "shape"
  | "totalizador"
  | "status";

export interface Measurement {
  id: number;
  externalId: string;
  name: string;
  type: MeasurementType;
  area?: string;
  status: "active" | "inactive" | "maintenance";
  createdAt?: string;
  updatedAt?: string;
}

export interface MeasurementResponse {
  message: string;
  data: Measurement[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateMeasurementData {
  externalId: string;
  name: string;
  type: MeasurementType;
  area?: string;
  status?: "active" | "inactive" | "maintenance";
}

export interface MeasurementTypeOption {
  value: string;
  label: string;
}

export interface MeasurementFilters {
  externalId?: string;
  type?: string;
  limit?: number;
  offset?: number;
}
