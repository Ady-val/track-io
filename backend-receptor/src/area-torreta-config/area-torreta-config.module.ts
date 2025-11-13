import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { AreaTorretaConfig } from './domain/entities/area-torreta-config.entity';
import { AreaTorretaConfigController } from './controllers/area-torreta-config.controller';
import { AreaTorretaConfigService } from './application/services/area-torreta-config.service';
import { AreaTorretaSignalService } from './application/services/area-torreta-signal.service';
import { TypeOrmAreaTorretaConfigRepository } from './domain/repositories/typeorm-area-torreta-config.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([AreaTorretaConfig]),
    HttpModule,
  ],
  controllers: [AreaTorretaConfigController],
  providers: [
    AreaTorretaConfigService,
    AreaTorretaSignalService,
    TypeOrmAreaTorretaConfigRepository,
    {
      provide: 'AreaTorretaConfigRepository',
      useExisting: TypeOrmAreaTorretaConfigRepository,
    },
  ],
  exports: [
    AreaTorretaConfigService,
    AreaTorretaSignalService,
    TypeOrmAreaTorretaConfigRepository,
  ],
})
export class AreaTorretaConfigModule {}

