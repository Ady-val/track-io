import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  constructor() {}

  // Endpoint liviano para healthchecks (Docker / balanceadores / servicios externos).
  // Interno: GET http://backend:3000/health · Externo vía nginx: GET /api/health
  @Get('health')
  health(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
