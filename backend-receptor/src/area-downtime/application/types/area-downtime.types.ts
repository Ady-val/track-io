import type { EventStatus } from '../../../events/domain/entities/event.entity';

export interface DowntimeEvent {
  id: number;
  departmentId: number;
  departmentName: string;
  deviceId: number;
  deviceName: string;
  deviceSignalId: number;
  deviceSignalName: string;
  status: EventStatus;
  createdAt: Date;
  inProgressAt?: Date | undefined;
  closedAt?: Date | undefined;
}

export interface AreaDowntimeResponse {
  id: number;
  areaId: number;
  areaName: string;
  startAt: Date;
  isActive: boolean;
  endsAt?: Date | undefined;
  events: DowntimeEvent[];
}
