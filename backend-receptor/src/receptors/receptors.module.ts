import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receptor } from './domain/entities/receptor.entity';
import { ReceptorRepository } from './domain/repositories/receptor.repository';
import { ReceptorService } from './application/services/receptor.service';
import { ReceptorController } from './controllers/receptor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Receptor])],
  controllers: [ReceptorController],
  providers: [ReceptorService, ReceptorRepository],
  exports: [ReceptorService, ReceptorRepository],
})
export class ReceptorsModule {}
