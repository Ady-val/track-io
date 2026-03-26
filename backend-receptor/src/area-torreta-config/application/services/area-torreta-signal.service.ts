import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ModuleRef } from '@nestjs/core';
import { firstValueFrom } from 'rxjs';
import { TypeOrmAreaTorretaConfigRepository } from '../../domain/repositories/typeorm-area-torreta-config.repository';
import { TorretaConfigurationType } from '../../domain/entities/area-torreta-config.entity';
import { Event } from '../../../events/domain/entities/event.entity';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import { NODE_RED_EVENTS_URL } from '../../../config/node-red-events-url';

type TorretaPayload = {
  type: 'torreta';
  torreta: string;
  color: string;
};

@Injectable()
export class AreaTorretaSignalService {
  private readonly logger = new Logger(AreaTorretaSignalService.name);
  private readonly endpointUrl = NODE_RED_EVENTS_URL;

  private eventRepository?: TypeOrmEventRepository;
  private areaTorretaConfigRepository?: TypeOrmAreaTorretaConfigRepository;
  private departmentRepository?: DepartmentRepository;
  private torretaColorService?: TorretaColorService;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly httpService: HttpService
  ) {}

  private getAreaTorretaConfigRepository(): TypeOrmAreaTorretaConfigRepository {
    if (!this.areaTorretaConfigRepository) {
      const repository = this.moduleRef.get(
        TypeOrmAreaTorretaConfigRepository,
        {
          strict: false,
        }
      );
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!repository) {
        throw new Error(
          'TypeOrmAreaTorretaConfigRepository provider is not available'
        );
      }
      this.areaTorretaConfigRepository = repository;
    }

    return this.areaTorretaConfigRepository;
  }

  private getEventRepository(): TypeOrmEventRepository {
    if (!this.eventRepository) {
      const repository = this.moduleRef.get(TypeOrmEventRepository, {
        strict: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!repository) {
        throw new Error('TypeOrmEventRepository provider is not available');
      }
      this.eventRepository = repository;
    }

    return this.eventRepository;
  }

  private getDepartmentRepository(): DepartmentRepository {
    if (!this.departmentRepository) {
      const repository = this.moduleRef.get(DepartmentRepository, {
        strict: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!repository) {
        throw new Error('DepartmentRepository provider is not available');
      }
      this.departmentRepository = repository;
    }

    return this.departmentRepository;
  }

  private getTorretaColorService(): TorretaColorService {
    if (!this.torretaColorService) {
      const service = this.moduleRef.get(TorretaColorService, {
        strict: false,
      });
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!service) {
        throw new Error('TorretaColorService provider is not available');
      }
      this.torretaColorService = service;
    }

    return this.torretaColorService;
  }

  async processEventForAreaTorretas(event: Event): Promise<void> {
    try {
      const configs =
        await this.getAreaTorretaConfigRepository().findActiveByArea(
          event.areaId
        );

      if (configs.length === 0) {
        this.logger.warn(
          `No active area torreta config for areaId=${event.areaId} (event ${event.id}). Skipping POST to events endpoint — configure torretas for this area to receive outbound signals.`
        );
        return;
      }

      for (const config of configs) {
        const color = await this.determineColorForConfig(config, event);
        if (color) {
          await this.sendTorretaSignal(config.torretaExternalId, color);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing event ${event.id} for area torretas: ${(error as Error).message}`,
        (error as Error).stack
      );
    }
  }

  private async determineColorForConfig(
    config: {
      areaId: number;
      torretaExternalId: string;
      configurationType: TorretaConfigurationType;
    },
    event: Event
  ): Promise<string | null> {
    if (config.configurationType === TorretaConfigurationType.AREA) {
      return this.determineColorByArea(config.areaId);
    } else {
      return await this.determineColorByDepartment(config.areaId, event);
    }
  }

  private async determineColorByArea(areaId: number): Promise<string> {
    const activeEvents =
      await this.getEventRepository().findActiveByArea(areaId);

    if (activeEvents.length === 0) {
      return 'G1';
    }

    const hasOpenEvents = activeEvents.some(e => e.status === EventStatus.OPEN);
    const hasInProgressEvents = activeEvents.some(
      e => e.status === EventStatus.IN_PROGRESS
    );

    if (hasOpenEvents) {
      return 'R1';
    } else if (hasInProgressEvents) {
      return 'Y1';
    }

    return 'G1';
  }

  private async determineColorByDepartment(
    areaId: number,
    _currentEvent: Event
  ): Promise<string | null> {
    const activeEvents =
      await this.getEventRepository().findActiveByArea(areaId);

    if (activeEvents.length === 0) {
      return 'G1';
    }

    const openEvents = activeEvents.filter(e => e.status === EventStatus.OPEN);

    if (openEvents.length > 0) {
      openEvents.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const newestOpenEvent = openEvents[0];

      if (!newestOpenEvent) {
        return 'G1';
      }

      const department = await this.getDepartmentRepository().findById(
        newestOpenEvent.departmentId
      );

      if (department?.htmlColor) {
        const torretaColor =
          await this.getTorretaColorService().getTorretaColorByHtmlColor(
            department.htmlColor.toUpperCase().trim()
          );

        if (torretaColor) {
          return torretaColor.deviceColorId;
        } else {
          this.logger.warn(
            `No torreta color found for department color ${department.htmlColor}, using G1`
          );
          return 'G1';
        }
      } else {
        return 'G1';
      }
    } else {
      return 'G1';
    }
  }

  private async sendTorretaSignal(
    torretaExternalId: string,
    deviceColorId: string
  ): Promise<void> {
    try {
      const resolvedUrl = this.resolveEndpointUrl(this.endpointUrl);
      const payload: { data: TorretaPayload[] } = {
        data: [
          {
            type: 'torreta',
            torreta: torretaExternalId,
            color: deviceColorId,
          },
        ],
      };

      this.logger.log(
        `Sending torreta signal to ${resolvedUrl}: ${JSON.stringify(payload)}`
      );

      await firstValueFrom(
        this.httpService.post(resolvedUrl, payload, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000,
        })
      );

      this.logger.log(
        `Successfully sent torreta signal: ${torretaExternalId} -> ${deviceColorId}`
      );
    } catch (error) {
      this.logger.error(
        `Error sending torreta signal ${torretaExternalId} -> ${deviceColorId}: ${
          (error as Error).message
        }`,
        (error as Error).stack
      );
    }
  }

  private resolveEndpointUrl(_endpointUrl: string): string {
    return NODE_RED_EVENTS_URL;
  }
}
