export enum MeasurementType {
  TEMPERATURE = "temperature",
  HUMIDITY = "humidity",
  PRESSURE = "pressure",
  LEVEL = "level",
  FLOW = "flow",
  VIBRATION = "vibration",
}

export interface Measurement {
  id: number;
  externalId: string;
  name: string;
  type: MeasurementType;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
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
  type: MeasurementType | string;
}

export interface MeasurementTypeOption {
  value: string;
  label: string;
}
