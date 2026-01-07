import { Controller, Get, Param, Logger } from '@nestjs/common';
import { DashboardService } from '../application/services/dashboard.service';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('api/dashboard')
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);

  constructor(private readonly dashboardService: DashboardService) {}

  @Get('areas-data')
  async getAreasData() {
    try {
      this.logger.log('Getting areas data for dashboard');

      const data = await this.dashboardService.getAreasWithEvents();
      const headers = await this.dashboardService.getDepartmentHeaders();

      return {
        success: true,
        headers,
        data,
      };
    } catch (error) {
      this.logger.error(
        `Error getting areas data: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        headers: [],
        data: [],
      };
    }
  }

  @Get('events/open')
  async getOpenEvents() {
    try {
      this.logger.log('Getting open events');
      const events = await this.dashboardService.getOpenEvents();

      return {
        success: true,
        data: events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting open events: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
      };
    }
  }

  @Get('events/in-progress')
  async getInProgressEvents() {
    try {
      this.logger.log('Getting in-progress events');
      const events = await this.dashboardService.getInProgressEvents();

      return {
        success: true,
        data: events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting in-progress events: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
      };
    }
  }

  @Get('events/closed')
  async getClosedEvents() {
    try {
      this.logger.log('Getting closed events');
      const events = await this.dashboardService.getClosedEvents();

      return {
        success: true,
        data: events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting closed events: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
      };
    }
  }

  @Get('events/closed/recent')
  async getRecentClosedEvents() {
    try {
      this.logger.log('Getting recent closed events (last 10)');
      const events = await this.dashboardService.getRecentClosedEvents(10);

      return {
        success: true,
        data: events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting recent closed events: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
      };
    }
  }

  @Get('events/all')
  async getAllEvents() {
    try {
      this.logger.log('Getting all events');
      const events = await this.dashboardService.getAllEvents();

      return {
        success: true,
        data: events,
        total: events.length,
      };
    } catch (error) {
      this.logger.error(
        `Error getting all events: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
      };
    }
  }

  @Get('events/area/:areaId')
  async getEventsByArea(@Param('areaId') areaId: string) {
    try {
      const areaIdNumber = parseInt(areaId, 10);
      this.logger.log(`Getting events for area ${areaIdNumber}`);

      const events = await this.dashboardService.getEventsByArea(areaIdNumber);

      return {
        success: true,
        data: events,
        total: events.length,
        areaId: areaIdNumber,
      };
    } catch (error) {
      this.logger.error(
        `Error getting events for area ${areaId}: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
        total: 0,
        areaId: parseInt(areaId, 10),
      };
    }
  }

  @Get('departments')
  async getDepartments() {
    try {
      this.logger.log('Getting department headers');
      const headers = await this.dashboardService.getDepartmentHeaders();

      return {
        success: true,
        data: headers,
      };
    } catch (error) {
      this.logger.error(
        `Error getting departments: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: [],
      };
    }
  }

  @Get('status')
  async getDashboardStatus() {
    try {
      this.logger.log('Getting dashboard status (active events only)');

      const [openEvents, inProgressEvents] = await Promise.all([
        this.dashboardService.getOpenEvents(),
        this.dashboardService.getInProgressEvents(),
      ]);

      return {
        success: true,
        data: {
          openEvents: openEvents.length,
          inProgressEvents: inProgressEvents.length,
          closedEvents: 0, // No se consultan eventos cerrados en el status principal
          totalEvents: openEvents.length + inProgressEvents.length,
        },
      };
    } catch (error) {
      this.logger.error(
        `Error getting dashboard status: ${(error as Error).message}`
      );
      return {
        success: false,
        error: (error as Error).message,
        data: {
          openEvents: 0,
          inProgressEvents: 0,
          closedEvents: 0,
          totalEvents: 0,
        },
      };
    }
  }
}
