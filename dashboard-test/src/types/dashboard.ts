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
