import type { Event, EventStatus } from '../entities/event.entity';

export interface CreateEventDto {
  areaId: number;
  areaName: string;
  departmentId: number;
  departmentName: string;
  deviceId: number;
  deviceName: string;
  deviceSignalId: number;
  deviceSignalName: string;
  virtualDevice?: boolean;
  reason?: string;
  comment?: string;
  virtualUserName?: string;
}

export interface EventFilters {
  areaId?: number;
  departmentId?: number;
  deviceId?: number;
  deviceSignalId?: number;
  status?: EventStatus;
  limit?: number;
  offset?: number;
}

export interface DashboardData {
  area: string;
  departments: Array<{
    department: string;
    status: string;
  }>;
  eventsTime: string;
}

export interface EventRepository {
  create: (dto: CreateEventDto) => Promise<Event>;
  findById: (id: number) => Promise<Event | null>;
  findAll: (filters?: EventFilters) => Promise<Event[]>;
  findOpenByDeviceAndSignal: (
    deviceId: number,
    deviceSignalId: number
  ) => Promise<Event | null>;
  findInProgressByDeviceAndSignal: (
    deviceId: number,
    deviceSignalId: number
  ) => Promise<Event | null>;
  updateStatus: (
    id: number,
    status: EventStatus,
    additionalData?: Partial<Event>
  ) => Promise<Event>;
  findByArea: (areaId: number) => Promise<Event[]>;
  findByStatus: (status: EventStatus) => Promise<Event[]>;
  findActiveByArea: (areaId: number) => Promise<Event[]>;
  findRecentClosedEvents: (limit: number) => Promise<Event[]>;
  getDashboardData: () => Promise<DashboardData[]>;
  count: (filters?: EventFilters) => Promise<number>;
}
