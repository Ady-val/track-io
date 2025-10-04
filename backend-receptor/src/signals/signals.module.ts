import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SignalController } from './presentation/controllers/signal.controller';
import { SignalService } from './application/services/signal.service';
import { RawSignal } from './domain/entities/raw-signal.entity';
import { RawSignalRepository } from './domain/repositories/raw-signal.repository';

@Module({
  imports: [TypeOrmModule.forFeature([RawSignal])],
  controllers: [SignalController],
  providers: [SignalService, RawSignalRepository],
  exports: [SignalService, RawSignalRepository],
})
export class SignalsModule {}
