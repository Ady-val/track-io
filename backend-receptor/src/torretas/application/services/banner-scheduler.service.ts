import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TorretaRepository } from '../../domain/repositories/torreta.repository';
import { TorretaService } from './torreta.service';
import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
import { EventStatus } from '../../../events/domain/entities/event.entity';

@Injectable()
export class BannerSchedulerService {
  private readonly logger = new Logger(BannerSchedulerService.name);
  private lastColorByTorretaId = new Map<number, 'green'|'yellow'|'red'>();

  constructor(
    private readonly torretaRepository: TorretaRepository,
    private readonly torretaService: TorretaService,
    private readonly eventRepository: TypeOrmEventRepository
  ) {}

  // Cada 5 segundos
  @Cron('*/5 * * * * *')
  async handle(): Promise<void> {
    try {
      const torretas = await this.torretaRepository.findAllBannerTorretas();
      if (torretas.length === 0) return;

      for (const t of torretas) {
        // Solo procesar torretas activas y configuradas correctamente
        if (!t.isActive || !t.startRegister || !t.registerCount) continue;

        if (t.mode === 'AREA' && t.areaId) {
          const color = await this.getAreaColor(t.id, t.areaId);
          // Escribir solo si cambia el color para evitar saturar Modbus
          const last = this.lastColorByTorretaId.get(t.id);
          if (last !== color) {
            this.logger.log(
              `Banner color change for torreta ${t.id} (area ${t.areaId}): ${last ?? 'none'} -> ${color}`
            );
            try {
              await this.torretaService.setBannerColor(t.id, color);
              this.lastColorByTorretaId.set(t.id, color);
              this.logger.log(`✅ Successfully set torreta ${t.id} color to ${color}`);
            } catch (error) {
              this.logger.error(`❌ Failed to set torreta ${t.id} color to ${color}: ${(error as Error).message}`);
            }
          } else {
            // Log detallado cuando el color se mantiene igual
            this.logger.debug?.(`Torreta ${t.id} color remains ${color} (no change needed, last=${last ?? 'none'})`);
          }
        }
        // Futuro: modo DEPARTMENT cuando definamos reglas exactas
      }
    } catch (error) {
      this.logger.error(`Scheduler error: ${(error as Error).message}`);
    }
  }

  private async getAreaColor(
    torretaId: number,
    areaId: number
  ): Promise<'green'|'yellow'|'red'> {
    // Usar eventos activos por área para evitar inconsistencias
    const active = await this.eventRepository.findActiveByArea(areaId);

    const hasOpen = active.some(e => e.status === EventStatus.OPEN);
    const hasInProgress = active.some(e => e.status === EventStatus.IN_PROGRESS);

    // Log detallado de eventos activos
    const openEvents = active.filter(e => e.status === EventStatus.OPEN);
    const inProgressEvents = active.filter(e => e.status === EventStatus.IN_PROGRESS);

    this.logger.log(
      `Torreta ${torretaId} area ${areaId} - active events: ${active.length} (OPEN: ${openEvents.length}, IN_PROGRESS: ${inProgressEvents.length})`
    );

    // Si hay eventos IN_PROGRESS, mostrar detalles para debugging
    if (inProgressEvents.length > 0) {
      inProgressEvents.forEach(e => {
        this.logger.debug(
          `⚠️ Event ${e.id} in IN_PROGRESS status: Device=${e.device?.name || 'N/A'}, Signal=${e.deviceSignal?.name || 'N/A'}, Created=${e.createdAt}`
        );
      });
    }

    // Lógica ajustada: Solo eventos OPEN afectan el color
    // Los eventos IN_PROGRESS no bloquean el verde
    if (hasOpen) {
      this.logger.debug(`Torreta ${torretaId}: RED (${openEvents.length} OPEN events)`);
      return 'red';
    }
    // No hay eventos OPEN - siempre verde (independiente de IN_PROGRESS)
    this.logger.debug(`Torreta ${torretaId}: GREEN (no OPEN events, IN_PROGRESS=${inProgressEvents.length} ignored for banner color)`);
    return 'green';
  }
}


