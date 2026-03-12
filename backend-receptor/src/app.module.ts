import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalsModule } from './signals/signals.module';
import { RawMeasurementsModule } from './raw-measurements/raw-measurements.module';
import { WebSocketModule } from './websocket/websocket.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceSignalsModule } from './device-signals/device-signals.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { DashboardMeasurementsModule } from './dashboard-measurements/dashboard-measurements.module';
import { MessageGroupsModule } from './message-groups/message-groups.module';
import { AlertRulesModule } from './alert-rules/alert-rules.module';
import { AlertMessagesModule } from './alert-messages/alert-messages.module';
import { AlertTriggersModule } from './alert-triggers/alert-triggers.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AreaDowntimeModule } from './area-downtime/area-downtime.module';
import { AlertEscalationModule } from './alert-escalation/alert-escalation.module';
import { AreaTorretaConfigModule } from './area-torreta-config/area-torreta-config.module';
import { EventsModule } from './events/events.module';
import { CatalogsGlobalModule } from './common/modules/catalogs-global.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TestSeedService } from './seed/test-seed.service';
import { User } from './users/domain/entities/user.entity';
import systemModulesConfig from './config/system-modules.config';
import { APP_GUARD } from '@nestjs/core';
import { SystemModuleGuard } from './common/guards/system-module.guard';
import { VirtualDeviceModule } from './virtual-device/virtual-device.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [systemModulesConfig],
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Determine database type from environment variable (default: postgres)
        const databaseType = (configService.get<string>('DATABASE_TYPE') ?? 'postgres').toLowerCase();
        
        // Base configuration common to all database types
        const baseConfig = {
        host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
          username: configService.get<string>('DATABASE_USERNAME') ?? (databaseType === 'mssql' || databaseType === 'sqlserver' ? 'sa' : 'postgres'),
          password: configService.get<string>('DATABASE_PASSWORD') ?? (databaseType === 'mssql' || databaseType === 'sqlserver' ? '' : 'postgres'),
        database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize:
          configService.get<string>('NODE_ENV') === 'development' ||
          configService.get<string>('NODE_ENV') === 'test' ||
          configService.get<string>('TYPEORM_SYNCHRONIZE') === 'true',
        };

        // SQL Server configuration
        if (databaseType === 'mssql' || databaseType === 'sqlserver') {
          const portStr = configService.get<string>('DATABASE_PORT');
          const port = portStr ? parseInt(portStr, 10) : 1433;
          
          // Get encrypt setting - default to false for local development
          // Set MSSQL_ENCRYPT=true to enable encryption
          const encryptEnv = configService.get<string>('MSSQL_ENCRYPT');
          const encrypt = encryptEnv === 'true';
          
          // Get trustServerCertificate setting - default to true when encrypt is enabled
          // Set MSSQL_TRUST_SERVER_CERTIFICATE=false to disable trust (only if encrypt=true)
          const trustCertEnv = configService.get<string>('MSSQL_TRUST_SERVER_CERTIFICATE');
          const trustServerCertificate = encrypt 
            ? (trustCertEnv !== 'false') // Default to true when encrypt is enabled
            : false; // Not needed when encrypt is false
          
          return {
            type: 'mssql' as const,
            ...baseConfig,
            port: port,
            options: {
              encrypt: encrypt,
              trustServerCertificate: trustServerCertificate,
              enableArithAbort: true,
            },
          };
        }
        
        // PostgreSQL configuration (default)
        const portStr = configService.get<string>('DATABASE_PORT');
        const port = portStr ? parseInt(portStr, 10) : 5432;
        return {
          type: 'postgres' as const,
          ...baseConfig,
          port: port,
        };
      },
      inject: [ConfigService],
    }),
    CatalogsGlobalModule,
    AreaTorretaConfigModule,
    UsersModule,
    AuthModule,
    PermissionsModule,
    TypeOrmModule.forFeature([User]),
    SignalsModule,
    RawMeasurementsModule,
    MeasurementsModule,
    DashboardMeasurementsModule,
    WebSocketModule,
    DevicesModule,
    DeviceSignalsModule,
    MessageGroupsModule,
    AlertRulesModule,
    AlertMessagesModule,
    AlertTriggersModule,
    DashboardModule,
    AreaDowntimeModule,
    AlertEscalationModule,
    EventsModule,
    VirtualDeviceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TestSeedService,
    {
      provide: APP_GUARD,
      useClass: SystemModuleGuard,
    },
  ],
})
export class AppModule {}
