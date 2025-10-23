export interface DowntimeEvent {
  id: number;
  departmentId: number;
  departmentName: string;
  deviceId: number;
  deviceName: string;
  deviceSignalId: number;
  deviceSignalName: string;
  status: "open" | "in-progress" | "closed";
  createdAt: string;
  inProgressAt?: string;
  closedAt?: string;
}

export interface AreaDowntime {
  id: number;
  areaId: number;
  areaName: string;
  startAt: string;
  isActive: boolean;
  endsAt?: string;
  events: DowntimeEvent[];
}

export interface AreaDowntimesResponse {
  message: string;
  data: AreaDowntime[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface AreaDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}
