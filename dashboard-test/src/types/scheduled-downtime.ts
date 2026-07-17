export interface ScheduledDowntime {
  id: number;
  name: string;
  areaId: number;
  area?: {
    id: number;
    name: string;
  };
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  daysOfWeek: number[]; // 0=domingo … 6=sábado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ScheduledDowntimeResponse {
  message: string;
  data: ScheduledDowntime;
}

export interface ScheduledDowntimesResponse {
  message: string;
  data: ScheduledDowntime[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateScheduledDowntimeData {
  name: string;
  areaId: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive?: boolean;
}

export interface UpdateScheduledDowntimeData {
  name?: string;
  areaId?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive?: boolean;
}

export interface ScheduledDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export const DAYS_OF_WEEK_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};
