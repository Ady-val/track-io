import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TorretaColor } from './domain/entities/torreta-color.entity';
import { TorretaColorRepository } from './domain/repositories/torreta-color.repository';
import { TorretaColorService } from './application/services/torreta-color.service';
import { TorretaColorController } from './controllers/torreta-color.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TorretaColor])],
  controllers: [TorretaColorController],
  providers: [TorretaColorService, TorretaColorRepository],
  exports: [TorretaColorService, TorretaColorRepository],
})
export class TorretaColorsModule {}
