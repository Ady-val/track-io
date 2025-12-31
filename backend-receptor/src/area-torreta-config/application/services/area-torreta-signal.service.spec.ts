import { Test, type TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ModuleRef } from '@nestjs/core';
import { AreaTorretaSignalService } from './area-torreta-signal.service';
import { TypeOrmAreaTorretaConfigRepository } from '../../domain/repositories/typeorm-area-torreta-config.repository';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { DepartmentRepository } from '../../../departments/domain/repositories/department.repository';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import {
  createMockAreaTorretaConfig,
  createMockEvent,
  createMockDepartment,
  createMockTorretaColor,
} from '../../../test-helpers';
import { EventStatus } from '../../../events/domain/entities/event.entity';
import { TorretaConfigurationType } from '../../domain/entities/area-torreta-config.entity';
import { of, throwError } from 'rxjs';
import type { Event } from '../../../events/domain/entities/event.entity';
import type { AxiosResponse } from 'axios';

describe('AreaTorretaSignalService', () => {
  let service: AreaTorretaSignalService;
  let httpService: jest.Mocked<HttpService>;
  let areaTorretaConfigRepository: jest.Mocked<TypeOrmAreaTorretaConfigRepository>;
  let eventRepository: jest.Mocked<TypeOrmEventRepository>;
  let departmentRepository: jest.Mocked<DepartmentRepository>;
  let torretaColorService: jest.Mocked<TorretaColorService>;

  beforeEach(async () => {
    const mockAreaTorretaConfigRepository = {
      findActiveByArea: jest.fn(),
    };

    const mockEventRepository = {
      findActiveByArea: jest.fn(),
    };

    const mockDepartmentRepository = {
      findById: jest.fn(),
    };

    const mockTorretaColorService = {
      getTorretaColorByHtmlColor: jest.fn(),
    };

    const mockHttpService = {
      post: jest.fn(),
    };

    const mockModuleRef = {
      get: jest.fn((token: unknown) => {
        if (token === TypeOrmAreaTorretaConfigRepository) {
          return mockAreaTorretaConfigRepository;
        }
        if (token === TypeOrmEventRepository) {
          return mockEventRepository;
        }
        if (token === DepartmentRepository) {
          return mockDepartmentRepository;
        }
        if (token === TorretaColorService) {
          return mockTorretaColorService;
        }
        return null;
      }),
    } as jest.Mocked<ModuleRef>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AreaTorretaSignalService,
        {
          provide: ModuleRef,
          useValue: mockModuleRef,
        },
        {
          provide: HttpService,
          useValue: mockHttpService,
        },
      ],
    }).compile();

    service = module.get<AreaTorretaSignalService>(AreaTorretaSignalService);
    httpService = module.get(HttpService);
    areaTorretaConfigRepository =
      mockAreaTorretaConfigRepository as jest.Mocked<TypeOrmAreaTorretaConfigRepository>;
    eventRepository =
      mockEventRepository as jest.Mocked<TypeOrmEventRepository>;
    departmentRepository =
      mockDepartmentRepository as jest.Mocked<DepartmentRepository>;
    torretaColorService =
      mockTorretaColorService as jest.Mocked<TorretaColorService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processEventForAreaTorretas', () => {
    it('should process event for area torretas', async () => {
      const event = createMockEvent({ id: 1, areaId: 1 });
      const mockConfigs = [
        createMockAreaTorretaConfig({
          id: 1,
          areaId: 1,
          torretaExternalId: 'TORRETA001',
          configurationType: TorretaConfigurationType.AREA,
        }),
      ];

      areaTorretaConfigRepository.findActiveByArea.mockResolvedValue(
        mockConfigs
      );
      eventRepository.findActiveByArea.mockResolvedValue([]);
      httpService.post.mockReturnValue(
        of({ data: {} } as AxiosResponse) as unknown as ReturnType<
          typeof httpService.post
        >
      );

      await service.processEventForAreaTorretas(event);

      expect(areaTorretaConfigRepository.findActiveByArea).toHaveBeenCalledWith(
        1
      );
      expect(httpService.post).toHaveBeenCalled();
    });

    it('should omit when no active configs exist', async () => {
      const event = createMockEvent({ id: 1, areaId: 1 });

      areaTorretaConfigRepository.findActiveByArea.mockResolvedValue([]);

      await service.processEventForAreaTorretas(event);

      expect(httpService.post).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const event = createMockEvent({ id: 1, areaId: 1 });
      const error = new Error('Database error');

      areaTorretaConfigRepository.findActiveByArea.mockRejectedValue(error);

      // El servicio maneja errores internamente, no debe lanzar excepciones
      await service.processEventForAreaTorretas(event);

      // Verificar que el error fue manejado (no se propagó)
      expect(areaTorretaConfigRepository.findActiveByArea).toHaveBeenCalled();
    });
  });

  describe('determineColorByArea', () => {
    it('should return G1 when no active events', async () => {
      const areaId = 1;
      eventRepository.findActiveByArea.mockResolvedValue([]);

      const color = await (
        service as unknown as {
          determineColorByArea: (areaId: number) => Promise<string>;
        }
      ).determineColorByArea(areaId);

      expect(color).toBe('G1');
    });

    it('should return R1 when there are OPEN events', async () => {
      const areaId = 1;
      const mockEvents = [
        createMockEvent({
          id: 1,
          areaId,
          status: EventStatus.OPEN,
        }),
      ];

      eventRepository.findActiveByArea.mockResolvedValue(mockEvents);

      const color = await (
        service as unknown as {
          determineColorByArea: (areaId: number) => Promise<string>;
        }
      ).determineColorByArea(areaId);

      expect(color).toBe('R1');
    });

    it('should return Y1 when there are IN_PROGRESS events', async () => {
      const areaId = 1;
      const mockEvents = [
        createMockEvent({
          id: 1,
          areaId,
          status: EventStatus.IN_PROGRESS,
        }),
      ];

      eventRepository.findActiveByArea.mockResolvedValue(mockEvents);

      const color = await (
        service as unknown as {
          determineColorByArea: (areaId: number) => Promise<string>;
        }
      ).determineColorByArea(areaId);

      expect(color).toBe('Y1');
    });
  });

  describe('determineColorByDepartment', () => {
    it('should return G1 when no active events', async () => {
      const areaId = 1;
      const event = createMockEvent({ id: 1, areaId });

      eventRepository.findActiveByArea.mockResolvedValue([]);

      const color = await (
        service as unknown as {
          determineColorByDepartment: (departmentId: number) => Promise<string>;
        }
      ).determineColorByDepartment(areaId, event);

      expect(color).toBe('G1');
    });

    it('should return color from department when OPEN events exist', async () => {
      const areaId = 1;
      const departmentId = 1;
      const event = createMockEvent({ id: 1, areaId, departmentId });
      const mockEvents = [
        createMockEvent({
          id: 1,
          areaId,
          departmentId,
          status: EventStatus.OPEN,
          createdAt: new Date('2024-01-01'),
        }),
      ];
      const mockDepartment = createMockDepartment({
        id: departmentId,
        htmlColor: '#FF0000',
      });
      const mockTorretaColor = createMockTorretaColor({
        id: 1,
        htmlColor: '#FF0000',
        deviceColorId: 'R1',
      });

      eventRepository.findActiveByArea.mockResolvedValue(mockEvents);
      departmentRepository.findById.mockResolvedValue(mockDepartment);
      torretaColorService.getTorretaColorByHtmlColor.mockResolvedValue(
        mockTorretaColor
      );

      const color = await (
        service as unknown as {
          determineColorByDepartment: (departmentId: number) => Promise<string>;
        }
      ).determineColorByDepartment(areaId, event);

      expect(color).toBe('R1');
    });

    it('should return G1 when department color not found', async () => {
      const areaId = 1;
      const departmentId = 1;
      const event = createMockEvent({ id: 1, areaId, departmentId });
      const mockEvents = [
        createMockEvent({
          id: 1,
          areaId,
          departmentId,
          status: EventStatus.OPEN,
        }),
      ];
      const mockDepartment = createMockDepartment({
        id: departmentId,
        htmlColor: '#FF0000',
      });

      eventRepository.findActiveByArea.mockResolvedValue(mockEvents);
      departmentRepository.findById.mockResolvedValue(mockDepartment);
      torretaColorService.getTorretaColorByHtmlColor.mockResolvedValue(null);

      const color = await (
        service as unknown as {
          determineColorByDepartment: (departmentId: number) => Promise<string>;
        }
      ).determineColorByDepartment(areaId, event);

      expect(color).toBe('G1');
    });
  });

  describe('sendTorretaSignal', () => {
    it('should send HTTP signal successfully', async () => {
      const torretaExternalId = 'TORRETA001';
      const deviceColorId = 'R1';
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      httpService.post.mockReturnValue(
        of({ data: {} } as AxiosResponse) as unknown as ReturnType<
          typeof httpService.post
        >
      );

      await (
        service as unknown as {
          sendTorretaSignal: (
            torretaExternalId: string,
            deviceColorId: string
          ) => Promise<void>;
        }
      ).sendTorretaSignal(torretaExternalId, deviceColorId);

      expect(httpService.post).toHaveBeenCalled();
      const callArgs = httpService.post.mock.calls[0];
      expect(callArgs[0]).toContain('/events');
      expect(callArgs[1]).toEqual({
        data: [
          {
            type: 'torreta',
            torreta: torretaExternalId,
            color: deviceColorId,
          },
        ],
      });
      expect(callArgs[2]).toEqual({
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should handle HTTP errors gracefully', async () => {
      const torretaExternalId = 'TORRETA001';
      const deviceColorId = 'R1';
      const error = new Error('Network error');

      httpService.post.mockReturnValue(
        throwError(() => error) as unknown as ReturnType<
          typeof httpService.post
        >
      );

      await expect(
        (
          service as unknown as {
            sendTorretaSignal: (
              torretaExternalId: string,
              deviceColorId: string
            ) => Promise<void>;
          }
        ).sendTorretaSignal(torretaExternalId, deviceColorId)
      ).resolves.not.toThrow();
    });
  });

  describe('resolveEndpointUrl', () => {
    it('should return original URL in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const url = (
        service as unknown as { resolveEndpointUrl: (url: string) => string }
      ).resolveEndpointUrl('http://localhost:1880/events');

      expect(url).toBe('http://localhost:1880/events');
      process.env.NODE_ENV = originalEnv;
    });

    it('should resolve localhost to host.docker.internal in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const url = (
        service as unknown as { resolveEndpointUrl: (url: string) => string }
      ).resolveEndpointUrl('http://localhost:1880/events');

      expect(url).toContain('host.docker.internal');
      process.env.NODE_ENV = originalEnv;
    });

    it('should handle invalid URLs gracefully', () => {
      const url = (
        service as unknown as { resolveEndpointUrl: (url: string) => string }
      ).resolveEndpointUrl('invalid-url');

      expect(url).toBe('invalid-url');
    });
  });
});
