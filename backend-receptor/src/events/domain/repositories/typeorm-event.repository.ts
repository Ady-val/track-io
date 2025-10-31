import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Event, EventStatus } from '../entities/event.entity';
import {
  EventRepository,
  CreateEventDto,
  EventFilters,
  DashboardData,
} from './event.repository';

@Injectable()
export class TypeOrmEventRepository implements EventRepository {
  constructor(
    @InjectRepository(Event)
    private readonly repository: Repository<Event>
  ) {}

  async create(dto: CreateEventDto): Promise<Event> {
    const event = this.repository.create(dto);
    return this.repository.save(event);
  }

  async findById(id: number): Promise<Event | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['area', 'department', 'device', 'deviceSignal'],
    });
  }

  async findAll(filters?: EventFilters): Promise<Event[]> {
    const queryBuilder = this.repository.createQueryBuilder('event');

    if (filters?.areaId) {
      queryBuilder.andWhere('event.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters?.departmentId) {
      queryBuilder.andWhere('event.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters?.deviceId) {
      queryBuilder.andWhere('event.deviceId = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters?.deviceSignalId) {
      queryBuilder.andWhere('event.deviceSignalId = :deviceSignalId', {
        deviceSignalId: filters.deviceSignalId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters?.offset) {
      queryBuilder.offset(filters.offset);
    }

    queryBuilder
      .leftJoinAndSelect('event.area', 'area')
      .leftJoinAndSelect('event.department', 'department')
      .leftJoinAndSelect('event.device', 'device')
      .leftJoinAndSelect('event.deviceSignal', 'deviceSignal')
      .orderBy('event.createdAt', 'DESC');

    return queryBuilder.getMany();
  }

  async findOpenByDeviceAndSignal(
    deviceId: number,
    deviceSignalId: number
  ): Promise<Event | null> {
    return this.repository.findOne({
      where: {
        deviceId,
        deviceSignalId,
        status: EventStatus.OPEN,
      },
      relations: ['area', 'department', 'device', 'deviceSignal'],
    });
  }

  async findInProgressByDeviceAndSignal(
    deviceId: number,
    deviceSignalId: number
  ): Promise<Event | null> {
    return this.repository.findOne({
      where: {
        deviceId,
        deviceSignalId,
        status: EventStatus.IN_PROGRESS,
      },
      relations: ['area', 'department', 'device', 'deviceSignal'],
    });
  }

  async updateStatus(
    id: number,
    status: EventStatus,
    additionalData?: Partial<Event>
  ): Promise<Event> {
    const updateData: Partial<Event> = { status };

    if (status === EventStatus.IN_PROGRESS) {
      updateData.inProgressAt = new Date();
    } else if (status === EventStatus.CLOSED) {
      updateData.closedAt = new Date();
    }

    if (additionalData) {
      Object.assign(updateData, additionalData);
    }

    await this.repository.update(id, updateData);
    return this.findById(id) as Promise<Event>;
  }

  async updateDepartmentName(
    id: number,
    departmentName: string
  ): Promise<Event> {
    await this.repository.update(id, { departmentName });
    return this.findById(id) as Promise<Event>;
  }

  async findEventWithDeviceSignalAndDepartment(
    id: number
  ): Promise<Event | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['deviceSignal', 'deviceSignal.department'],
    });
  }

  async findByArea(areaId: number): Promise<Event[]> {
    return this.repository.find({
      where: { areaId },
      relations: ['area', 'department', 'device', 'deviceSignal'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByStatus(status: EventStatus): Promise<Event[]> {
    return this.repository.find({
      where: { status },
      relations: ['area', 'department', 'device', 'deviceSignal'],
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByArea(areaId: number): Promise<Event[]> {
    return this.repository.find({
      where: [
        { areaId, status: EventStatus.OPEN },
        { areaId, status: EventStatus.IN_PROGRESS },
      ],
      relations: ['area', 'department', 'device', 'deviceSignal'],
      order: { createdAt: 'DESC' },
    });
  }

  async findRecentClosedEvents(limit: number): Promise<Event[]> {
    // Obtener inicio y fin del día actual
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.repository.find({
      where: {
        status: EventStatus.CLOSED,
        closedAt: Between(startOfDay, endOfDay), // Solo eventos cerrados hoy
      },
      relations: ['area', 'department', 'device', 'deviceSignal'],
      order: { closedAt: 'DESC' },
      take: limit,
    });
  }

  async getDashboardData(): Promise<DashboardData[]> {
    // Esta implementación será más compleja, por ahora retornamos datos básicos
    const events = await this.repository.find({
      relations: ['area', 'department'],
      order: { createdAt: 'DESC' },
    });

    // Agrupar por área
    const areaMap = new Map<string, DashboardData>();

    events.forEach(event => {
      const areaName = event.areaName;

      if (!areaMap.has(areaName)) {
        areaMap.set(areaName, {
          area: areaName,
          departments: [],
          eventsTime: '0h 0m 0s', // TODO: Calcular tiempo real
        });
      }

      const areaData = areaMap.get(areaName)!;
      const existingDept = areaData.departments.find(
        d => d.department === event.departmentName
      );

      if (!existingDept) {
        areaData.departments.push({
          department: event.departmentName,
          status: this.getStatusFromEvent(event),
        });
      }
    });

    return Array.from(areaMap.values());
  }

  private getStatusFromEvent(event: Event): string {
    switch (event.status) {
      case EventStatus.OPEN:
        return 'alert';
      case EventStatus.IN_PROGRESS:
        return 'warning';
      case EventStatus.CLOSED:
        return 'ok';
      default:
        return 'NA';
    }
  }

  async count(filters?: EventFilters): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('event');

    if (filters?.areaId) {
      queryBuilder.andWhere('event.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters?.departmentId) {
      queryBuilder.andWhere('event.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }

    if (filters?.deviceId) {
      queryBuilder.andWhere('event.deviceId = :deviceId', {
        deviceId: filters.deviceId,
      });
    }

    if (filters?.deviceSignalId) {
      queryBuilder.andWhere('event.deviceSignalId = :deviceSignalId', {
        deviceSignalId: filters.deviceSignalId,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('event.status = :status', {
        status: filters.status,
      });
    }

    return queryBuilder.getCount();
  }

  async findOpenEvents(): Promise<Event[]> {
    return this.repository.find({
      where: [
        { status: EventStatus.OPEN },
        { status: EventStatus.IN_PROGRESS },
      ],
      relations: ['area', 'department', 'device', 'deviceSignal'],
    });
  }

  async closeEvent(id: number): Promise<Event> {
    return this.updateStatus(id, EventStatus.CLOSED);
  }
}
