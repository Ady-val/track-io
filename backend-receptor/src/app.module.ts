import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalsModule } from './signals/signals.module';
import { RawMeasurementsModule } from './raw-measurements/raw-measurements.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AreasModule } from './areas/areas.module';
import { DepartmentsModule } from './departments/departments.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceSignalsModule } from './device-signals/device-signals.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { DashboardMeasurementsModule } from './dashboard-measurements/dashboard-measurements.module';
import { MessageGroupsModule } from './message-groups/message-groups.module';
import { AlertRulesModule } from './alert-rules/alert-rules.module';
import { AlertMessagesModule } from './alert-messages/alert-messages.module';
import { TorretasModule } from './torretas/torretas.module';
import { TorretaColorsModule } from './torreta-colors/torreta-colors.module';
import { AlertTriggersModule } from './alert-triggers/alert-triggers.module';
import { ReceptorsModule } from './receptors/receptors.module';
import { EventsModule } from './events/events.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AreaDowntimeModule } from './area-downtime/area-downtime.module';
import { AlertEscalationModule } from './alert-escalation/alert-escalation.module';
import { EmailsModule } from './emails/emails.module';
import { ScheduleModule } from '@nestjs/schedule';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    HttpModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('DATABASE_HOST') ?? 'localhost',
        port: configService.get<number>('DATABASE_PORT') ?? 5432,
        username: configService.get<string>('DATABASE_USERNAME') ?? 'postgres',
        password: configService.get<string>('DATABASE_PASSWORD') ?? 'postgres',
        database: configService.get<string>('DATABASE_NAME') ?? 'track_io',
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<string>('NODE_ENV') === 'development',
        // logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SignalsModule,
    RawMeasurementsModule,
    MeasurementsModule,
    DashboardMeasurementsModule,
    WebSocketModule,
    AreasModule,
    DepartmentsModule,
    DevicesModule,
    DeviceSignalsModule,
    // Alert system modules
    MessageGroupsModule,
    AlertRulesModule,
    AlertMessagesModule,
    TorretasModule,
    TorretaColorsModule,
    AlertTriggersModule,
    ReceptorsModule,
    EventsModule,
    DashboardModule,
    AreaDowntimeModule,
    AlertEscalationModule,
    EmailsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
