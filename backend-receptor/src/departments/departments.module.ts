import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentController } from './controllers/department.controller';
import { DepartmentService } from './application/services/department.service';
import { Department } from './domain/entities/department.entity';
import { DepartmentRepository } from './domain/repositories/department.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Department]), PermissionsModule],
  controllers: [DepartmentController],
  providers: [DepartmentService, DepartmentRepository],
  exports: [DepartmentService, DepartmentRepository],
})
export class DepartmentsModule {}
