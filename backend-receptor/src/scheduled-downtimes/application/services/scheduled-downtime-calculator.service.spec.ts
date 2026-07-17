import { Test, type TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ScheduledDowntimeCalculatorService } from './scheduled-downtime-calculator.service';
import { ScheduledDowntimeCacheService } from './scheduled-downtime-cache.service';
import type { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';

/**
 * IMPORTANTE: esta suite asume que el proceso corre en UTC (jest.config.ts fija
 * TZ=UTC vía globalSetup / process.env). Es deliberado: los contenedores de
 * producción corren en UTC y la planta está en America/Chihuahua. Si el motor
 * usara la hora local del proceso en vez de PLANT_TIMEZONE, los tests 10 y 11
 * fallarían — que es exactamente lo que queremos que pase.
 */

const PLANT_TZ = 'America/Chihuahua'; // UTC-6 (sin DST en 2026)

function buildScheduledDowntime(
  overrides: Partial<ScheduledDowntime> & {
    id: number;
    startTime: string;
    endTime: string;
    daysOfWeek: number[];
  }
): ScheduledDowntime {
  return {
    id: overrides.id,
    name: overrides.name ?? `Paro ${overrides.id}`,
    areaId: overrides.areaId ?? 1,
    startTime: overrides.startTime,
    endTime: overrides.endTime,
    daysOfWeek: overrides.daysOfWeek,
    isActive: overrides.isActive ?? true,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
    updatedAt: overrides.updatedAt ?? new Date('2026-01-01T00:00:00Z'),
  };
}

/** Hora de pared de la planta (UTC-6) → instante absoluto. */
function plant(dateTime: string): Date {
  return new Date(`${dateTime}-06:00`);
}

describe('ScheduledDowntimeCalculatorService', () => {
  let service: ScheduledDowntimeCalculatorService;
  let cache: jest.Mocked<ScheduledDowntimeCacheService>;

  beforeEach(async () => {
    const mockCache = { getActiveByAreaId: jest.fn() };
    const mockConfig = {
      get: jest.fn((key: string) =>
        key === 'plant.timezone' ? PLANT_TZ : undefined
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledDowntimeCalculatorService,
        { provide: ScheduledDowntimeCacheService, useValue: mockCache },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get(ScheduledDowntimeCalculatorService);
    cache = module.get(ScheduledDowntimeCacheService);
  });

  it('1. sin paros programados → 0 segundos descontados', async () => {
    cache.getActiveByAreaId.mockResolvedValue([]);

    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(result).toBe(0);
  });

  it('2. paro real contenido en la ventana → se descuenta completo', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '11:00',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
    ]);

    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T12:00:00'),
      plant('2026-07-13T13:00:00')
    );

    expect(result).toBe(3600);
  });

  it('3. paro real fuera de la ventana → 0', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
    ]);

    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T08:00:00'),
      plant('2026-07-13T09:00:00')
    );

    expect(result).toBe(0);
  });

  it('4. CASO DE ACEPTACIÓN: 11:30-13:30 vs ventana 12:00-13:00 → 3600 s descontados, 3600 s efectivos', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      }),
    ]);

    const start = plant('2026-07-13T11:30:00');
    const end = plant('2026-07-13T13:30:00');

    expect(await service.getDiscountedSeconds(1, start, end)).toBe(3600);
    expect(await service.getEffectiveSeconds(1, start, end)).toBe(3600);
  });

  it('5. paro real que cruza 2 días → descuenta ambas ocurrencias', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1, 2],
      }),
    ]);

    // Lunes 11:30 → martes 12:30 hora de planta.
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-14T12:30:00')
    );

    // Lunes completo (60 min) + martes parcial 12:00-12:30 (30 min) = 90 min.
    expect(result).toBe(90 * 60);
  });

  it('6. día no incluido en daysOfWeek → 0', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [2], // solo martes
      }),
    ]);

    // 2026-07-13 es lunes.
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(result).toBe(0);
  });

  it('7. dos paros programados traslapados entre sí → no duplica el tramo común', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 2,
        name: 'Junta',
        startTime: '12:30',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
    ]);

    // Unión de [12:00,13:00] y [12:30,14:00] = [12:00,14:00] = 120 min (no 150).
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:00:00'),
      plant('2026-07-13T15:00:00')
    );

    expect(result).toBe(120 * 60);
  });

  it('8. paros programados inactivos no llegan del caché → no descuentan', async () => {
    cache.getActiveByAreaId.mockResolvedValue([]);

    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(result).toBe(0);
    expect(cache.getActiveByAreaId).toHaveBeenCalledWith(1);
  });

  it('9. getEffectiveSeconds nunca es negativo', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      }),
    ]);

    const result = await service.getEffectiveSeconds(
      1,
      plant('2026-07-13T12:00:00'),
      plant('2026-07-13T12:30:00')
    );

    expect(result).toBeGreaterThanOrEqual(0);
  });

  it('10. ZONA HORARIA: la ventana 12:00 es hora de PLANTA, no del servidor (UTC)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      }),
    ]);

    // 11:30-13:30 HORA DE PLANTA → descuenta 60 min.
    expect(
      await service.getDiscountedSeconds(
        1,
        plant('2026-07-13T11:30:00'),
        plant('2026-07-13T13:30:00')
      )
    ).toBe(3600);

    // 11:30-13:30 UTC (= 05:30-07:30 hora de planta) → NO descuenta nada.
    // Si el motor usara la hora local del proceso (UTC), esto daría 3600 y
    // el test fallaría. Ese es justamente el bug que blinda esta prueba.
    expect(
      await service.getDiscountedSeconds(
        1,
        new Date('2026-07-13T11:30:00Z'),
        new Date('2026-07-13T13:30:00Z')
      )
    ).toBe(0);
  });

  it('11. VENTANA QUE CRUZA MEDIANOCHE: lunes 23:00 → martes 02:00', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida turno nocturno',
        startTime: '23:00',
        endTime: '02:00',
        daysOfWeek: [1], // ancla: LUNES (día en que la ventana arranca)
      }),
    ]);

    // Paro real: lunes 22:30 → martes 03:00 hora de planta (4.5 h).
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T22:30:00'),
      plant('2026-07-14T03:00:00')
    );

    // Descuenta lunes 23:00 → martes 02:00 = 3 h.
    expect(result).toBe(3 * 3600);
  });

  it('12. ventana nocturna anclada al lunes NO aplica al arrancar el martes 23:00', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '23:00',
        endTime: '02:00',
        daysOfWeek: [1], // solo lunes
      }),
    ]);

    // Martes 23:00 → miércoles 02:00: ninguna ventana anclada en martes.
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-14T23:00:00'),
      plant('2026-07-15T02:00:00')
    );

    expect(result).toBe(0);
  });

  it('13. ventana nocturna del día anterior que se cuela en el rango (martes 00:30-01:00)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '23:00',
        endTime: '02:00',
        daysOfWeek: [1], // ancla lunes
      }),
    ]);

    // El rango empieza el MARTES 00:30 — la ventana arrancó el LUNES.
    // Si el iterador no retrocediera un día ancla, esto daría 0.
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-14T00:30:00'),
      plant('2026-07-14T01:00:00')
    );

    expect(result).toBe(30 * 60);
  });

  it('14. día de la semana en frontera: evento a las 23:30 de planta es lunes aunque en UTC sea martes', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '23:00',
        endTime: '23:59',
        daysOfWeek: [1], // lunes hora de planta
      }),
    ]);

    // Lunes 23:30 planta = martes 05:30 UTC.
    const start = plant('2026-07-13T23:30:00');
    const end = plant('2026-07-13T23:50:00');
    expect(start.toISOString()).toBe('2026-07-14T05:30:00.000Z'); // martes en UTC

    expect(await service.getDiscountedSeconds(1, start, end)).toBe(20 * 60);
  });

  it('15. ESCALAMIENTO (D1): paro a las 12:40, ventana 13:00-14:00, umbral 30 min → escala hasta las 14:10', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '13:00',
        endTime: '14:00',
        daysOfWeek: [1, 2, 3, 4, 5],
      }),
    ]);

    const eventStart = plant('2026-07-13T12:40:00');

    // A las 13:10 (30 min de reloj): productivos = 20 min → NO debe escalar.
    const at1310 = await service.getEffectiveSeconds(
      1,
      eventStart,
      plant('2026-07-13T13:10:00')
    );
    expect(at1310).toBeLessThan(30 * 60);

    // A las 14:09: productivos = 29 min → todavía NO.
    const at1409 = await service.getEffectiveSeconds(
      1,
      eventStart,
      plant('2026-07-13T14:09:00')
    );
    expect(at1409).toBe(29 * 60);

    // A las 14:10: productivos = 30 min → AHORA SÍ escala.
    const at1410 = await service.getEffectiveSeconds(
      1,
      eventStart,
      plant('2026-07-13T14:10:00')
    );
    expect(at1410).toBe(30 * 60);
    expect(at1410).toBeGreaterThanOrEqual(30 * 60);
  });

  it('16. getDiscount devuelve rebanadas trazables con zona y valores congelados', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 7,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 8,
        name: 'Capacitación',
        startTime: '16:00',
        endTime: '17:00',
        daysOfWeek: [1],
      }),
    ]);

    const discount = await service.getDiscount(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(discount.totalDiscountedSeconds).toBe(3600);
    expect(discount.timezone).toBe(PLANT_TZ);
    expect(discount.slices).toHaveLength(1);
    expect(discount.slices[0]).toMatchObject({
      scheduledDowntimeId: 7,
      name: 'Comida',
      configuredStartTime: '12:00',
      configuredEndTime: '13:00',
      seconds: 3600,
    });
    // from/to son la OCURRENCIA REAL (12:00–13:00 hora de planta), no la ventana configurada.
    expect(discount.slices[0]!.from.toISOString()).toBe(
      plant('2026-07-13T12:00:00').toISOString()
    );
    expect(discount.slices[0]!.to.toISOString()).toBe(
      plant('2026-07-13T13:00:00').toISOString()
    );
  });

  it('17. rango inválido (end <= start) → 0 sin consultar el catálogo', async () => {
    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T13:00:00'),
      plant('2026-07-13T12:00:00')
    );

    expect(result).toBe(0);
    expect(cache.getActiveByAreaId).not.toHaveBeenCalled();
  });

  it('18. tolera el formato HH:mm:ss que devuelve Postgres para columnas `time`', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00:00',
        endTime: '13:00:00',
        daysOfWeek: [1],
      }),
    ]);

    const result = await service.getDiscountedSeconds(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(result).toBe(3600);
  });

  it('19. INVARIANTE total === Σ slices con dos paros traslapados; reparto disjunto determinista (§9.1.1/§9.1.4)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 2,
        name: 'Junta',
        startTime: '12:30',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
    ]);

    const discount = await service.getDiscount(
      1,
      plant('2026-07-13T11:00:00'),
      plant('2026-07-13T15:00:00')
    );

    // Total = unión = 120 min (idéntico al test 7 de Fase 1).
    expect(discount.totalDiscountedSeconds).toBe(120 * 60);

    // Invariante: total === Σ slices.
    const sum = discount.slices.reduce((acc, slice) => acc + slice.seconds, 0);
    expect(sum).toBe(discount.totalDiscountedSeconds);

    // Reparto determinista: Comida 12:00–13:00 = 60, Junta 13:00–14:00 = 60.
    const byId = new Map(
      discount.slices.map(slice => [slice.scheduledDowntimeId, slice.seconds])
    );
    expect(byId.get(1)).toBe(60 * 60);
    expect(byId.get(2)).toBe(60 * 60);
  });

  it('20. las rebanadas de un mismo cálculo NO se traslapan entre sí (§9.1.3)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 2,
        startTime: '12:30',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 3,
        startTime: '13:30',
        endTime: '15:00',
        daysOfWeek: [1],
      }),
    ]);

    const discount = await service.getDiscount(
      1,
      plant('2026-07-13T11:00:00'),
      plant('2026-07-13T16:00:00')
    );

    const sorted = [...discount.slices].sort(
      (a, b) => a.from.getTime() - b.from.getTime()
    );
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i]!.from.getTime()).toBeGreaterThanOrEqual(
        sorted[i - 1]!.to.getTime()
      );
    }

    const sum = discount.slices.reduce((acc, slice) => acc + slice.seconds, 0);
    expect(sum).toBe(discount.totalDiscountedSeconds);
    // Unión de [12:00,15:00] = 180 min.
    expect(discount.totalDiscountedSeconds).toBe(180 * 60);
  });

  it('21. getDiscountedSeconds === getDiscount().totalDiscountedSeconds (§9.1.5)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 2,
        startTime: '12:30',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
    ]);

    const from = plant('2026-07-13T11:00:00');
    const to = plant('2026-07-13T15:00:00');

    const seconds = await service.getDiscountedSeconds(1, from, to);
    const discount = await service.getDiscount(1, from, to);

    expect(seconds).toBe(discount.totalDiscountedSeconds);
  });

  it('22. evento que cruza dos días con la misma comida → DOS rebanadas con fechas distintas (§9.1.6)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1, 2],
      }),
    ]);

    // Lunes 11:30 → martes 13:30 hora de planta.
    const discount = await service.getDiscount(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-14T13:30:00')
    );

    expect(discount.slices).toHaveLength(2);
    expect(discount.slices[0]!.from.toISOString()).not.toBe(
      discount.slices[1]!.from.toISOString()
    );
    expect(discount.totalDiscountedSeconds).toBe(2 * 60 * 60);
  });

  it('23. determinismo: el reparto no depende del orden de entrada del catálogo', async () => {
    const build = () => [
      buildScheduledDowntime({
        id: 2,
        name: 'Junta',
        startTime: '12:30',
        endTime: '14:00',
        daysOfWeek: [1],
      }),
      buildScheduledDowntime({
        id: 1,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        daysOfWeek: [1],
      }),
    ];
    const from = plant('2026-07-13T11:00:00');
    const to = plant('2026-07-13T15:00:00');

    cache.getActiveByAreaId.mockResolvedValue(build());
    const a = await service.getDiscount(1, from, to);
    cache.getActiveByAreaId.mockResolvedValue(build().reverse());
    const b = await service.getDiscount(1, from, to);

    expect(JSON.stringify(a.slices)).toBe(JSON.stringify(b.slices));
  });

  it('24. instantes con milisegundos: el descuento NUNCA excede al crudo ⌊fin⌋−⌊inicio⌋ (evento cubierto por completo)', async () => {
    cache.getActiveByAreaId.mockResolvedValue([
      buildScheduledDowntime({
        id: 1,
        name: 'Ventana total',
        startTime: '00:00',
        endTime: '23:59',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      }),
    ]);

    // Timestamps reales de BD: llevan milisegundos. Antes del truncado a
    // segundo entero, ⌊fin−inicio⌋ (crudo) y Σ round(rebanadas) divergían en
    // ±1 s y un evento totalmente cubierto podía reportar descuento > crudo.
    const createdAt = new Date('2026-07-13T13:35:55.898Z');
    const inProgressAt = new Date('2026-07-13T13:36:00.465Z');
    const closedAt = new Date('2026-07-13T13:36:13.703Z');

    const response = await service.getDiscount(1, createdAt, inProgressAt);
    const resolution = await service.getDiscount(1, inProgressAt, closedAt);
    const discountTotal =
      response.totalDiscountedSeconds + resolution.totalDiscountedSeconds;

    const durationSeconds =
      Math.floor(closedAt.getTime() / 1000) -
      Math.floor(createdAt.getTime() / 1000);

    // Cubierto por completo → el descuento es EXACTAMENTE la duración.
    expect(discountTotal).toBe(durationSeconds);
    expect(await service.getEffectiveSeconds(1, createdAt, closedAt)).toBe(0);
  });
});
