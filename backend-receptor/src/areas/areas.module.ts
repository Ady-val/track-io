import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AreaController } from './controllers/area.controller';
import { AreaService } from './application/services/area.service';
import { Area } from './domain/entities/area.entity';
import { AreaRepository } from './domain/repositories/area.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Area])],
  controllers: [AreaController],
  providers: [AreaService, AreaRepository],
  exports: [AreaService, AreaRepository],
})
export class AreasModule {}
