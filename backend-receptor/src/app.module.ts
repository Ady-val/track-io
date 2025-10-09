import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SignalsModule } from './signals/signals.module';
import { WebSocketModule } from './websocket/websocket.module';
import { AreasModule } from './areas/areas.module';
import { DepartmentsModule } from './departments/departments.module';
import { DevicesModule } from './devices/devices.module';
import { DeviceSignalsModule } from './device-signals/device-signals.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
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
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    SignalsModule,
    WebSocketModule,
    AreasModule,
    DepartmentsModule,
    DevicesModule,
    DeviceSignalsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
