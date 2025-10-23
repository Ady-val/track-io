export interface DeviceSignal {
  id: number;
  name: string;
  deviceId: number;
  departmentId: number;
  externalValueId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  device?: {
    id: number;
    name: string;
    externalId: string;
  };
  department?: {
    id: number;
    name: string;
  };
}

export interface DeviceSignalResponse {
  message: string;
  data: DeviceSignal;
}

export interface DeviceSignalsResponse {
  message: string;
  data: DeviceSignal[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateDeviceSignalData {
  name: string;
  deviceId: number;
  departmentId: number;
  externalValueId: string;
}

export interface DeviceSignalFilters {
  name?: string;
  deviceId?: number;
  departmentId?: number;
  externalValueId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
