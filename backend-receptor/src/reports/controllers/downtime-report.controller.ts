import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { DowntimeReportService } from '../application/services/downtime-report.service';
import { DowntimeReportExcelService } from '../application/services/downtime-report-excel.service';
import {
  DowntimeReportQueryDto,
  EventReportQueryDto,
} from '../application/dtos/downtime-report.dto';
import type {
  DowntimeReport,
  EventReportResult,
} from '../application/dtos/downtime-report.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

const MAX_RANGE_DAYS = 370;
const MAX_RANGE_MS = MAX_RANGE_DAYS * 24 * 60 * 60 * 1000;

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DowntimeReportController {
  constructor(
    private readonly reportService: DowntimeReportService,
    private readonly excelService: DowntimeReportExcelService
  ) {}

  /** Valida from/to; lanza 400 si son inválidos, invertidos o exceden el máximo. */
  static parseRange(from: string, to: string): { from: Date; to: Date } {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new BadRequestException(
        'from y to deben ser fechas ISO 8601 válidas'
      );
    }
    if (toDate.getTime() <= fromDate.getTime()) {
      throw new BadRequestException('to debe ser posterior a from');
    }
    if (toDate.getTime() - fromDate.getTime() > MAX_RANGE_MS) {
      throw new BadRequestException(
        `El rango no puede exceder ${MAX_RANGE_DAYS} días`
      );
    }
    return { from: fromDate, to: toDate };
  }

  @Get('downtime')
  @RequirePermission(Module.REPORTS, Action.READ)
  async getDowntimeReport(
    @Query() query: DowntimeReportQueryDto
  ): Promise<{ message: string; data: DowntimeReport }> {
    DowntimeReportController.parseRange(query.from, query.to);
    const data = await this.reportService.getDowntimeReport(query);
    return { message: 'Downtime report generated successfully', data };
  }

  @Get('downtime/export')
  @RequirePermission(Module.REPORTS, Action.READ)
  async exportDowntimeReport(
    @Query() query: DowntimeReportQueryDto,
    @Res() res: Response
  ): Promise<void> {
    DowntimeReportController.parseRange(query.from, query.to);
    const buffer = await this.excelService.generateWorkbookBuffer(query);

    const areaLabel = query.areaId ? `area${query.areaId}` : 'todas';
    const fromLabel = query.from.slice(0, 10);
    const toLabel = query.to.slice(0, 10);
    const filename = `paros_${areaLabel}_${fromLabel}_${toLabel}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get('events')
  @RequirePermission(Module.REPORTS, Action.READ)
  async getEventReport(
    @Query() query: EventReportQueryDto
  ): Promise<EventReportResult & { message: string }> {
    DowntimeReportController.parseRange(query.from, query.to);
    const result = await this.reportService.getEventReport(query);
    return { message: 'Event report generated successfully', ...result };
  }
}
