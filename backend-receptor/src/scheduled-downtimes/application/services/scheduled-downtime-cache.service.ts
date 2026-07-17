import { Injectable, Logger } from '@nestjs/common';
import { ScheduledDowntimeRepository } from '../../domain/repositories/scheduled-downtime.repository';
import type { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';

/**
 * Caché en memoria del catálogo de paros programados por área.
 *
 * Motivo: AlertCronService corre con @Cron('* * * * * *') — CADA SEGUNDO — y
 * ahora necesita el catálogo para calcular minutos productivos (§1.6.5 del plan).
 * Sin caché serían N consultas por segundo (N = eventos abiertos), ~86,400×N por
 * día, contra una tabla que cambia una vez al mes.
 *
 * Estrategia: TTL corto + invalidación explícita desde el CRUD.
 * - La invalidación cubre el caso normal (un solo proceso backend).
 * - El TTL acota la obsolescencia si algún día se despliegan varias réplicas,
 *   donde la escritura de una réplica no invalida la caché de las otras.
 */
@Injectable()
export class ScheduledDowntimeCacheService {
  private readonly logger = new Logger(ScheduledDowntimeCacheService.name);
  private readonly ttlMs = 30_000;
  private readonly cache = new Map<
    number,
    { data: ScheduledDowntime[]; expiresAt: number }
  >();

  constructor(
    private readonly scheduledDowntimeRepository: ScheduledDowntimeRepository
  ) {}

  async getActiveByAreaId(areaId: number): Promise<ScheduledDowntime[]> {
    const cached = this.cache.get(areaId);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const data =
      await this.scheduledDowntimeRepository.findActiveByAreaId(areaId);

    this.cache.set(areaId, { data, expiresAt: Date.now() + this.ttlMs });

    return data;
  }

  /** Invalida un área concreta. Llamar desde el CRUD tras crear/editar/borrar. */
  invalidate(areaId: number): void {
    this.cache.delete(areaId);
    this.logger.debug(
      `Caché de paros programados invalidada para área ${areaId}`
    );
  }

  /** Invalida todo. Útil cuando un update cambia el areaId de un paro programado. */
  invalidateAll(): void {
    this.cache.clear();
    this.logger.debug('Caché de paros programados invalidada por completo');
  }
}
