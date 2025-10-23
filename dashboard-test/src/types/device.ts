export interface Device {
  id: number;
  name: string;
  areaId: number;
  areaName: string;
  externalId: string;
  createdAt: string;
  updatedAt: string;
  deviceSignals?: DeviceSignal[];
}

export interface DeviceSignal {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
  externalValueId: string;
}

export interface DeviceResponse {
  message: string;
  data: Device;
}

export interface DevicesResponse {
  message: string;
  data: Device[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateDeviceData {
  name: string;
  areaId: number;
  externalId: string;
}

export interface UpdateDeviceData {
  name?: string;
  externalId?: string;
}

export interface CreateDeviceSignalData {
  name: string;
  deviceId: number;
  departmentId: number;
  externalValueId: string;
}

export interface UpdateDeviceSignalData {
  name?: string;
  departmentId?: number;
  externalValueId?: string;
}

export interface DeviceFilters {
  name?: string;
  areaId?: number;
  externalId?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}
