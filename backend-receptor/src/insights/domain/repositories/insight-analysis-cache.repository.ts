import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { InsightAnalysisCache } from '../entities/insight-analysis-cache.entity';

export interface CreateInsightAnalysisCacheDto {
  cacheKey: string;
  startDate: Date;
  endDate: Date;
  areaId?: number;
  findingsJson: unknown;
  metaJson?: unknown;
  totalEventsAnalyzed: number;
  model: string;
  expiresAt: Date;
}

@Injectable()
export class InsightAnalysisCacheRepository {
  constructor(
    @InjectRepository(InsightAnalysisCache)
    private readonly repository: Repository<InsightAnalysisCache>
  ) {}

  /** Solo devuelve el registro si sigue vigente (expires_at > ahora). */
  async findValidByCacheKey(
    cacheKey: string
  ): Promise<InsightAnalysisCache | null> {
    const entry = await this.repository.findOne({ where: { cacheKey } });
    if (!entry || entry.expiresAt.getTime() <= Date.now()) {
      return null;
    }
    return entry;
  }

  /** Upsert por cacheKey: reemplaza cualquier entrada previa con el mismo key. */
  async upsert(dto: CreateInsightAnalysisCacheDto): Promise<void> {
    await this.repository.delete({ cacheKey: dto.cacheKey });
    await this.repository.save(this.repository.create(dto));
  }

  /** Limpia entradas vencidas. No es crítico: solo mantiene la tabla chica. */
  async deleteExpired(now: Date = new Date()): Promise<void> {
    await this.repository.delete({ expiresAt: LessThan(now) });
  }
}
