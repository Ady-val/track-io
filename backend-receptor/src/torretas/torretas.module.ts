import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Torreta } from './domain/entities/torreta.entity';
import { TorretaRepository } from './domain/repositories/torreta.repository';
import { TorretaService } from './application/services/torreta.service';
import { TorretaController } from './controllers/torreta.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Torreta])],
  controllers: [TorretaController],
  providers: [TorretaService, TorretaRepository],
  exports: [TorretaService, TorretaRepository],
})
export class TorretasModule {}
