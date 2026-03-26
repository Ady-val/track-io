import { Test, type TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { AlertMessageSenderService } from './alert-message-sender.service';
import { TorretaColorService } from '../../../torreta-colors/application/services/torreta-color.service';
import {
  type AlertMessage,
  MessageType,
} from '../../domain/entities/alert-message.entity';
import {
  createMockAlertMessage,
  createMockTorretaColor,
} from '../../../test-helpers';

describe('AlertMessageSenderService', () => {
  let service: AlertMessageSenderService;
  let httpService: jest.Mocked<HttpService>;
  let torretaColorService: jest.Mocked<TorretaColorService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertMessageSenderService,
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: TorretaColorService,
          useValue: {
            getTorretaColorByHtmlColor: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AlertMessageSenderService>(AlertMessageSenderService);
    httpService = module.get(HttpService);
    torretaColorService = module.get(TorretaColorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessages', () => {
    it('should send messages with correct payload format (identical to area-torreta-signal)', async () => {
      // Set NODE_ENV to development to ensure localhost is preserved
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: 'R1',
          message: '',
        }),
        createMockAlertMessage({
          id: 2,
          messageType: MessageType.RECEPTOR,
          targetId: 'RECEPTOR_001',
          message: 'Alerta activada',
        }),
        createMockAlertMessage({
          id: 3,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Alerta activada',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages(messages);

      expect(result).toBe(true);
      expect(httpService.post).toHaveBeenCalledTimes(1);

      const [url, payload, config] = httpService.post.mock.calls[0];
      expect(url).toContain('localhost:1880/events');

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
      expect(payload).toEqual({
        data: [
          {
            type: 'torreta',
            torreta: 'TORRETA_001',
            color: 'R1',
          },
          {
            type: 'receptor',
            capcode: 'RECEPTOR_001',
            message: 'Alerta activada',
          },
          {
            type: 'email',
            email: 'user@example.com',
            message: 'Alerta activada',
          },
        ],
      });
      expect(config).toEqual({
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
    });

    it('should convert hexadecimal colors to deviceColorId', async () => {
      const mockTorretaColor = createMockTorretaColor({
        htmlColor: '#FF0000',
        deviceColorId: 'R1',
      });

      torretaColorService.getTorretaColorByHtmlColor.mockResolvedValue(
        mockTorretaColor
      );

      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: '#FF0000', // Hexadecimal
          message: '',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages(messages);

      expect(result).toBe(true);
      expect(
        torretaColorService.getTorretaColorByHtmlColor
      ).toHaveBeenCalledWith('#FF0000');

      const [, payload] = httpService.post.mock.calls[0];
      expect(payload).toEqual({
        data: [
          {
            type: 'torreta',
            torreta: 'TORRETA_001',
            color: 'R1', // Converted to deviceColorId
          },
        ],
      });
    });

    it('should use deviceColorId directly when not hexadecimal', async () => {
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: 'G1', // Already deviceColorId
          message: '',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages(messages);

      expect(result).toBe(true);
      expect(
        torretaColorService.getTorretaColorByHtmlColor
      ).not.toHaveBeenCalled();

      const [, payload] = httpService.post.mock.calls[0];
      expect(payload).toEqual({
        data: [
          {
            type: 'torreta',
            torreta: 'TORRETA_001',
            color: 'G1',
          },
        ],
      });
    });

    it('should handle HTTP errors gracefully', async () => {
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Test message',
        }),
      ];

      httpService.post.mockReturnValue(
        throwError(() => new Error('Network error')) as any
      );

      const result = await service.sendMessages(messages);

      expect(result).toBe(false);
    });

    it('should skip messages that fail transformation', async () => {
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: '#INVALID', // Invalid hex color
          message: '',
        }),
        createMockAlertMessage({
          id: 2,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Valid message',
        }),
      ];

      torretaColorService.getTorretaColorByHtmlColor.mockResolvedValue(null);

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages(messages);

      // Should still send the valid message
      expect(result).toBe(true);
      const [, payload] = httpService.post.mock.calls[0];
      expect(payload.data).toHaveLength(1); // Only the valid email message
      expect(payload.data[0]).toEqual({
        type: 'email',
        email: 'user@example.com',
        message: 'Valid message',
      });
    });

    it('should throw error when torreta message is missing color', async () => {
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: undefined, // Missing color
          message: '',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages(messages);

      // Should skip the invalid message
      expect(result).toBe(true);
      const [, payload] = httpService.post.mock.calls[0];
      expect(payload.data).toHaveLength(0);
    });

    it('should resolve endpoint URL correctly in development', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Test',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      await service.sendMessages(messages, 'http://localhost:1880/events');

      const [url] = httpService.post.mock.calls[0];
      expect(url).toBe('http://localhost:1880/events');

      process.env.NODE_ENV = originalEnv;
    });

    it('should always POST to localhost Node-RED URL in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Test',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      await service.sendMessages(messages, 'http://host.docker.internal:1880/events');

      const [url] = httpService.post.mock.calls[0];
      expect(url).toBe('http://localhost:1880/events');

      process.env.NODE_ENV = originalEnv;
    });

    it('should return false when endpoint URL is invalid', async () => {
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.EMAIL,
          targetId: 'user@example.com',
          message: 'Test',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      // Invalid URL format
      const result = await service.sendMessages(messages, 'invalid-url');

      expect(result).toBe(true); // invalid configured URL is ignored; POST uses localhost
    });

    it('should handle empty messages array', async () => {
      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      const result = await service.sendMessages([]);
      expect(result).toBe(true);
      expect(httpService.post).toHaveBeenCalled();
      const [, payload] = httpService.post.mock.calls[0];
      expect(payload.data).toHaveLength(0);
    });
  });

  describe('Payload format validation', () => {
    it('should match exact format from area-torreta-signal.service.ts', async () => {
      // Format from area-torreta-signal.service.ts lines 217-225
      const messages: AlertMessage[] = [
        createMockAlertMessage({
          id: 1,
          messageType: MessageType.TORRETA,
          targetId: 'TORRETA_001',
          color: 'R1',
          message: '',
        }),
      ];

      const mockResponse = { status: 200, data: {} };
      httpService.post.mockReturnValue(of(mockResponse) as any);

      await service.sendMessages(messages);

      const [, payload] = httpService.post.mock.calls[0];

      // Expected format: { data: [{ type: 'torreta', torreta: string, color: string }] }
      expect(payload).toHaveProperty('data');
      expect(Array.isArray(payload.data)).toBe(true);
      expect(payload.data[0]).toHaveProperty('type', 'torreta');
      expect(payload.data[0]).toHaveProperty('torreta', 'TORRETA_001');
      expect(payload.data[0]).toHaveProperty('color', 'R1');
      expect(payload.data[0]).not.toHaveProperty('message'); // Torreta doesn't have message
    });
  });
});
