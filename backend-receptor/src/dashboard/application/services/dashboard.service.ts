import { Injectable, Logger } from '@nestjs/common';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { EventStatus } from '../../../events/domain/entities/event.entity';

export interface DashboardAreaData {
  area: string;
  departments: Array<{
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

interface EventForDashboard {
  id: number;
  areaId: number;
  departmentId: number;
  status: EventStatus;
  createdAt: Date;
  closedAt?: Date;
}

interface EventWithDetails {
  id: number;
  areaId: number;
  areaName: string;
  departmentId: number;
  departmentName: string;
  deviceId: number;
  deviceName: string;
  deviceSignalId: number;
  deviceSignalName: string;
  status: EventStatus;
  createdAt: Date;
  inProgressAt?: Date;
  closedAt?: Date;
  durationSeconds?: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly areaRepository: AreaRepository,
    private readonly departmentRepository: DepartmentRepository,
    private readonly eventRepository: TypeOrmEventRepository
  ) {}

  async getAreasWithEvents(): Promise<DashboardAreaData[]> {
    try {
      const areasResult = await this.areaRepository.findAll();
      const departmentsResult = await this.departmentRepository.findAll();
      const events = await this.eventRepository.findAll();

      const areas = areasResult.data;
      const departments = departmentsResult.data;

      this.logger.log(
        `Found ${areas.length} areas, ${departments.length} departments, ${events.length} events`
      );

      return areas.map(area => ({
        area: area.name,
        departments: departments.map(dept => ({
          department: dept.name,
          status: this.getDepartmentStatus(area.id, dept.id, events),
        })),
        eventsTime: this.calculateTotalEventTime(area.id, events),
      }));
    } catch (error) {
      this.logger.error(
        `Error getting areas with events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getDepartmentHeaders(): Promise<string[]> {
    try {
      const departmentsResult = await this.departmentRepository.findAll();
      const departments = departmentsResult.data;
      return departments.map(dept => dept.name);
    } catch (error) {
      this.logger.error(
        `Error getting department headers: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getOpenEvents(): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findByStatus(EventStatus.OPEN);
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting open events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getInProgressEvents(): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findByStatus(
        EventStatus.IN_PROGRESS
      );
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting in-progress events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getClosedEvents(): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findByStatus(
        EventStatus.CLOSED
      );
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting closed events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getRecentClosedEvents(
    limit: number = 10
  ): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findRecentClosedEvents(limit);
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting recent closed events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getAllEvents(): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findAll();
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting all events: ${(error as Error).message}`
      );
      throw error;
    }
  }

  async getEventsByArea(areaId: number): Promise<DashboardEventData[]> {
    try {
      const events = await this.eventRepository.findByArea(areaId);
      return events.map(event => this.mapEventToDashboardData(event));
    } catch (error) {
      this.logger.error(
        `Error getting events by area ${areaId}: ${(error as Error).message}`
      );
      throw error;
    }
  }

  private getDepartmentStatus(
    areaId: number,
    departmentId: number,
    events: EventForDashboard[]
  ): string {
    const activeEvents = events.filter(
      event =>
        event.areaId === areaId &&
        event.departmentId === departmentId &&
        (event.status === EventStatus.OPEN ||
          event.status === EventStatus.IN_PROGRESS)
    );

    if (activeEvents.length === 0) {
      return 'ok';
    }

    const hasOpenEvents = activeEvents.some(
      event => event.status === EventStatus.OPEN
    );
    const hasInProgressEvents = activeEvents.some(
      event => event.status === EventStatus.IN_PROGRESS
    );

    if (hasOpenEvents) {
      return 'alert';
    } else if (hasInProgressEvents) {
      return 'warning';
    }

    return 'ok';
  }

  private calculateTotalEventTime(
    areaId: number,
    events: EventForDashboard[]
  ): string {
    const activeEvents = events.filter(
      event =>
        event.areaId === areaId &&
        (event.status === EventStatus.OPEN ||
          event.status === EventStatus.IN_PROGRESS)
    );

    if (activeEvents.length === 0) {
      return '0h 0m 0s';
    }

    const now = new Date();
    let totalSeconds = 0;

    activeEvents.forEach(event => {
      const startTime = new Date(event.createdAt);
      const duration = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      totalSeconds += duration;
    });

    return this.formatDuration(totalSeconds);
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  private mapEventToDashboardData(event: EventWithDetails): DashboardEventData {
    return {
      id: event.id,
      area: event.areaName,
      department: event.departmentName,
      device: event.deviceName,
      signal: event.deviceSignalName,
      status: event.status,
      startedAt: event.createdAt,
      ...(event.closedAt && { endedAt: event.closedAt }),
      ...(event.durationSeconds && { duration: event.durationSeconds }),
    };
  }
}
