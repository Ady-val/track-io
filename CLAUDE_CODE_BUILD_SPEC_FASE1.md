# BUILD SPEC — Fase 1: Paros Programados (TrackIQ)

> **Para:** Claude Code, ejecutando en el checkout local de
> `https://github.com/Ady-val/track-io.git` (rama `main`, commit base `819cc09`).
>
> **Revisión 2.** Sustituye por completo a la revisión 1, que quedó obsoleta al incorporar las
> decisiones D1 (escalamiento por minutos productivos) y D2 (ventanas que cruzan medianoche).
> **No reutilices nada de la revisión 1: tenía un bug de zona horaria y un modelo de datos que
> no soporta turnos nocturnos.**
>
> **Origen:** esta especificación se derivó de una implementación completa **construida y
> verificada de punta a punta** en un entorno sandbox equivalente. Resultados reales:
>
> | Verificación | Resultado |
> |---|---|
> | Suite completa del backend | **975/975 tests en verde, 69/69 suites** |
> | Tests del motor de cálculo (nuevos) | **18/18 en verde** |
> | Prueba de mutación del bug de zona horaria | **8 tests fallan al reintroducir el bug** → las guardas son reales, no placebo |
> | `tsc --noEmit` backend | **143 errores = línea base exacta.** El código nuevo aporta **0** |
> | `tsc --noEmit` frontend | **0 errores** |
> | `eslint` en archivos nuevos/tocados | **0 errores, 0 warnings** |
>
> El contenido de cada archivo nuevo y el diff de cada archivo existente que aparecen en este
> documento **son el código exacto que produjo esos resultados**. Aplícalos tal cual; no hace
> falta rederivar la lógica.
>
> **Documento de diseño relacionado** (contexto de negocio, alternativas descartadas,
> escalabilidad): `documentation/PLAN_MIGRACION_IOTRACK.md`. Este documento es el "cómo"; aquel
> es el "por qué".

---

## 0. Qué se construye

Un módulo nuevo, `scheduled-downtimes`, que implementa el catálogo de **paros programados**
(ventanas horarias recurrentes por área: comida, cambio de turno, capacitación, fuera de
horario) y el **motor de cálculo** que descuenta ese tiempo de los paros reales.

El módulo se integra en **tres puntos** del sistema:

| Punto de integración | Archivo | Qué cambia |
|---|---|---|
| Cierre de evento | `signals/application/services/signal.service.ts` | Congela crudo/descuento/efectivo + traza |
| Cierre de downtime de área | `area-downtime/application/services/area-downtime.service.ts` | Igual, sobre el intervalo del área |
| Escalamiento (**D1**) | `alert-escalation/application/services/alert-cron.service.ts` | El reloj cuenta **minutos productivos**, no de pared |

### 0.1 Los dos casos de aceptación del negocio

**Caso A — descuento en el reporte:**
> Paro programado "Comida" de 12:00 a 13:00. La línea queda detenida por mantenimiento de 11:30
> a 13:30 (120 min de reloj). Debe reportar **60 minutos productivos perdidos**, no 120.

**Caso B — escalamiento (D1):**
> Paro programado de 13:00 a 14:00. La línea cae a las 12:40. El umbral de escalamiento es de
> 30 min. El escalamiento **no** debe salir a las 13:10 (30 min de reloj, pero solo 20
> productivos): debe salir a las **14:10**.

Ambos están cubiertos por tests automatizados (tests 4 y 15 de §4).

### 0.2 Decisiones de diseño que debes respetar

1. **Se persiste crudo + descuento + efectivo + traza** (Opción C), congelados al cerrar. El
   crudo (`duration_seconds`) es un hecho medido y **nunca se sobrescribe**; el descuento y el
   efectivo son interpretaciones derivadas de una configuración que puede cambiar.
2. **Zona horaria explícita (`PLANT_TIMEZONE`).** Los contenedores corren en UTC
   (docker-compose no define `TZ`) y `start_time = '12:00'` es hora de pared de la planta. Sin
   esto, "la comida de las 12" se descontaría a las 6:00 a.m. **silenciosamente**. Ver §2.1.
3. **Ventanas ancladas al día de INICIO** (modelo `DTSTART`+`DURATION` de RFC 5545). Si
   `end_time < start_time`, la ventana cierra al día siguiente. "Lunes 23:00 → martes 02:00" se
   captura como `daysOfWeek: [1], startTime: '23:00', endTime: '02:00'`. Ver §2.2.
4. **Segundos enteros**, nunca minutos flotantes: preserva la identidad
   `effective = raw − discount` sin deriva de redondeo y encaja con
   `events.duration_seconds` (`integer`).
5. **El cierre de un evento Andon es sagrado.** Si el cálculo falla, el evento se cierra igual
   con `discount = 0`. Una llamada que no se puede cerrar deja la línea en rojo para siempre.
6. **Caché obligatoria.** `AlertCronService` corre con `@Cron('* * * * * *')` — **cada
   segundo**. Sin caché, D1 añadiría N consultas/segundo a la BD.

---

## 1. Prerrequisitos

1. Working tree limpio en `main`, actualizado (`git pull origin main`).
2. **No se agregan dependencias npm.** La zona horaria se resuelve con `Intl` (API estándar de
   Node, ICU completo verificado disponible). El backend no tiene librería de fechas y **no
   debe agregarse una**.
3. PostgreSQL accesible con las variables de entorno del proyecto, para correr las migraciones.

---

## 2. Los dos puntos que más fácil se rompen

### 2.1 Zona horaria — verificado, no teórico

El bug, demostrado ejecutándolo en el sandbox:

```
Servidor en UTC, new Date(2026, 6, 13, 12, 0) => 2026-07-13T12:00:00.000Z
Eso en Chihuahua (UTC-6) es:                     13/7/2026, 6:00:00 a.m.
```

La solución, también verificada:

```
Ventana 12:00 planta => 2026-07-13T18:00:00.000Z => 13/7/2026, 12:00:00 p.m.  ✅
Ventana 13:00 planta => 2026-07-13T19:00:00.000Z => 13/7/2026,  1:00:00 p.m.  ✅
```

Reglas que **no** puedes romper:
- El día de la semana y el recorrido de días se calculan **en calendario de planta**, no del
  servidor. Un evento a las 23:00 hora de planta es "lunes" aunque en UTC ya sea martes.
- `jest.config.js` fuerza `process.env.TZ = 'UTC'` a propósito: si un desarrollador tiene su
  máquina en hora de México, los tests seguirían pasando con el bug presente. **No lo quites.**
- La zona usada queda grabada en cada snapshot, para poder auditar cálculos viejos.

### 2.2 Ventanas que cruzan medianoche — modelo anclado al inicio

Investigación de referencia (así lo resuelven los sistemas serios):

| Sistema | Modelo |
|---|---|
| **RFC 5545 (iCalendar)** — el estándar | `DTSTART` + `DURATION` con `TZID`; la recurrencia se ancla al inicio y la duración aplica a toda la serie |
| **ProModel** (simulación MES) | Calendarios de turno con horas de inicio y **duraciones** |
| **7shifts** | El bloque nocturno debe empezar antes de medianoche y extenderse más allá |
| **MS Project** ❌ antipatrón | Rechaza `fin <= inicio` y obliga a partir el turno en dos filas |

Modelo adoptado: **`daysOfWeek` son los días en que la ventana ARRANCA**; si
`end_time < start_time`, cierra al día siguiente. Equivale a `DTSTART`+`DURATION`, pero expresado
con hora de fin porque es lo que el usuario captura.

Consecuencia algorítmica **crítica y fácil de omitir**: al recorrer los días de un rango hay que
empezar **un día antes**, porque una ventana anclada el lunes 23:00 se cuela en el martes 00:30.
El test 13 de §4 existe justo para atrapar ese olvido.

Casos que el cliente debe poder capturar:
- `"Todos los lunes a viernes de 12:00 a 13:00"` → `daysOfWeek: [1,2,3,4,5]`, `12:00`→`13:00`
- `"Lunes 23:00 hasta martes 02:00"` → `daysOfWeek: [1]`, `23:00`→`02:00`

`start_time == end_time` se **rechaza** con `400` (ambiguo: ¿0 h o 24 h?).

---

## 3. Checklist de archivos

### 3.1 Archivos NUEVOS — backend (contenido íntegro en §5)

| # | Archivo |
|---|---|
| 1 | `backend-receptor/src/config/plant-timezone.config.ts` |
| 2 | `backend-receptor/src/scheduled-downtimes/domain/entities/scheduled-downtime.entity.ts` |
| 3 | `backend-receptor/src/scheduled-downtimes/domain/repositories/scheduled-downtime.repository.ts` |
| 4 | `backend-receptor/src/scheduled-downtimes/application/dtos/scheduled-downtime.dto.ts` |
| 5 | `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-cache.service.ts` |
| 6 | `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-calculator.service.ts` |
| 7 | `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-calculator.service.spec.ts` |
| 8 | `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime.service.ts` |
| 9 | `backend-receptor/src/scheduled-downtimes/controllers/scheduled-downtime.controller.ts` |
| 10 | `backend-receptor/src/scheduled-downtimes/scheduled-downtimes.module.ts` |
| 11 | `backend-receptor/src/migrations/1785000000000-CreateScheduledDowntimes.ts` |
| 12 | `backend-receptor/src/migrations/1785000000001-AddScheduledDowntimeSnapshotColumns.ts` |

### 3.2 Archivos NUEVOS — frontend (contenido íntegro en §6)

| # | Archivo |
|---|---|
| 13 | `dashboard-test/src/types/scheduled-downtime.ts` |
| 14 | `dashboard-test/src/components/organisms/catalogs/ScheduledDowntimesCatalog.tsx` |

### 3.3 Archivos EXISTENTES a modificar (diffs reales en §7)

**Backend — integración (lo delicado):**

| # | Archivo | Cambio |
|---|---|---|
| 15 | `src/signals/application/services/signal.service.ts` | Snapshot al cerrar evento + degradación segura |
| 16 | `src/area-downtime/application/services/area-downtime.service.ts` | Snapshot al cerrar downtime del área |
| 17 | `src/alert-escalation/application/services/alert-cron.service.ts` | **D1**: escalamiento por minutos productivos |
| 18 | `src/events/domain/entities/event.entity.ts` | 3 columnas nuevas |
| 19 | `src/area-downtime/domain/entities/area-downtime.entity.ts` | 4 columnas nuevas |
| 20 | `src/area-downtime/domain/repositories/area-downtime.repository.ts` | `UpdateAreaDowntimeDto` extendido |

**Backend — cableado:**

| # | Archivo | Cambio |
|---|---|---|
| 21 | `src/app.module.ts` | Registrar `ScheduledDowntimesModule` + `plantTimezoneConfig` |
| 22 | `src/permissions/constants/permissions.constants.ts` | `SCHEDULED_DOWNTIMES` en el enum `Module` |
| 23 | `src/signals/signals.module.ts` | Importar `ScheduledDowntimesModule` |
| 24 | `src/area-downtime/area-downtime.module.ts` | Idem |
| 25 | `src/alert-escalation/alert-escalation.module.ts` | Idem |
| 26 | `jest.config.js` | Forzar `TZ=UTC` |

**Backend — specs existentes que hay que actualizar** (cambiaron los constructores; sin esto
fallan 62 tests):

| # | Archivo | Cambio |
|---|---|---|
| 27 | `src/signals/application/services/signal.service.spec.ts` | Mock del calculador |
| 28 | `src/area-downtime/application/services/area-downtime.service.spec.ts` | Mock + asserts nuevos + mock de `findById` |
| 29 | `src/alert-escalation/application/services/alert-cron.service.spec.ts` | Mock del calculador |

**Frontend:**

| # | Archivo | Cambio |
|---|---|---|
| 30 | `src/hooks/useCatalogs.ts` | Interfaz + `catalogApi` + hooks React Query |
| 31 | `src/lib/validations/schemas.ts` | Schemas Zod (permitiendo ventanas nocturnas) |
| 32 | `src/pages/CatalogsPage.tsx` | Pestaña "Paros Programados" |
| 33 | `src/components/atoms/Icon.tsx` | Ícono `clock` |
| 34 | `src/constants/permissions.ts` | `SCHEDULED_DOWNTIMES` en el enum espejo |

**Orden recomendado:** §5 (backend nuevo) → §7.1-§7.2 (cableado backend) → §8 (migraciones) →
§7.3 (specs) → verificar backend (§9.1) → §6 + §7.4 (frontend) → verificar frontend (§9.2).

---

## 4. Los tests del motor de cálculo (léelos primero)

El spec del calculador es el contrato ejecutable de esta fase. Los 18 tests cubren:

| # | Test | Por qué importa |
|---|---|---|
| 1-3 | Sin paros / contenido / fuera de ventana | Base |
| **4** | **Caso A del negocio: 11:30-13:30 vs 12:00-13:00 → 3600 s** | Criterio de aceptación |
| 5 | Paro que cruza 2 días | Recurrencia diaria |
| 6 | Día no incluido en `daysOfWeek` | Filtro por día |
| 7 | Dos paros traslapados entre sí | Unión de intervalos (no doble conteo) |
| 8 | Paros inactivos | Filtro `isActive` |
| 9 | Efectivo nunca negativo | Robustez |
| **10** | **Zona horaria: 12:00 es hora de PLANTA, no del servidor** | Blindaje del bug de §2.1 |
| **11-13** | **Ventanas que cruzan medianoche** (incl. la que se cuela del día anterior) | D2 |
| 14 | Día de la semana en frontera (23:30 planta = martes en UTC) | D2 |
| **15** | **Caso B del negocio: escalamiento 12:40 → 14:10** | D1 |
| 16 | Traza congelable del snapshot | Auditoría |
| 17-18 | Rango inválido / formato `HH:mm:ss` de Postgres | Robustez |

> **Prueba de mutación ejecutada:** al reintroducir a propósito el bug de zona horaria
> (usar la hora local del proceso en vez de `PLANT_TIMEZONE`), **8 de estos tests
> fallan**, incluidos el 4, el 10, el 11, el 13 y el 14. Las guardas son reales.

El contenido completo del spec está en §5 (archivo #7).

---

## 5. Backend — contenido completo de los archivos nuevos

Crea cada archivo con **exactamente** este contenido.

### `backend-receptor/src/config/plant-timezone.config.ts`

**#1.** Zona horaria de planta, con validación al arranque (falla rápido en vez de degradar a UTC en silencio).

```ts
import { registerAs } from '@nestjs/config';

export interface PlantTimezoneConfig {
  timezone: string;
}

/**
 * Zona horaria de la planta (IANA, ej. 'America/Chihuahua').
 *
 * Las horas de los paros programados (`scheduled_downtimes.start_time` /
 * `end_time`) son HORAS DE PARED de la planta, no UTC ni hora del servidor.
 * Los contenedores corren en UTC (docker-compose no define TZ), así que sin
 * esta configuración una ventana de "12:00" se resolvería a las 06:00 hora de
 * planta. Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.4.
 *
 * Se valida al cargar: una zona inválida hace fallar el arranque en vez de
 * degradar silenciosamente a UTC y producir descuentos incorrectos.
 */
export default registerAs('plant', (): PlantTimezoneConfig => {
  const timezone = process.env['PLANT_TIMEZONE'] || 'America/Mexico_City';

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new Error(
      `PLANT_TIMEZONE inválida: '${timezone}'. Debe ser un identificador IANA ` +
        `válido (ej. 'America/Chihuahua', 'America/Mexico_City').`
    );
  }

  return { timezone };
});
```

### `backend-receptor/src/scheduled-downtimes/domain/entities/scheduled-downtime.entity.ts`

**#2.** Entidad del catálogo.

```ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Area } from '../../../areas/domain/entities/area.entity';

/**
 * Paro programado: ventana horaria recurrente (por día de la semana) durante la
 * cual un área se considera detenida "a propósito" (comida, cambio de turno,
 * capacitación, fuera de horario laboral, etc.) y por lo tanto ese tiempo debe
 * descontarse de los cálculos de tiempo de paro real.
 *
 * daysOfWeek usa la misma convención que Date.getDay() de JS: 0 = domingo … 6 = sábado.
 */
@Entity('scheduled_downtimes')
@Index(['areaId'])
@Index(['areaId', 'isActive'])
export class ScheduledDowntime {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ name: 'area_id', type: 'integer' })
  areaId!: number;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({ name: 'days_of_week', type: 'jsonb' })
  daysOfWeek!: number[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp with time zone',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp with time zone',
  })
  updatedAt!: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamp with time zone',
  })
  deletedAt?: Date;

  @ManyToOne(() => Area, { eager: true })
  @JoinColumn({ name: 'area_id' })
  area?: Area;
}
```

### `backend-receptor/src/scheduled-downtimes/domain/repositories/scheduled-downtime.repository.ts`

**#3.** Repositorio.

```ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduledDowntime } from '../entities/scheduled-downtime.entity';

export interface CreateScheduledDowntimeDto {
  name: string;
  areaId: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive?: boolean;
}

export interface UpdateScheduledDowntimeDto {
  name?: string;
  areaId?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive?: boolean;
}

export interface ScheduledDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

@Injectable()
export class ScheduledDowntimeRepository {
  constructor(
    @InjectRepository(ScheduledDowntime)
    private readonly scheduledDowntimeRepository: Repository<ScheduledDowntime>
  ) {}

  async create(
    createDto: CreateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    const scheduledDowntime =
      this.scheduledDowntimeRepository.create(createDto);
    return await this.scheduledDowntimeRepository.save(scheduledDowntime);
  }

  async findAll(filters: ScheduledDowntimeFilters = {}): Promise<{
    data: ScheduledDowntime[];
    total: number;
  }> {
    const queryBuilder =
      this.scheduledDowntimeRepository.createQueryBuilder('scheduledDowntime');

    if (!filters.includeDeleted) {
      queryBuilder.andWhere('scheduledDowntime.deletedAt IS NULL');
    }

    if (filters.areaId) {
      queryBuilder.andWhere('scheduledDowntime.areaId = :areaId', {
        areaId: filters.areaId,
      });
    }

    if (filters.isActive !== undefined) {
      queryBuilder.andWhere('scheduledDowntime.isActive = :isActive', {
        isActive: filters.isActive,
      });
    }

    if (filters.name) {
      queryBuilder.andWhere('scheduledDowntime.name ILIKE :name', {
        name: `%${filters.name}%`,
      });
    }

    queryBuilder.orderBy('scheduledDowntime.createdAt', 'DESC');

    const total = await queryBuilder.getCount();

    if (filters.limit) {
      queryBuilder.limit(filters.limit);
    }

    if (filters.offset) {
      queryBuilder.offset(filters.offset);
    }

    const data = await queryBuilder.getMany();

    return { data, total };
  }

  /**
   * Paros programados activos (no borrados, isActive = true) de un área, sin
   * paginación: es el que consume el motor de cálculo de traslape.
   */
  async findActiveByAreaId(areaId: number): Promise<ScheduledDowntime[]> {
    return await this.scheduledDowntimeRepository.find({
      where: { areaId, isActive: true },
    });
  }

  async findById(id: number): Promise<ScheduledDowntime | null> {
    return await this.scheduledDowntimeRepository.findOne({
      where: { id },
      withDeleted: false,
    });
  }

  async update(
    id: number,
    updateData: UpdateScheduledDowntimeDto
  ): Promise<ScheduledDowntime | null> {
    await this.scheduledDowntimeRepository.update(id, updateData);
    return await this.findById(id);
  }

  async softDelete(id: number): Promise<boolean> {
    const result = await this.scheduledDowntimeRepository.softDelete(id);
    return !!result.affected && result.affected > 0;
  }

  async restore(id: number): Promise<boolean> {
    const result = await this.scheduledDowntimeRepository.restore(id);
    return !!result.affected && result.affected > 0;
  }

  async count(): Promise<number> {
    return await this.scheduledDowntimeRepository.count();
  }
}
```

### `backend-receptor/src/scheduled-downtimes/application/dtos/scheduled-downtime.dto.ts`

**#4.** DTOs.

```ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsPositive,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  Matches,
  Min,
  Max,
} from 'class-validator';
import { Exclude, Expose, Type } from 'class-transformer';

const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const TIME_FORMAT_MESSAGE = 'debe tener formato HH:mm (ej. 12:00)';

/**
 * Nota sobre ventanas que cruzan medianoche (ver PLAN_MIGRACION_IOTRACK.md §1.4b):
 * `endTime` PUEDE ser menor que `startTime`. Eso significa que la ventana cierra
 * al día siguiente (ej. 23:00 -> 02:00), siguiendo el modelo DTSTART+DURATION de
 * RFC 5545: `daysOfWeek` son los días en que la ventana ARRANCA.
 * Lo único inválido es `endTime === startTime` (ambiguo: 0 h o 24 h), y eso se
 * valida en ScheduledDowntimeService porque involucra dos campos.
 */

export class CreateScheduledDowntimeDto {
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name is required' })
  name!: string;

  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId!: number;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `startTime ${TIME_FORMAT_MESSAGE}` })
  startTime!: string;

  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `endTime ${TIME_FORMAT_MESSAGE}` })
  endTime!: string;

  @IsArray({ message: 'daysOfWeek must be an array' })
  @ArrayNotEmpty({ message: 'daysOfWeek cannot be empty' })
  @ArrayUnique({ message: 'daysOfWeek cannot contain duplicate values' })
  @IsInt({ each: true, message: 'each day in daysOfWeek must be an integer' })
  @Min(0, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  @Max(6, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  daysOfWeek!: number[];

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

export class UpdateScheduledDowntimeDto {
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  @IsNotEmpty({ message: 'name cannot be empty' })
  name?: string;

  @IsOptional()
  @IsInt({ message: 'areaId must be an integer' })
  @IsPositive({ message: 'areaId must be a positive integer' })
  areaId?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `startTime ${TIME_FORMAT_MESSAGE}` })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_FORMAT_REGEX, { message: `endTime ${TIME_FORMAT_MESSAGE}` })
  endTime?: string;

  @IsOptional()
  @IsArray({ message: 'daysOfWeek must be an array' })
  @ArrayNotEmpty({ message: 'daysOfWeek cannot be empty' })
  @ArrayUnique({ message: 'daysOfWeek cannot contain duplicate values' })
  @IsInt({ each: true, message: 'each day in daysOfWeek must be an integer' })
  @Min(0, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  @Max(6, { each: true, message: 'daysOfWeek values must be between 0 and 6' })
  daysOfWeek?: number[];

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}

class ScheduledDowntimeAreaDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;
}

@Expose()
export class ScheduledDowntimeResponseDto {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  areaId!: number;

  @Expose()
  @Type(() => ScheduledDowntimeAreaDto)
  area?: ScheduledDowntimeAreaDto;

  @Expose()
  startTime!: string;

  @Expose()
  endTime!: string;

  @Expose()
  daysOfWeek!: number[];

  @Expose()
  isActive!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Exclude()
  deletedAt?: Date;
}
```

### `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-cache.service.ts`

**#5.** Caché del catálogo. **Obligatoria**: el cron de escalamiento corre cada segundo.

```ts
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
```

### `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-calculator.service.ts`

**#6. El corazón de la fase.** Zona horaria, cruce de medianoche, unión de intervalos, segundos enteros.

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ScheduledDowntimeCacheService } from './scheduled-downtime-cache.service';
import type { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';

export interface ScheduledDowntimeSnapshotItem {
  scheduledDowntimeId: number;
  name: string;
  startTime: string;
  endTime: string;
  discountedSeconds: number;
}

export interface ScheduledDowntimeSnapshot {
  calculatedAt: string;
  timezone: string;
  rangeStart: string;
  rangeEnd: string;
  totalDiscountedSeconds: number;
  items: ScheduledDowntimeSnapshotItem[];
}

interface TimeInterval {
  start: Date;
  end: Date;
}

/** Fecha de calendario de la planta (sin hora, sin zona). month: 1-12. */
interface PlantDate {
  year: number;
  month: number;
  day: number;
}

/**
 * Motor de cálculo de traslape entre un rango de tiempo real (evento cerrado,
 * AreaDowntime, evento abierto para escalamiento, o rango de reporte) y los
 * paros programados activos de un área.
 *
 * Sin estado, independiente del CRUD y de la capa HTTP. Consumidores:
 *  - SignalService.closeEvent()            → snapshot del evento
 *  - AreaDowntimeService.endAreaDowntime() → snapshot del downtime del área
 *  - AlertCronService                      → minutos productivos para escalar
 *  - Fase 2 (Reportes)                     → agregados por rango
 *
 * Decisiones de diseño (ver documentation/PLAN_MIGRACION_IOTRACK.md):
 *  - §1.4 Zona horaria: start_time/end_time son HORAS DE PARED de la planta.
 *  - §1.4b Ventanas que cruzan medianoche: la recurrencia se ancla al DÍA DE
 *    INICIO (modelo DTSTART+DURATION de RFC 5545). Si endTime < startTime, la
 *    ventana cierra al día siguiente.
 *  - §1.5 Unidad: segundos enteros (events.duration_seconds ya es integer).
 */
@Injectable()
export class ScheduledDowntimeCalculatorService {
  constructor(
    private readonly cache: ScheduledDowntimeCacheService,
    private readonly configService: ConfigService
  ) {}

  private get timezone(): string {
    return (
      this.configService.get<string>('plant.timezone') ?? 'America/Mexico_City'
    );
  }

  /**
   * Segundos de [rangeStart, rangeEnd) cubiertos por paros programados activos
   * del área. Si dos paros programados se traslapan entre sí, los segundos
   * comunes se cuentan una sola vez.
   */
  async getDiscountedSeconds(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number> {
    const snapshot = await this.getDiscountSnapshot(
      areaId,
      rangeStart,
      rangeEnd
    );
    return snapshot.totalDiscountedSeconds;
  }

  /** Segundos productivos = crudo − descuento. Nunca negativo. */
  async getEffectiveSeconds(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<number> {
    const rawSeconds = Math.max(
      0,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 1000)
    );
    const discounted = await this.getDiscountedSeconds(
      areaId,
      rangeStart,
      rangeEnd
    );

    return Math.max(0, rawSeconds - discounted);
  }

  /** Cálculo completo + traza congelable como snapshot jsonb. */
  async getDiscountSnapshot(
    areaId: number,
    rangeStart: Date,
    rangeEnd: Date
  ): Promise<ScheduledDowntimeSnapshot> {
    const timezone = this.timezone;

    const empty: ScheduledDowntimeSnapshot = {
      calculatedAt: new Date().toISOString(),
      timezone,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      totalDiscountedSeconds: 0,
      items: [],
    };

    if (rangeEnd.getTime() <= rangeStart.getTime()) {
      return empty;
    }

    const scheduledDowntimes = await this.cache.getActiveByAreaId(areaId);

    if (scheduledDowntimes.length === 0) {
      return empty;
    }

    const allIntervals: TimeInterval[] = [];
    const perDowntime = new Map<number, TimeInterval[]>();

    // El día ancla se recorre desde UN DÍA ANTES del inicio del rango: una
    // ventana que arranca el lunes 23:00 y cierra el martes 02:00 debe
    // considerarse aunque el rango empiece el martes 00:30.
    const firstAnchor = this.addDays(
      this.plantDateOf(rangeStart, timezone),
      -1
    );
    const lastAnchor = this.plantDateOf(rangeEnd, timezone);

    for (const anchor of this.eachPlantDay(firstAnchor, lastAnchor)) {
      const dayOfWeek = this.plantDayOfWeek(anchor);

      for (const downtime of scheduledDowntimes) {
        if (!downtime.daysOfWeek.includes(dayOfWeek)) {
          continue;
        }

        const windowStart = this.wallClockToInstant(
          anchor,
          downtime.startTime,
          timezone
        );
        const endAnchor = this.crossesMidnight(downtime)
          ? this.addDays(anchor, 1)
          : anchor;
        const windowEnd = this.wallClockToInstant(
          endAnchor,
          downtime.endTime,
          timezone
        );

        const overlapStart =
          rangeStart > windowStart ? rangeStart : windowStart;
        const overlapEnd = rangeEnd < windowEnd ? rangeEnd : windowEnd;

        if (overlapStart.getTime() >= overlapEnd.getTime()) {
          continue;
        }

        const interval: TimeInterval = { start: overlapStart, end: overlapEnd };
        allIntervals.push(interval);

        const existing = perDowntime.get(downtime.id) ?? [];
        existing.push(interval);
        perDowntime.set(downtime.id, existing);
      }
    }

    const totalDiscountedSeconds = this.sumMergedSeconds(allIntervals);

    const items: ScheduledDowntimeSnapshotItem[] = scheduledDowntimes
      .filter(downtime => perDowntime.has(downtime.id))
      .map(downtime => ({
        scheduledDowntimeId: downtime.id,
        name: downtime.name,
        startTime: this.normalizeTime(downtime.startTime),
        endTime: this.normalizeTime(downtime.endTime),
        discountedSeconds: this.sumMergedSeconds(
          perDowntime.get(downtime.id) ?? []
        ),
      }));

    return {
      calculatedAt: new Date().toISOString(),
      timezone,
      rangeStart: rangeStart.toISOString(),
      rangeEnd: rangeEnd.toISOString(),
      totalDiscountedSeconds,
      items,
    };
  }

  /**
   * Una ventana cruza medianoche cuando su hora de fin es menor que la de
   * inicio (ej. 23:00 → 02:00). El caso start == end se rechaza en el Service
   * por ambiguo (¿0 h o 24 h?), así que aquí no puede llegar.
   */
  private crossesMidnight(downtime: ScheduledDowntime): boolean {
    return (
      this.normalizeTime(downtime.endTime) <
      this.normalizeTime(downtime.startTime)
    );
  }

  /** Postgres devuelve `time` como 'HH:mm:ss'; la API los maneja como 'HH:mm'. */
  private normalizeTime(time: string): string {
    return time.slice(0, 5);
  }

  /** Fecha de calendario de la planta correspondiente a un instante absoluto. */
  private plantDateOf(instant: Date, timeZone: string): PlantDate {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const map: Record<string, number> = {};
    for (const part of dtf.formatToParts(instant)) {
      if (part.type !== 'literal') map[part.type] = Number(part.value);
    }

    return {
      year: map['year']!,
      month: map['month']!,
      day: map['day']!,
    };
  }

  /** Día de la semana (0=domingo) de una fecha de calendario. */
  private plantDayOfWeek(date: PlantDate): number {
    return new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay();
  }

  private addDays(date: PlantDate, days: number): PlantDate {
    const shifted = new Date(
      Date.UTC(date.year, date.month - 1, date.day + days)
    );

    return {
      year: shifted.getUTCFullYear(),
      month: shifted.getUTCMonth() + 1,
      day: shifted.getUTCDate(),
    };
  }

  private eachPlantDay(from: PlantDate, to: PlantDate): PlantDate[] {
    const days: PlantDate[] = [];
    let cursor = from;
    const limit = Date.UTC(to.year, to.month - 1, to.day);

    while (Date.UTC(cursor.year, cursor.month - 1, cursor.day) <= limit) {
      days.push(cursor);
      cursor = this.addDays(cursor, 1);
    }

    return days;
  }

  /** Hora de pared de la planta (fecha + 'HH:mm') → instante absoluto. */
  private wallClockToInstant(
    date: PlantDate,
    time: string,
    timeZone: string
  ): Date {
    const [hours, minutes] = this.normalizeTime(time).split(':').map(Number);
    const guess = Date.UTC(date.year, date.month - 1, date.day, hours, minutes);

    const offset1 = this.getTimeZoneOffsetMs(new Date(guess), timeZone);
    let result = guess - offset1;

    // Segunda pasada: cubre transiciones de horario de verano.
    const offset2 = this.getTimeZoneOffsetMs(new Date(result), timeZone);
    if (offset2 !== offset1) {
      result = guess - offset2;
    }

    return new Date(result);
  }

  /** Offset (ms) de una zona IANA en un instante dado. */
  private getTimeZoneOffsetMs(date: Date, timeZone: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const map: Record<string, number> = {};
    for (const part of dtf.formatToParts(date)) {
      if (part.type !== 'literal') map[part.type] = Number(part.value);
    }

    const asUTC = Date.UTC(
      map['year']!,
      map['month']! - 1,
      map['day'],
      map['hour']! % 24,
      map['minute'],
      map['second']
    );

    return asUTC - date.getTime();
  }

  /**
   * Merge de intervalos solapados + suma. Garantiza que dos paros programados
   * que se traslapan entre sí no descuenten dos veces los mismos segundos.
   */
  private sumMergedSeconds(intervals: TimeInterval[]): number {
    if (intervals.length === 0) {
      return 0;
    }

    const sorted = [...intervals].sort(
      (a, b) => a.start.getTime() - b.start.getTime()
    );

    const merged: TimeInterval[] = [
      { start: sorted[0]!.start, end: sorted[0]!.end },
    ];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i]!;
      const last = merged[merged.length - 1]!;

      if (current.start.getTime() <= last.end.getTime()) {
        if (current.end.getTime() > last.end.getTime()) {
          last.end = current.end;
        }
      } else {
        merged.push({ start: current.start, end: current.end });
      }
    }

    const totalMs = merged.reduce(
      (sum, interval) =>
        sum + (interval.end.getTime() - interval.start.getTime()),
      0
    );

    return Math.round(totalMs / 1000);
  }
}
```

### `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime-calculator.service.spec.ts`

**#7.** Los 18 tests de §4. Corren con TZ=UTC forzado por `jest.config.js`.

```ts
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
    expect(at1310).toBe(20 * 60);
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

  it('16. getDiscountSnapshot devuelve la traza congelable con zona y detalle por paro', async () => {
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

    const snapshot = await service.getDiscountSnapshot(
      1,
      plant('2026-07-13T11:30:00'),
      plant('2026-07-13T13:30:00')
    );

    expect(snapshot.totalDiscountedSeconds).toBe(3600);
    expect(snapshot.timezone).toBe(PLANT_TZ);
    expect(snapshot.items).toEqual([
      {
        scheduledDowntimeId: 7,
        name: 'Comida',
        startTime: '12:00',
        endTime: '13:00',
        discountedSeconds: 3600,
      },
    ]);
    expect(snapshot.calculatedAt).toBeDefined();
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
});
```

### `backend-receptor/src/scheduled-downtimes/application/services/scheduled-downtime.service.ts`

**#8.** CRUD. Nota: valida que `startTime !== endTime` (permite ventanas nocturnas) e invalida la caché en cada escritura.

```ts
import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ScheduledDowntime } from '../../domain/entities/scheduled-downtime.entity';
import {
  ScheduledDowntimeRepository,
  CreateScheduledDowntimeDto,
  UpdateScheduledDowntimeDto,
  ScheduledDowntimeFilters,
} from '../../domain/repositories/scheduled-downtime.repository';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import { ScheduledDowntimeCacheService } from './scheduled-downtime-cache.service';

@Injectable()
export class ScheduledDowntimeService {
  private readonly logger = new Logger(ScheduledDowntimeService.name);

  constructor(
    private readonly scheduledDowntimeRepository: ScheduledDowntimeRepository,
    private readonly areaRepository: AreaRepository,
    private readonly cache: ScheduledDowntimeCacheService
  ) {}

  /**
   * `endTime < startTime` es VÁLIDO: significa que la ventana cruza medianoche
   * y cierra al día siguiente (ej. 23:00 -> 02:00). Ver PLAN §1.4b.
   * Lo único inválido es que sean iguales, porque es ambiguo (¿0 h o 24 h?).
   */
  private assertValidTimeRange(startTime: string, endTime: string): void {
    if (startTime === endTime) {
      throw new BadRequestException(
        'startTime y endTime no pueden ser iguales. Para una ventana de día ' +
          'completo usa 00:00 a 23:59; para una que cruza medianoche usa ' +
          'por ejemplo 23:00 a 02:00.'
      );
    }
  }

  async create(
    createDto: CreateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    this.logger.log(
      `Creating scheduled downtime with name: ${createDto.name} for area ${createDto.areaId}`
    );

    const area = await this.areaRepository.findById(createDto.areaId);
    if (!area) {
      throw new NotFoundException(`Area with ID ${createDto.areaId} not found`);
    }

    this.assertValidTimeRange(createDto.startTime, createDto.endTime);

    try {
      const scheduledDowntime =
        await this.scheduledDowntimeRepository.create(createDto);
      this.cache.invalidate(scheduledDowntime.areaId);
      this.logger.log(
        `Scheduled downtime created successfully with ID: ${scheduledDowntime.id}`
      );
      return scheduledDowntime;
    } catch (error) {
      this.logger.error(
        `Error creating scheduled downtime: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findAll(
    filters?: ScheduledDowntimeFilters
  ): Promise<{ data: ScheduledDowntime[]; total: number }> {
    try {
      return await this.scheduledDowntimeRepository.findAll(filters);
    } catch (error) {
      this.logger.error(
        `Error retrieving scheduled downtimes: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async findById(id: number): Promise<ScheduledDowntime> {
    try {
      const scheduledDowntime =
        await this.scheduledDowntimeRepository.findById(id);
      if (!scheduledDowntime) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }
      return scheduledDowntime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving scheduled downtime by ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async update(
    id: number,
    updateDto: UpdateScheduledDowntimeDto
  ): Promise<ScheduledDowntime> {
    this.logger.log(`Updating scheduled downtime with ID: ${id}`);

    try {
      const existing = await this.findById(id);

      if (updateDto.areaId) {
        const area = await this.areaRepository.findById(updateDto.areaId);
        if (!area) {
          throw new NotFoundException(
            `Area with ID ${updateDto.areaId} not found`
          );
        }
      }

      const nextStartTime = updateDto.startTime ?? existing.startTime;
      const nextEndTime = updateDto.endTime ?? existing.endTime;
      this.assertValidTimeRange(nextStartTime, nextEndTime);

      const updated = await this.scheduledDowntimeRepository.update(
        id,
        updateDto
      );
      if (!updated) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      // invalidateAll y no invalidate(areaId): un update puede mover el paro
      // programado de un área a otra, dejando obsoletas las dos entradas.
      this.cache.invalidateAll();

      this.logger.log(`Scheduled downtime updated successfully with ID: ${id}`);
      return updated;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    this.logger.log(`Soft deleting scheduled downtime with ID: ${id}`);

    try {
      const existing = await this.findById(id);

      const deleted = await this.scheduledDowntimeRepository.softDelete(id);
      if (!deleted) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      this.cache.invalidate(existing.areaId);

      this.logger.log(
        `Scheduled downtime soft deleted successfully with ID: ${id}`
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async restore(id: number): Promise<ScheduledDowntime> {
    this.logger.log(`Restoring scheduled downtime with ID: ${id}`);

    try {
      const restored = await this.scheduledDowntimeRepository.restore(id);
      if (!restored) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found or not deleted`
        );
      }

      const scheduledDowntime =
        await this.scheduledDowntimeRepository.findById(id);
      if (!scheduledDowntime) {
        throw new NotFoundException(
          `Scheduled downtime with ID ${id} not found`
        );
      }

      this.cache.invalidate(scheduledDowntime.areaId);

      this.logger.log(
        `Scheduled downtime restored successfully with ID: ${id}`
      );
      return scheduledDowntime;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error restoring scheduled downtime with ID ${id}: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }

  async getCount(): Promise<number> {
    try {
      return await this.scheduledDowntimeRepository.count();
    } catch (error) {
      this.logger.error(
        `Error getting scheduled downtimes count: ${(error as Error).message}`,
        (error as Error).stack
      );
      throw error;
    }
  }
}
```

### `backend-receptor/src/scheduled-downtimes/controllers/scheduled-downtime.controller.ts`

**#9.** Controlador.

```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ScheduledDowntimeService } from '../application/services/scheduled-downtime.service';
import { ScheduledDowntimeCalculatorService } from '../application/services/scheduled-downtime-calculator.service';
import type { ScheduledDowntimeSnapshot } from '../application/services/scheduled-downtime-calculator.service';
import {
  CreateScheduledDowntimeDto,
  UpdateScheduledDowntimeDto,
  ScheduledDowntimeResponseDto,
} from '../application/dtos/scheduled-downtime.dto';
import { ScheduledDowntimeFilters } from '../domain/repositories/scheduled-downtime.repository';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionGuard } from '../../permissions/guards/permission.guard';
import { RequirePermission } from '../../permissions/decorators/require-permission.decorator';
import {
  Module,
  Action,
} from '../../permissions/constants/permissions.constants';
import { SystemModuleTag } from 'src/common/decorators/system-module.decorator';
import { SystemModule } from 'src/common/enums/system-module.enum';

@SystemModuleTag(SystemModule.SIGNALS)
@Controller('scheduled-downtimes')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ScheduledDowntimeController {
  constructor(
    private readonly scheduledDowntimeService: ScheduledDowntimeService,
    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.CREATE)
  async create(
    @Body() createDto: CreateScheduledDowntimeDto
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime =
      await this.scheduledDowntimeService.create(createDto);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime created successfully', data };
  }

  @Get()
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async findAll(
    @Query('areaId', new ParseIntPipe({ optional: true })) areaId?: number,
    @Query('isActive', new DefaultValuePipe(undefined)) isActive?: string,
    @Query('name') name?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
    @Query('includeDeleted', new DefaultValuePipe(false))
    includeDeleted?: boolean
  ): Promise<{
    message: string;
    data: ScheduledDowntimeResponseDto[];
    total: number;
    pagination: { limit: number; offset: number; total: number };
  }> {
    const filters: ScheduledDowntimeFilters = {};
    if (areaId) filters.areaId = areaId;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (name) filters.name = name;
    if (limit) filters.limit = limit;
    if (offset) filters.offset = offset;
    if (includeDeleted) filters.includeDeleted = includeDeleted;

    const { data, total } =
      await this.scheduledDowntimeService.findAll(filters);
    const responses = plainToInstance(ScheduledDowntimeResponseDto, data, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    return {
      message: 'Scheduled downtimes retrieved successfully',
      data: responses,
      total,
      pagination: { limit: limit ?? 10, offset: offset ?? 0, total },
    };
  }

  @Get('count')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async getCount(): Promise<{ message: string; count: number }> {
    const count = await this.scheduledDowntimeService.getCount();
    return {
      message: 'Scheduled downtimes count retrieved successfully',
      count,
    };
  }

  /**
   * Utilidad de verificación/QA: crudo, descuento y efectivo para un área y un
   * rango de fecha/hora. Permite a QA y a Fase 2 (Reportes) validar el cálculo
   * sin releer la lógica de traslape.
   *
   * `start` y `end` en ISO 8601 con offset explícito, ej.
   * 2026-07-13T11:30:00-06:00
   */
  @Get('area/:areaId/effective-seconds')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async getEffectiveSeconds(
    @Param('areaId', ParseIntPipe) areaId: number,
    @Query('start') start: string,
    @Query('end') end: string
  ): Promise<{
    message: string;
    data: {
      rawSeconds: number;
      discountedSeconds: number;
      effectiveSeconds: number;
      snapshot: ScheduledDowntimeSnapshot;
    };
  }> {
    const rangeStart = new Date(start);
    const rangeEnd = new Date(end);

    if (
      Number.isNaN(rangeStart.getTime()) ||
      Number.isNaN(rangeEnd.getTime())
    ) {
      throw new BadRequestException(
        'start y end deben ser fechas ISO 8601 válidas'
      );
    }

    const rawSeconds = Math.max(
      0,
      Math.floor((rangeEnd.getTime() - rangeStart.getTime()) / 1000)
    );

    const snapshot =
      await this.scheduledDowntimeCalculatorService.getDiscountSnapshot(
        areaId,
        rangeStart,
        rangeEnd
      );

    return {
      message: 'Effective seconds calculated successfully',
      data: {
        rawSeconds,
        discountedSeconds: snapshot.totalDiscountedSeconds,
        effectiveSeconds: Math.max(
          0,
          rawSeconds - snapshot.totalDiscountedSeconds
        ),
        snapshot,
      },
    };
  }

  @Get(':id')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.READ)
  async findOne(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.findById(id);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime retrieved successfully', data };
  }

  @Patch(':id')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateScheduledDowntimeDto
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.update(
      id,
      updateDto
    );
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime updated successfully', data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.DELETE)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<{
    message: string;
  }> {
    await this.scheduledDowntimeService.remove(id);
    return { message: 'Scheduled downtime deleted successfully' };
  }

  @Patch(':id/restore')
  @RequirePermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE)
  async restore(
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ message: string; data: ScheduledDowntimeResponseDto }> {
    const scheduledDowntime = await this.scheduledDowntimeService.restore(id);
    const data = plainToInstance(
      ScheduledDowntimeResponseDto,
      scheduledDowntime,
      { excludeExtraneousValues: true, enableImplicitConversion: true }
    );

    return { message: 'Scheduled downtime restored successfully', data };
  }
}
```

### `backend-receptor/src/scheduled-downtimes/scheduled-downtimes.module.ts`

**#10.** Módulo. Exporta el calculador y la caché para que los consuman `signals`, `area-downtime`, `alert-escalation` y, en Fase 2, los reportes.

```ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledDowntimeController } from './controllers/scheduled-downtime.controller';
import { ScheduledDowntimeService } from './application/services/scheduled-downtime.service';
import { ScheduledDowntimeCalculatorService } from './application/services/scheduled-downtime-calculator.service';
import { ScheduledDowntimeCacheService } from './application/services/scheduled-downtime-cache.service';
import { ScheduledDowntime } from './domain/entities/scheduled-downtime.entity';
import { ScheduledDowntimeRepository } from './domain/repositories/scheduled-downtime.repository';
import { Area } from '../areas/domain/entities/area.entity';
import { AreaRepository } from '../areas/domain/repositories/area.repository';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ScheduledDowntime, Area]),
    PermissionsModule,
  ],
  controllers: [ScheduledDowntimeController],
  providers: [
    ScheduledDowntimeService,
    ScheduledDowntimeCalculatorService,
    ScheduledDowntimeCacheService,
    ScheduledDowntimeRepository,
    AreaRepository,
  ],
  // ScheduledDowntimeCalculatorService se exporta explícitamente: es la pieza
  // que Fase 2 (Reportes de disponibilidad) va a inyectar en su propio módulo.
  exports: [
    ScheduledDowntimeService,
    ScheduledDowntimeCalculatorService,
    ScheduledDowntimeCacheService,
    ScheduledDowntimeRepository,
  ],
})
export class ScheduledDowntimesModule {}
```

---

## 6. Frontend — contenido completo de los archivos nuevos

### `dashboard-test/src/types/scheduled-downtime.ts`

**#13.** Tipos.

```ts
export interface ScheduledDowntime {
  id: number;
  name: string;
  areaId: number;
  area?: {
    id: number;
    name: string;
  };
  startTime: string; // 'HH:mm'
  endTime: string; // 'HH:mm'
  daysOfWeek: number[]; // 0=domingo … 6=sábado
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface ScheduledDowntimeResponse {
  message: string;
  data: ScheduledDowntime;
}

export interface ScheduledDowntimesResponse {
  message: string;
  data: ScheduledDowntime[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CreateScheduledDowntimeData {
  name: string;
  areaId: number;
  startTime: string;
  endTime: string;
  daysOfWeek: number[];
  isActive?: boolean;
}

export interface UpdateScheduledDowntimeData {
  name?: string;
  areaId?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  isActive?: boolean;
}

export interface ScheduledDowntimeFilters {
  areaId?: number;
  isActive?: boolean;
  name?: string;
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export const DAYS_OF_WEEK_LABELS: Record<number, string> = {
  0: "Dom",
  1: "Lun",
  2: "Mar",
  3: "Mié",
  4: "Jue",
  5: "Vie",
  6: "Sáb",
};
```

### `dashboard-test/src/components/organisms/catalogs/ScheduledDowntimesCatalog.tsx`

**#14.** Catálogo CRUD. Incluye el indicador `(+1 día)` para ventanas nocturnas y el aviso de que las horas son de planta, no del navegador.

```tsx
import { useState } from "react";

import { Controller } from "react-hook-form";

import { Module, Action } from "@/constants/permissions";
import {
  useScheduledDowntimes,
  useCreateScheduledDowntime,
  useUpdateScheduledDowntime,
  useDeleteScheduledDowntime,
  useAreas,
  type ScheduledDowntime,
  type Area,
} from "@/hooks/useCatalogs";
import { useFormValidation } from "@/hooks/useFormValidation";
import { useHasPermission } from "@/hooks/useHasPermission";
import {
  createScheduledDowntimeSchema,
  updateScheduledDowntimeSchema,
} from "@/lib/validations/schemas";
import { DAYS_OF_WEEK_LABELS } from "@/types/scheduled-downtime";

import {
  ErrorMessage,
  ValidationErrorList,
  Button,
  Input,
  Select,
  Checkbox,
  Text,
} from "../../atoms";
import { SearchInput } from "../../atoms/SearchInput";
import { ConfirmationModal } from "../../molecules/ConfirmationModal";
import { DataTable, type TableColumn } from "../../molecules/DataTable";
import { FieldError } from "../../molecules/FieldError";
import { Modal } from "../Modal";

// Lunes a domingo, orden de calendario laboral. Value = Date.getDay() (0=domingo).
const DAY_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 1, label: DAYS_OF_WEEK_LABELS[1]! },
  { value: 2, label: DAYS_OF_WEEK_LABELS[2]! },
  { value: 3, label: DAYS_OF_WEEK_LABELS[3]! },
  { value: 4, label: DAYS_OF_WEEK_LABELS[4]! },
  { value: 5, label: DAYS_OF_WEEK_LABELS[5]! },
  { value: 6, label: DAYS_OF_WEEK_LABELS[6]! },
  { value: 0, label: DAYS_OF_WEEK_LABELS[0]! },
];

/**
 * Una ventana cruza medianoche cuando su hora de fin es menor que la de inicio
 * (ej. 23:00 -> 02:00): cierra al día siguiente. Ver PLAN §1.4b.
 */
function crossesMidnight(startTime: string, endTime: string): boolean {
  return Boolean(startTime) && Boolean(endTime) && endTime < startTime;
}

/** Formatea el horario mostrando explícitamente el cruce de medianoche. */
function formatSchedule(startTime: string, endTime: string): string {
  return crossesMidnight(startTime, endTime)
    ? `${startTime} - ${endTime} (+1 día)`
    : `${startTime} - ${endTime}`;
}

/**
 * Aviso contextual bajo los campos de hora: aclara que son horas de planta y
 * confirma visualmente cuando la ventana cruza medianoche, para que capturar
 * "23:00 a 02:00" no parezca un error del usuario.
 */
function ScheduleHint({
  startTime,
  endTime,
}: {
  startTime: string;
  endTime: string;
}) {
  return (
    <Text className="mt-1" color="secondary" variant="small">
      {crossesMidnight(startTime, endTime)
        ? "Hora de planta · Esta ventana cruza medianoche: cierra al día siguiente."
        : "Hora de planta (no la del navegador)."}
    </Text>
  );
}

/** Selector de días de la semana, independiente del tipo de formulario (create/edit). */
function DaysOfWeekPicker({
  value,
  onChange,
  disabled,
}: {
  value: number[];
  onChange: (next: number[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {DAY_OPTIONS.map((day) => (
        <Checkbox
          key={day.value}
          isDisabled={disabled}
          isSelected={value.includes(day.value)}
          onValueChange={(isSelected) => {
            onChange(
              isSelected
                ? [...value, day.value]
                : value.filter((d) => d !== day.value)
            );
          }}
        >
          {day.label}
        </Checkbox>
      ))}
    </div>
  );
}

export function ScheduledDowntimesCatalog() {
  const hasCreate = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.CREATE);
  const hasUpdate = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.UPDATE);
  const hasDelete = useHasPermission(Module.SCHEDULED_DOWNTIMES, Action.DELETE);

  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selected, setSelected] = useState<ScheduledDowntime | null>(null);

  const { data: scheduledDowntimesData, isLoading } = useScheduledDowntimes();
  const { data: areasData } = useAreas();
  const areas = areasData?.data ?? [];

  const createMutation = useCreateScheduledDowntime();
  const updateMutation = useUpdateScheduledDowntime();
  const deleteMutation = useDeleteScheduledDowntime();

  const scheduledDowntimes = scheduledDowntimesData?.data ?? [];
  const filtered = scheduledDowntimes.filter(
    (item: ScheduledDowntime) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.area?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const emptyFormValues = {
    name: "",
    areaId: areas[0]?.id ?? 0,
    startTime: "",
    endTime: "",
    daysOfWeek: [] as number[],
    isActive: true,
  };

  // Form para crear
  const createForm = useFormValidation({
    schema: createScheduledDowntimeSchema,
    defaultValues: emptyFormValues,
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Paro programado creado exitosamente",
  });

  // Form para editar
  const editForm = useFormValidation({
    schema: updateScheduledDowntimeSchema,
    defaultValues: {
      name: selected?.name ?? "",
      areaId: selected?.areaId ?? 0,
      startTime: selected?.startTime ?? "",
      endTime: selected?.endTime ?? "",
      daysOfWeek: selected?.daysOfWeek ?? [],
      isActive: selected?.isActive ?? true,
    },
    showToastOnError: true,
    showToastOnSuccess: true,
    successMessage: "Paro programado actualizado exitosamente",
  });

  const columns: Array<TableColumn<ScheduledDowntime>> = [
    { id: "id", label: "ID", key: "id", width: "70px" },
    { id: "name", label: "Nombre", key: "name" },
    {
      id: "area",
      label: "Área",
      key: "area",
      component: (value) => (value as ScheduledDowntime["area"])?.name ?? "—",
    },
    {
      id: "schedule",
      label: "Horario",
      key: "startTime",
      component: (_value, row) => formatSchedule(row.startTime, row.endTime),
    },
    {
      id: "daysOfWeek",
      label: "Días",
      key: "daysOfWeek",
      component: (value) =>
        (value as number[])
          .slice()
          .sort((a, b) => a - b)
          .map((day) => DAYS_OF_WEEK_LABELS[day])
          .join(", "),
    },
    {
      id: "isActive",
      label: "Estado",
      key: "isActive",
      component: (value) => (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {value ? "Activo" : "Inactivo"}
        </span>
      ),
    },
  ];

  const handleCreate = () => {
    createForm.resetForm(emptyFormValues);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (item: ScheduledDowntime) => {
    setSelected(item);
    editForm.resetForm({
      name: item.name,
      areaId: item.areaId,
      startTime: item.startTime,
      endTime: item.endTime,
      daysOfWeek: item.daysOfWeek,
      isActive: item.isActive,
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = (item: ScheduledDowntime) => {
    setSelected(item);
    setIsDeleteModalOpen(true);
  };

  const handleCreateSubmit = createForm.form.handleSubmit(async (data) => {
    try {
      createForm.clearAllErrors();
      await createMutation.mutateAsync(data);
      createForm.toast.success("Paro programado creado exitosamente");
      createForm.resetForm(emptyFormValues);
      setIsCreateModalOpen(false);
    } catch (error) {
      createForm.handleBackendError(error);
    }
  });

  const handleEditSubmit = editForm.form.handleSubmit(async (data) => {
    if (!selected) return;

    try {
      editForm.clearAllErrors();
      await updateMutation.mutateAsync({ id: selected.id, data });
      editForm.toast.success("Paro programado actualizado exitosamente");
      setIsEditModalOpen(false);
      setSelected(null);
    } catch (error) {
      editForm.handleBackendError(error);
    }
  });

  const handleDeleteConfirm = async () => {
    if (!selected) return;

    try {
      await deleteMutation.mutateAsync(selected.id);
      setIsDeleteModalOpen(false);
      setSelected(null);
    } catch {
      // El error se maneja automáticamente por la mutación
    }
  };

  const handleCancel = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setSelected(null);
  };

  const isCreateLoading = createMutation.isPending;
  const isEditLoading = updateMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex-1 max-w-lg">
          <SearchInput
            placeholder="Buscar paros programados..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {hasCreate && (
          <Button
            className="ml-4"
            color="primary"
            data-cy="create-scheduled-downtime-button"
            size="lg"
            onClick={handleCreate}
          >
            Crear Paro Programado
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0 relative">
        <DataTable
          columns={columns}
          data={filtered}
          data-cy="scheduled-downtimes-table"
          emptyMessage="No hay paros programados registrados"
          loading={isLoading}
          onDelete={hasDelete ? handleDelete : undefined}
          onEdit={hasUpdate ? handleEdit : undefined}
        />
      </div>

      {/* Modal de Crear */}
      <Modal
        data-cy="create-scheduled-downtime-modal"
        isOpen={isCreateModalOpen}
        title="Crear Paro Programado"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleCreateSubmit}>
          {createForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={createForm.modalError.validationErrors}
            />
          )}
          {createForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                createForm.modalError.parsedError?.isServerError ?? false
              }
              message={createForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={createForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ej: Comida, Cambio de turno"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={createForm.form.control}
              name="areaId"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="create-scheduled-downtime-area"
                  >
                    Área
                  </label>
                  <Select
                    fullWidth
                    disabled={isCreateLoading}
                    id="create-scheduled-downtime-area"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((area: Area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="areaId"
                  />
                </>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={createForm.form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de inicio"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="startTime"
                  />
                </>
              )}
            />
            <Controller
              control={createForm.form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isCreateLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de fin"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="endTime"
                  />
                </>
              )}
            />
          </div>
          <ScheduleHint
            endTime={createForm.form.watch("endTime") ?? ""}
            startTime={createForm.form.watch("startTime") ?? ""}
          />

          <div>
            <Text className="mb-2" color="secondary" variant="small">
              Días en que INICIA el paro programado
            </Text>
            <Controller
              control={createForm.form.control}
              name="daysOfWeek"
              render={({ field, fieldState }) => (
                <>
                  <DaysOfWeekPicker
                    disabled={isCreateLoading}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="daysOfWeek"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={createForm.form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  isDisabled={isCreateLoading}
                  isSelected={field.value ?? true}
                  onValueChange={field.onChange}
                >
                  Activo
                </Checkbox>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isCreateLoading}
              size="md"
              type="button"
              variant="solid"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              className="px-6 py-2 font-semibold"
              color="primary"
              disabled={isCreateLoading}
              isLoading={isCreateLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Editar */}
      <Modal
        data-cy="edit-scheduled-downtime-modal"
        isOpen={isEditModalOpen}
        title="Editar Paro Programado"
        onClose={handleCancel}
      >
        <form className="space-y-4" onSubmit={handleEditSubmit}>
          {editForm.modalError.validationErrors.length > 0 && (
            <ValidationErrorList
              errors={editForm.modalError.validationErrors}
            />
          )}
          {editForm.modalError.serverError && (
            <ErrorMessage
              isServerError={
                editForm.modalError.parsedError?.isServerError ?? false
              }
              message={editForm.modalError.serverError}
              type="server"
            />
          )}

          <div>
            <Controller
              control={editForm.form.control}
              name="name"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    autoFocus
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Nombre"
                    labelPlacement="outside"
                    placeholder="Ej: Comida, Cambio de turno"
                    size="md"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="name"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={editForm.form.control}
              name="areaId"
              render={({ field, fieldState }) => (
                <>
                  <label
                    className="block text-sm font-medium text-slate-300 mb-2"
                    htmlFor="edit-scheduled-downtime-area"
                  >
                    Área
                  </label>
                  <Select
                    fullWidth
                    disabled={isEditLoading}
                    id="edit-scheduled-downtime-area"
                    isInvalid={!!fieldState.error}
                    value={String(field.value ?? "")}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  >
                    <option value="">Seleccionar área</option>
                    {areas.map((area: Area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </Select>
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="areaId"
                  />
                </>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={editForm.form.control}
              name="startTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de inicio"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="startTime"
                  />
                </>
              )}
            />
            <Controller
              control={editForm.form.control}
              name="endTime"
              render={({ field, fieldState }) => (
                <>
                  <Input
                    {...field}
                    fullWidth
                    errorMessage={fieldState.error?.message}
                    isDisabled={isEditLoading}
                    isInvalid={!!fieldState.error}
                    label="Hora de fin"
                    labelPlacement="outside"
                    size="md"
                    type="time"
                    variant="bordered"
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="endTime"
                  />
                </>
              )}
            />
          </div>
          <ScheduleHint
            endTime={editForm.form.watch("endTime") ?? ""}
            startTime={editForm.form.watch("startTime") ?? ""}
          />

          <div>
            <Text className="mb-2" color="secondary" variant="small">
              Días en que INICIA el paro programado
            </Text>
            <Controller
              control={editForm.form.control}
              name="daysOfWeek"
              render={({ field, fieldState }) => (
                <>
                  <DaysOfWeekPicker
                    disabled={isEditLoading}
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />
                  <FieldError
                    error={fieldState.error?.message}
                    fieldId="daysOfWeek"
                  />
                </>
              )}
            />
          </div>

          <div>
            <Controller
              control={editForm.form.control}
              name="isActive"
              render={({ field }) => (
                <Checkbox
                  isDisabled={isEditLoading}
                  isSelected={field.value ?? true}
                  onValueChange={field.onChange}
                >
                  Activo
                </Checkbox>
              )}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-600">
            <Button
              className="px-6 py-2 font-semibold"
              color="default"
              disabled={isEditLoading}
              size="md"
              type="button"
              variant="solid"
              onPress={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              className="px-6 py-2 font-semibold"
              color="primary"
              disabled={isEditLoading}
              isLoading={isEditLoading}
              size="md"
              type="submit"
              variant="solid"
            >
              Actualizar
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        cancelText="Cancelar"
        confirmText="Eliminar"
        data-cy="delete-scheduled-downtime-confirmation-modal"
        isOpen={isDeleteModalOpen}
        loading={deleteMutation.isPending}
        message={`¿Estás seguro de querer eliminar "${selected?.name}"?`}
        title="Eliminar Paro Programado"
        variant="danger"
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
```

---

## 7. Diffs reales de los archivos existentes

Son los diffs (`git diff`) de la implementación verificada. Si el archivo local difiere
del contexto por commits posteriores, localiza el punto de inserción por significado, no
por número de línea.

### 7.1 Integración — la parte delicada

### `backend-receptor/src/signals/application/services/signal.service.ts`

**#15.** Congela el snapshot al cerrar el evento. `safeCalculateDiscount` garantiza que un fallo del cálculo **nunca** impida el cierre (degrada a `discount = 0`).

```diff
diff --git a/backend-receptor/src/signals/application/services/signal.service.ts b/backend-receptor/src/signals/application/services/signal.service.ts
index c496921..1bcb601 100644
--- a/backend-receptor/src/signals/application/services/signal.service.ts
+++ b/backend-receptor/src/signals/application/services/signal.service.ts
@@ -22,6 +22,7 @@ import { EventStatus } from '../../../events/domain/entities/event.entity';
 import { AreaDowntimeService } from '../../../area-downtime/application/services/area-downtime.service';
 import { AlertCronService } from '../../../alert-escalation/application/services/alert-cron.service';
 import { AreaTorretaSignalService } from '../../../area-torreta-config/application/services/area-torreta-signal.service';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 import type { Event } from '../../../events/domain/entities/event.entity';
 import type { Device } from '../../../devices/domain/entities/device.entity';
 import type { DeviceSignal } from '../../../device-signals/domain/entities/device-signal.entity';
@@ -47,6 +48,7 @@ export class SignalService {
     private readonly webSocketEmitterService: WebSocketEmitterService,
     private readonly areaDowntimeService: AreaDowntimeService,
     private readonly alertCronService: AlertCronService,
+    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService,
     private readonly moduleRef: ModuleRef
   ) {}
 
@@ -505,10 +507,51 @@ export class SignalService {
     }
   }
 
+  /**
+   * Calcula el descuento por paros programados sin poder romper nunca el cierre
+   * del evento. Si algo falla, degrada a "sin descuento" (efectivo = crudo),
+   * que es el peor caso conservador: reporta más paro del real, nunca menos.
+   * Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.6.3.
+   */
+  private async safeCalculateDiscount(
+    areaId: number,
+    rangeStart: Date,
+    rangeEnd: Date
+  ): Promise<{ totalDiscountedSeconds: number; snapshot: object | null }> {
+    try {
+      const snapshot =
+        await this.scheduledDowntimeCalculatorService.getDiscountSnapshot(
+          areaId,
+          rangeStart,
+          rangeEnd
+        );
+
+      return {
+        totalDiscountedSeconds: snapshot.totalDiscountedSeconds,
+        snapshot,
+      };
+    } catch (error) {
+      this.logger.error(
+        `Fallo al calcular descuento de paros programados para área ${areaId}; ` +
+          `se cierra el evento sin descuento: ${(error as Error).message}`,
+        (error as Error).stack
+      );
+
+      return { totalDiscountedSeconds: 0, snapshot: null };
+    }
+  }
+
   private async closeEvent(event: Event): Promise<void> {
     try {
+      const closedAt = new Date();
       const durationSeconds = Math.floor(
-        (new Date().getTime() - event.createdAt.getTime()) / 1000
+        (closedAt.getTime() - event.createdAt.getTime()) / 1000
+      );
+
+      const discount = await this.safeCalculateDiscount(
+        event.areaId,
+        event.createdAt,
+        closedAt
       );
 
       const updatedEvent = await this.eventRepository.updateStatus(
@@ -516,11 +559,18 @@ export class SignalService {
         EventStatus.CLOSED,
         {
           durationSeconds,
+          scheduledDowntimeDiscountSeconds: discount.totalDiscountedSeconds,
+          effectiveDurationSeconds: Math.max(
+            0,
+            durationSeconds - discount.totalDiscountedSeconds
+          ),
+          scheduledDowntimeSnapshot: discount.snapshot,
         }
       );
 
       this.logger.log(
-        `Event ${event.id} closed with duration: ${durationSeconds} seconds`
+        `Event ${event.id} closed with duration: ${durationSeconds} seconds ` +
+          `(descuento paros programados: ${discount.totalDiscountedSeconds} s)`
       );
 
       try {
```

### `backend-receptor/src/area-downtime/application/services/area-downtime.service.ts`

**#16.** Igual, para el downtime del área. Ojo: ahora `endAreaDowntime` lee el downtime primero (necesita `startAt`).

```diff
diff --git a/backend-receptor/src/area-downtime/application/services/area-downtime.service.ts b/backend-receptor/src/area-downtime/application/services/area-downtime.service.ts
index e6bfe01..92d5168 100644
--- a/backend-receptor/src/area-downtime/application/services/area-downtime.service.ts
+++ b/backend-receptor/src/area-downtime/application/services/area-downtime.service.ts
@@ -2,6 +2,7 @@ import { Injectable, Logger } from '@nestjs/common';
 import { TypeOrmAreaDowntimeRepository } from '../../domain/repositories/typeorm-area-downtime.repository';
 import { TypeOrmAreaDowntimeEventRepository } from '../../domain/repositories/typeorm-area-downtime-event.repository';
 import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 import { EventStatus } from '../../../events/domain/entities/event.entity';
 import type { AreaDowntime } from '../../domain/entities/area-downtime.entity';
 import type { Event } from '../../../events/domain/entities/event.entity';
@@ -19,7 +20,8 @@ export class AreaDowntimeService {
   constructor(
     private readonly areaDowntimeRepository: TypeOrmAreaDowntimeRepository,
     private readonly areaDowntimeEventRepository: TypeOrmAreaDowntimeEventRepository,
-    private readonly eventRepository: TypeOrmEventRepository
+    private readonly eventRepository: TypeOrmEventRepository,
+    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService
   ) {}
 
   async handleEventForAreaDowntime(event: Event): Promise<void> {
@@ -128,13 +130,67 @@ export class AreaDowntimeService {
     return areaDowntime;
   }
 
+  /**
+   * Cierra el downtime del área y congela su snapshot de paros programados.
+   *
+   * Este es el nivel de "cuánto estuvo parada la LÍNEA" (deduplicado: un solo
+   * downtime aunque haya varios eventos simultáneos), y es la fuente de verdad
+   * para los reportes de disponibilidad de Fase 2. Ver PLAN §1.2.
+   */
   private async endAreaDowntime(downtimeId: number): Promise<void> {
+    const downtime = await this.areaDowntimeRepository.findById(downtimeId);
+
+    if (!downtime) {
+      this.logger.warn(
+        `No se encontró el downtime ${downtimeId} al intentar cerrarlo`
+      );
+      return;
+    }
+
+    const endsAt = new Date();
+    const durationSeconds = Math.max(
+      0,
+      Math.floor((endsAt.getTime() - downtime.startAt.getTime()) / 1000)
+    );
+
+    // Igual que en el cierre de evento: el cálculo nunca puede romper el cierre.
+    let totalDiscountedSeconds = 0;
+    let snapshot: object | null = null;
+
+    try {
+      const result =
+        await this.scheduledDowntimeCalculatorService.getDiscountSnapshot(
+          downtime.areaId,
+          downtime.startAt,
+          endsAt
+        );
+      totalDiscountedSeconds = result.totalDiscountedSeconds;
+      snapshot = result;
+    } catch (error) {
+      this.logger.error(
+        `Fallo al calcular descuento de paros programados para el downtime ` +
+          `${downtimeId} (área ${downtime.areaId}); se cierra sin descuento: ` +
+          `${(error as Error).message}`,
+        (error as Error).stack
+      );
+    }
+
     await this.areaDowntimeRepository.update(downtimeId, {
       isActive: false,
-      endsAt: new Date(),
+      endsAt,
+      durationSeconds,
+      scheduledDowntimeDiscountSeconds: totalDiscountedSeconds,
+      effectiveDurationSeconds: Math.max(
+        0,
+        durationSeconds - totalDiscountedSeconds
+      ),
+      scheduledDowntimeSnapshot: snapshot,
     });
 
-    this.logger.log(`Ended downtime ${downtimeId}`);
+    this.logger.log(
+      `Ended downtime ${downtimeId} — crudo: ${durationSeconds} s, ` +
+        `descuento: ${totalDiscountedSeconds} s`
+    );
   }
 
   private async getActiveEventsForArea(areaId: number): Promise<Event[]> {
```

### `backend-receptor/src/alert-escalation/application/services/alert-cron.service.ts`

**#17. D1 — el cambio de comportamiento.** El escalamiento pasa a contar minutos productivos. Cambio quirúrgico: `determineLevelToSend` y la deduplicación por `event_alert_logs` **no se tocan**; solo cambia la entrada del cálculo. Degradación segura: si el cálculo falla, usa el reloj de pared (comportamiento previo).

```diff
diff --git a/backend-receptor/src/alert-escalation/application/services/alert-cron.service.ts b/backend-receptor/src/alert-escalation/application/services/alert-cron.service.ts
index e0bafc9..b93d5af 100644
--- a/backend-receptor/src/alert-escalation/application/services/alert-cron.service.ts
+++ b/backend-receptor/src/alert-escalation/application/services/alert-cron.service.ts
@@ -3,6 +3,7 @@ import { Cron } from '@nestjs/schedule';
 import { TypeOrmEventRepository } from '../../../events/domain/repositories/typeorm-event.repository';
 import { AlertEscalationService } from './alert-escalation.service';
 import { Event } from '../../../events/domain/entities/event.entity';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 
 @Injectable()
 export class AlertCronService {
@@ -10,7 +11,8 @@ export class AlertCronService {
 
   constructor(
     private readonly eventRepository: TypeOrmEventRepository,
-    private readonly alertEscalationService: AlertEscalationService
+    private readonly alertEscalationService: AlertEscalationService,
+    private readonly scheduledDowntimeCalculatorService: ScheduledDowntimeCalculatorService
   ) {}
 
   @Cron('* * * * * *')
@@ -41,9 +43,14 @@ export class AlertCronService {
         return;
       }
 
-      const timeElapsedMinutes = Math.floor(
-        (new Date().getTime() - event.createdAt.getTime()) / (1000 * 60)
-      );
+      // D1 (PLAN §1.6.5): el reloj de escalamiento cuenta MINUTOS PRODUCTIVOS,
+      // no minutos de reloj. Si la línea cae a las 12:40, el umbral es de 30 min
+      // y hay un paro programado de 13:00 a 14:00, el escalamiento NO sale a las
+      // 13:10 (30 min de reloj, pero solo 20 productivos): sale a las 14:10.
+      //
+      // El catálogo viene de una caché en memoria porque este cron corre CADA
+      // SEGUNDO; sin ella serían N consultas/seg contra la BD (PLAN §1.8.3).
+      const timeElapsedMinutes = await this.getProductiveElapsedMinutes(event);
 
       const levelToSend = this.alertEscalationService.determineLevelToSend(
         timeElapsedMinutes,
@@ -62,6 +69,38 @@ export class AlertCronService {
     }
   }
 
+  /**
+   * Minutos productivos transcurridos desde que se abrió el evento, es decir,
+   * descontando el tiempo cubierto por paros programados del área.
+   *
+   * Degradación segura: si el cálculo falla, se usa el reloj de pared. Es el
+   * comportamiento previo a esta fase — escalar de más es preferible a no
+   * escalar cuando la línea está caída de verdad.
+   */
+  private async getProductiveElapsedMinutes(event: Event): Promise<number> {
+    const now = new Date();
+
+    try {
+      const productiveSeconds =
+        await this.scheduledDowntimeCalculatorService.getEffectiveSeconds(
+          event.areaId,
+          event.createdAt,
+          now
+        );
+
+      return Math.floor(productiveSeconds / 60);
+    } catch (error) {
+      this.logger.error(
+        `Fallo al calcular minutos productivos del evento ${event.id}; ` +
+          `se usa el reloj de pared: ${(error as Error).message}`
+      );
+
+      return Math.floor(
+        (now.getTime() - event.createdAt.getTime()) / (1000 * 60)
+      );
+    }
+  }
+
   async processClosedEvent(event: Event): Promise<void> {
     try {
       this.logger.log(
```

### `backend-receptor/src/events/domain/entities/event.entity.ts`

**#18.** Tres columnas nuevas.

```diff
diff --git a/backend-receptor/src/events/domain/entities/event.entity.ts b/backend-receptor/src/events/domain/entities/event.entity.ts
index 824873d..dd6273c 100644
--- a/backend-receptor/src/events/domain/entities/event.entity.ts
+++ b/backend-receptor/src/events/domain/entities/event.entity.ts
@@ -92,6 +92,34 @@ export class Event {
   })
   durationSeconds?: number;
 
+  /**
+   * Descuento por paros programados aplicado al cerrar (segundos).
+   * NULL mientras el evento está abierto; 0 si no hubo traslape.
+   * Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.3.2.
+   */
+  @Column({
+    name: 'scheduled_downtime_discount_seconds',
+    type: 'integer',
+    nullable: true,
+  })
+  scheduledDowntimeDiscountSeconds?: number;
+
+  /** duration_seconds − scheduled_downtime_discount_seconds. Nunca negativo. */
+  @Column({
+    name: 'effective_duration_seconds',
+    type: 'integer',
+    nullable: true,
+  })
+  effectiveDurationSeconds?: number;
+
+  /** Traza congelada del descuento (nombre y horario al momento del cierre). */
+  @Column({
+    name: 'scheduled_downtime_snapshot',
+    type: 'jsonb',
+    nullable: true,
+  })
+  scheduledDowntimeSnapshot?: object | null;
+
   @Column({ name: 'virtual_device', type: 'boolean', default: false })
   virtualDevice!: boolean;
 
```

### `backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts`

**#19.** Cuatro columnas nuevas (incluye `duration_seconds`, que esta tabla nunca tuvo).

```diff
diff --git a/backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts b/backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts
index 3484ed4..265caed 100644
--- a/backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts
+++ b/backend-receptor/src/area-downtime/domain/entities/area-downtime.entity.ts
@@ -43,6 +43,34 @@ export class AreaDowntime {
   })
   endsAt?: Date;
 
+  /** Crudo: ends_at − start_at (segundos). NULL mientras está activo. */
+  @Column({ name: 'duration_seconds', type: 'integer', nullable: true })
+  durationSeconds?: number;
+
+  /** Descuento por paros programados aplicado al cerrar (segundos). */
+  @Column({
+    name: 'scheduled_downtime_discount_seconds',
+    type: 'integer',
+    nullable: true,
+  })
+  scheduledDowntimeDiscountSeconds?: number;
+
+  /** duration_seconds − scheduled_downtime_discount_seconds. Nunca negativo. */
+  @Column({
+    name: 'effective_duration_seconds',
+    type: 'integer',
+    nullable: true,
+  })
+  effectiveDurationSeconds?: number;
+
+  /** Traza congelada del descuento. */
+  @Column({
+    name: 'scheduled_downtime_snapshot',
+    type: 'jsonb',
+    nullable: true,
+  })
+  scheduledDowntimeSnapshot?: object | null;
+
   @CreateDateColumn({
     name: 'created_at',
     type: 'timestamp with time zone',
```

### `backend-receptor/src/area-downtime/domain/repositories/area-downtime.repository.ts`

**#20.** DTO de update extendido. `object | null` y no `unknown`: con `exactOptionalPropertyTypes: true`, `unknown` incluye `undefined` y TypeORM lo rechaza.

```diff
diff --git a/backend-receptor/src/area-downtime/domain/repositories/area-downtime.repository.ts b/backend-receptor/src/area-downtime/domain/repositories/area-downtime.repository.ts
index 02c965b..fb225d9 100644
--- a/backend-receptor/src/area-downtime/domain/repositories/area-downtime.repository.ts
+++ b/backend-receptor/src/area-downtime/domain/repositories/area-downtime.repository.ts
@@ -9,6 +9,10 @@ export interface CreateAreaDowntimeDto {
 export interface UpdateAreaDowntimeDto {
   isActive?: boolean;
   endsAt?: Date;
+  durationSeconds?: number;
+  scheduledDowntimeDiscountSeconds?: number;
+  effectiveDurationSeconds?: number;
+  scheduledDowntimeSnapshot?: object | null;
 }
 
 export interface AreaDowntimeFilters {
```

### 7.2 Cableado backend

### `backend-receptor/src/app.module.ts`

**#21.** Registra el módulo y el config de zona horaria.

```diff
diff --git a/backend-receptor/src/app.module.ts b/backend-receptor/src/app.module.ts
index 404c766..3dba76a 100644
--- a/backend-receptor/src/app.module.ts
+++ b/backend-receptor/src/app.module.ts
@@ -28,16 +28,18 @@ import { PermissionsModule } from './permissions/permissions.module';
 import { TestSeedService } from './seed/test-seed.service';
 import { User } from './users/domain/entities/user.entity';
 import systemModulesConfig from './config/system-modules.config';
+import plantTimezoneConfig from './config/plant-timezone.config';
 import { APP_GUARD } from '@nestjs/core';
 import { SystemModuleGuard } from './common/guards/system-module.guard';
 import { VirtualDeviceModule } from './virtual-device/virtual-device.module';
+import { ScheduledDowntimesModule } from './scheduled-downtimes/scheduled-downtimes.module';
 
 @Module({
   imports: [
     ConfigModule.forRoot({
       isGlobal: true,
       envFilePath: ['.env.local', '.env'],
-      load: [systemModulesConfig],
+      load: [systemModulesConfig, plantTimezoneConfig],
     }),
     ScheduleModule.forRoot(),
     HttpModule,
@@ -80,6 +82,7 @@ import { VirtualDeviceModule } from './virtual-device/virtual-device.module';
     AlertEscalationModule,
     EventsModule,
     VirtualDeviceModule,
+    ScheduledDowntimesModule,
   ],
   controllers: [AppController],
   providers: [
```

### `backend-receptor/src/permissions/constants/permissions.constants.ts`

**#22.** Permisos del módulo nuevo.

```diff
diff --git a/backend-receptor/src/permissions/constants/permissions.constants.ts b/backend-receptor/src/permissions/constants/permissions.constants.ts
index ecb74ec..6295bb9 100644
--- a/backend-receptor/src/permissions/constants/permissions.constants.ts
+++ b/backend-receptor/src/permissions/constants/permissions.constants.ts
@@ -15,6 +15,7 @@ export enum Module {
   RECEPTORS = 'receptors',
   EVENTS = 'events',
   EMAILS = 'emails',
+  SCHEDULED_DOWNTIMES = 'scheduled-downtimes',
   USERS = 'users',
   DASHBOARD = 'dashboard',
   ROLES_AND_PERMISSIONS = 'roles-and-permissions',
```

### `backend-receptor/src/signals/signals.module.ts`

**#23.**

```diff
diff --git a/backend-receptor/src/signals/signals.module.ts b/backend-receptor/src/signals/signals.module.ts
index b90cb90..5948a0d 100644
--- a/backend-receptor/src/signals/signals.module.ts
+++ b/backend-receptor/src/signals/signals.module.ts
@@ -13,6 +13,7 @@ import { Device } from '../devices/domain/entities/device.entity';
 import { DeviceSignal } from '../device-signals/domain/entities/device-signal.entity';
 import { AreaDowntimeModule } from '../area-downtime/area-downtime.module';
 import { AlertEscalationModule } from '../alert-escalation/alert-escalation.module';
+import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
 
 @Module({
   imports: [
@@ -25,6 +26,7 @@ import { AlertEscalationModule } from '../alert-escalation/alert-escalation.modu
     ]),
     AreaDowntimeModule,
     AlertEscalationModule,
+    ScheduledDowntimesModule,
   ],
   controllers: [SignalController],
   providers: [
```

### `backend-receptor/src/area-downtime/area-downtime.module.ts`

**#24.**

```diff
diff --git a/backend-receptor/src/area-downtime/area-downtime.module.ts b/backend-receptor/src/area-downtime/area-downtime.module.ts
index 5ed0b6c..fc510d3 100644
--- a/backend-receptor/src/area-downtime/area-downtime.module.ts
+++ b/backend-receptor/src/area-downtime/area-downtime.module.ts
@@ -1,4 +1,5 @@
 import { Module } from '@nestjs/common';
+import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { AreaDowntime } from './domain/entities/area-downtime.entity';
 import { AreaDowntimeEvent } from './domain/entities/area-downtime-event.entity';
@@ -10,7 +11,10 @@ import { AreaDowntimeController } from './controllers/area-downtime.controller';
 import { Event } from '../events/domain/entities/event.entity';
 
 @Module({
-  imports: [TypeOrmModule.forFeature([AreaDowntime, AreaDowntimeEvent, Event])],
+  imports: [
+    ScheduledDowntimesModule,
+    TypeOrmModule.forFeature([AreaDowntime, AreaDowntimeEvent, Event]),
+  ],
   controllers: [AreaDowntimeController],
   providers: [
     AreaDowntimeService,
```

### `backend-receptor/src/alert-escalation/alert-escalation.module.ts`

**#25.** No genera dependencia circular: `scheduled-downtimes` no importa ninguno de estos módulos.

```diff
diff --git a/backend-receptor/src/alert-escalation/alert-escalation.module.ts b/backend-receptor/src/alert-escalation/alert-escalation.module.ts
index 0df0825..5f0f1bd 100644
--- a/backend-receptor/src/alert-escalation/alert-escalation.module.ts
+++ b/backend-receptor/src/alert-escalation/alert-escalation.module.ts
@@ -1,4 +1,5 @@
 import { Module } from '@nestjs/common';
+import { ScheduledDowntimesModule } from '../scheduled-downtimes/scheduled-downtimes.module';
 import { TypeOrmModule } from '@nestjs/typeorm';
 import { HttpModule } from '@nestjs/axios';
 
@@ -25,6 +26,7 @@ import { Event } from '../events/domain/entities/event.entity';
 
 @Module({
   imports: [
+    ScheduledDowntimesModule,
     TypeOrmModule.forFeature([
       AlertEscalationConfig,
       AlertEscalationMessage,
```

### `backend-receptor/jest.config.js`

**#26.** Fuerza TZ=UTC. **No lo quites**: sin esto, los tests de zona horaria pasarían aunque el bug estuviera presente, en la máquina de un desarrollador con hora de México.

```diff
diff --git a/backend-receptor/jest.config.js b/backend-receptor/jest.config.js
index 16d1115..422f0a5 100644
--- a/backend-receptor/jest.config.js
+++ b/backend-receptor/jest.config.js
@@ -1,3 +1,10 @@
+// Los contenedores de producción corren en UTC (docker-compose no define TZ) y
+// la planta opera en otra zona. Forzar UTC aquí garantiza que los tests de
+// paros programados detecten cualquier uso accidental de la hora local del
+// proceso en vez de PLANT_TIMEZONE, aunque el desarrollador tenga otra zona.
+// Ver documentation/PLAN_MIGRACION_IOTRACK.md §1.4.
+process.env.TZ = 'UTC';
+
 module.exports = {
   moduleFileExtensions: ['js', 'json', 'ts'],
   rootDir: 'src',
```

### 7.3 Specs existentes (obligatorio: sin esto fallan 62 tests)

### `backend-receptor/src/signals/application/services/signal.service.spec.ts`

**#27.**

```diff
diff --git a/backend-receptor/src/signals/application/services/signal.service.spec.ts b/backend-receptor/src/signals/application/services/signal.service.spec.ts
index ac00569..74a09f3 100644
--- a/backend-receptor/src/signals/application/services/signal.service.spec.ts
+++ b/backend-receptor/src/signals/application/services/signal.service.spec.ts
@@ -9,6 +9,7 @@ import { TypeOrmEventRepository } from '../../../events/domain/repositories/type
 import { WebSocketEmitterService } from '../../../websocket/services/websocket-emitter.service';
 import { AreaDowntimeService } from '../../../area-downtime/application/services/area-downtime.service';
 import { AlertCronService } from '../../../alert-escalation/application/services/alert-cron.service';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 import type { AreaTorretaSignalService } from '../../../area-torreta-config/application/services/area-torreta-signal.service';
 import {
   createMockRawSignal,
@@ -43,6 +44,21 @@ describe('SignalService', () => {
 
     const module: TestingModule = await Test.createTestingModule({
       providers: [
+        {
+          // Por defecto sin descuento: aísla estos tests de la lógica de paros
+          // programados (cubierta en su propio spec).
+          provide: ScheduledDowntimeCalculatorService,
+          useValue: {
+            getDiscountSnapshot: jest.fn().mockResolvedValue({
+              calculatedAt: new Date().toISOString(),
+              timezone: 'America/Chihuahua',
+              rangeStart: new Date().toISOString(),
+              rangeEnd: new Date().toISOString(),
+              totalDiscountedSeconds: 0,
+              items: [],
+            }),
+          },
+        },
         SignalService,
         {
           provide: RawSignalRepository,
```

### `backend-receptor/src/area-downtime/application/services/area-downtime.service.spec.ts`

**#28.** Además del mock, los asserts de `update` cambian (ahora se persisten 6 campos) y hay que mockear `findById`.

```diff
diff --git a/backend-receptor/src/area-downtime/application/services/area-downtime.service.spec.ts b/backend-receptor/src/area-downtime/application/services/area-downtime.service.spec.ts
index 6d646fb..5dbd8eb 100644
--- a/backend-receptor/src/area-downtime/application/services/area-downtime.service.spec.ts
+++ b/backend-receptor/src/area-downtime/application/services/area-downtime.service.spec.ts
@@ -11,6 +11,7 @@ import {
 } from '../../../test-helpers';
 import { EventStatus } from '../../../events/domain/entities/event.entity';
 import type { AreaDowntimeFilters } from '../../domain/repositories/area-downtime.repository';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 
 describe('AreaDowntimeService', () => {
   let service: AreaDowntimeService;
@@ -22,6 +23,21 @@ describe('AreaDowntimeService', () => {
     const module: TestingModule = await Test.createTestingModule({
       providers: [
         AreaDowntimeService,
+        {
+          // Por defecto sin descuento: aísla estos tests de la lógica de
+          // paros programados (cubierta en su propio spec).
+          provide: ScheduledDowntimeCalculatorService,
+          useValue: {
+            getDiscountSnapshot: jest.fn().mockResolvedValue({
+              calculatedAt: new Date().toISOString(),
+              timezone: 'America/Chihuahua',
+              rangeStart: new Date().toISOString(),
+              rangeEnd: new Date().toISOString(),
+              totalDiscountedSeconds: 0,
+              items: [],
+            }),
+          },
+        },
         {
           provide: TypeOrmAreaDowntimeRepository,
           useValue: {
@@ -116,6 +132,9 @@ describe('AreaDowntimeService', () => {
 
       eventRepository.findActiveByArea.mockResolvedValue(activeEvents);
       areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
+      // endAreaDowntime ahora lee el downtime para conocer su startAt y calcular
+      // el descuento por paros programados sobre [startAt, endsAt).
+      areaDowntimeRepository.findById.mockResolvedValue(mockDowntime);
       areaDowntimeRepository.update.mockResolvedValue(mockDowntime);
 
       await service.handleEventForAreaDowntime(event);
@@ -123,6 +142,10 @@ describe('AreaDowntimeService', () => {
       expect(areaDowntimeRepository.update).toHaveBeenCalledWith(1, {
         isActive: false,
         endsAt: expect.any(Date) as unknown as Date,
+        durationSeconds: expect.any(Number) as unknown as number,
+        scheduledDowntimeDiscountSeconds: 0,
+        effectiveDurationSeconds: expect.any(Number) as unknown as number,
+        scheduledDowntimeSnapshot: expect.any(Object) as unknown as object,
       });
     });
 
@@ -361,6 +384,9 @@ describe('AreaDowntimeService', () => {
       });
 
       areaDowntimeRepository.findActiveByAreaId.mockResolvedValue(mockDowntime);
+      // endAreaDowntime ahora lee el downtime para conocer su startAt y poder
+      // calcular el descuento por paros programados sobre [startAt, endsAt).
+      areaDowntimeRepository.findById.mockResolvedValue(mockDowntime);
       areaDowntimeRepository.update.mockResolvedValue(mockDowntime);
 
       const result = await service.endDowntime(areaId);
@@ -369,6 +395,10 @@ describe('AreaDowntimeService', () => {
       expect(areaDowntimeRepository.update).toHaveBeenCalledWith(1, {
         isActive: false,
         endsAt: expect.any(Date) as unknown as Date,
+        durationSeconds: expect.any(Number) as unknown as number,
+        scheduledDowntimeDiscountSeconds: 0,
+        effectiveDurationSeconds: expect.any(Number) as unknown as number,
+        scheduledDowntimeSnapshot: expect.any(Object) as unknown as object,
       });
     });
 
```

### `backend-receptor/src/alert-escalation/application/services/alert-cron.service.spec.ts`

**#29.** El mock por defecto devuelve minutos productivos = minutos de reloj, preservando el comportamiento previo en los tests que no tratan de paros programados.

```diff
diff --git a/backend-receptor/src/alert-escalation/application/services/alert-cron.service.spec.ts b/backend-receptor/src/alert-escalation/application/services/alert-cron.service.spec.ts
index 29cfd78..596fbaa 100644
--- a/backend-receptor/src/alert-escalation/application/services/alert-cron.service.spec.ts
+++ b/backend-receptor/src/alert-escalation/application/services/alert-cron.service.spec.ts
@@ -9,6 +9,7 @@ import {
 import { EventStatus } from '../../../events/domain/entities/event.entity';
 import { AlertLevel } from '../../domain/entities/alert-escalation-message.entity';
 import type { Event } from '../../../events/domain/entities/event.entity';
+import { ScheduledDowntimeCalculatorService } from '../../../scheduled-downtimes/application/services/scheduled-downtime-calculator.service';
 
 describe('AlertCronService', () => {
   let service: AlertCronService;
@@ -19,6 +20,20 @@ describe('AlertCronService', () => {
     const module: TestingModule = await Test.createTestingModule({
       providers: [
         AlertCronService,
+        {
+          // Por defecto, sin paros programados: los minutos productivos son
+          // iguales a los de reloj, preservando el comportamiento previo.
+          provide: ScheduledDowntimeCalculatorService,
+          useValue: {
+            getEffectiveSeconds: jest
+              .fn()
+              .mockImplementation((_areaId: number, start: Date, end: Date) =>
+                Promise.resolve(
+                  Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000))
+                )
+              ),
+          },
+        },
         {
           provide: TypeOrmEventRepository,
           useValue: {
```

### 7.4 Frontend

### `dashboard-test/src/hooks/useCatalogs.ts`

**#30.**

```diff
diff --git a/dashboard-test/src/hooks/useCatalogs.ts b/dashboard-test/src/hooks/useCatalogs.ts
index 0479f06..3f01cd6 100644
--- a/dashboard-test/src/hooks/useCatalogs.ts
+++ b/dashboard-test/src/hooks/useCatalogs.ts
@@ -58,6 +58,20 @@ export interface Email {
   deletedAt?: string;
 }
 
+export interface ScheduledDowntime {
+  id: number;
+  name: string;
+  areaId: number;
+  area?: { id: number; name: string };
+  startTime: string;
+  endTime: string;
+  daysOfWeek: number[];
+  isActive: boolean;
+  createdAt: string;
+  updatedAt: string;
+  deletedAt?: string;
+}
+
 const catalogApi = {
   getAreas: async (params?: {
     limit?: number;
@@ -196,6 +210,49 @@ const catalogApi = {
     return response.data;
   },
 
+  getScheduledDowntimes: async (params?: {
+    areaId?: number;
+    isActive?: boolean;
+    limit?: number;
+    offset?: number;
+  }) => {
+    const response = await apiClient.get("/scheduled-downtimes", { params });
+
+    return response.data;
+  },
+  createScheduledDowntime: async (data: {
+    name: string;
+    areaId: number;
+    startTime: string;
+    endTime: string;
+    daysOfWeek: number[];
+    isActive?: boolean;
+  }) => {
+    const response = await apiClient.post("/scheduled-downtimes", data);
+
+    return response.data;
+  },
+  updateScheduledDowntime: async (
+    id: number,
+    data: {
+      name?: string;
+      areaId?: number;
+      startTime?: string;
+      endTime?: string;
+      daysOfWeek?: number[];
+      isActive?: boolean;
+    }
+  ) => {
+    const response = await apiClient.patch(`/scheduled-downtimes/${id}`, data);
+
+    return response.data;
+  },
+  deleteScheduledDowntime: async (id: number) => {
+    const response = await apiClient.delete(`/scheduled-downtimes/${id}`);
+
+    return response.data;
+  },
+
   getEmails: async (params?: {
     limit?: number;
     offset?: number;
@@ -460,6 +517,64 @@ export function useDeleteReceptor() {
   });
 }
 
+export function useScheduledDowntimes(params?: {
+  areaId?: number;
+  isActive?: boolean;
+  limit?: number;
+  offset?: number;
+}) {
+  return useQuery({
+    queryKey: ["scheduled-downtimes", params],
+    queryFn: () => catalogApi.getScheduledDowntimes(params),
+  });
+}
+
+export function useCreateScheduledDowntime() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: catalogApi.createScheduledDowntime,
+    onSuccess: () => {
+      queryClient.invalidateQueries({ queryKey: ["scheduled-downtimes"] });
+    },
+  });
+}
+
+export function useUpdateScheduledDowntime() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: ({
+      id,
+      data,
+    }: {
+      id: number;
+      data: {
+        name?: string;
+        areaId?: number;
+        startTime?: string;
+        endTime?: string;
+        daysOfWeek?: number[];
+        isActive?: boolean;
+      };
+    }) => catalogApi.updateScheduledDowntime(id, data),
+    onSuccess: () => {
+      queryClient.invalidateQueries({ queryKey: ["scheduled-downtimes"] });
+    },
+  });
+}
+
+export function useDeleteScheduledDowntime() {
+  const queryClient = useQueryClient();
+
+  return useMutation({
+    mutationFn: catalogApi.deleteScheduledDowntime,
+    onSuccess: () => {
+      queryClient.invalidateQueries({ queryKey: ["scheduled-downtimes"] });
+    },
+  });
+}
+
 export function useEmails(params?: {
   limit?: number;
   offset?: number;
```

### `dashboard-test/src/lib/validations/schemas.ts`

**#31.** Rechaza solo `startTime === endTime`; `endTime < startTime` es válido (ventana nocturna).

```diff
diff --git a/dashboard-test/src/lib/validations/schemas.ts b/dashboard-test/src/lib/validations/schemas.ts
index c0bffd7..2f6d2ee 100644
--- a/dashboard-test/src/lib/validations/schemas.ts
+++ b/dashboard-test/src/lib/validations/schemas.ts
@@ -146,7 +146,10 @@ export const createDashboardMeasurementWithMeasurementSchema = z
 
 export const updateDashboardMeasurementWithMeasurementSchema = z
   .object({
-    externalId: z.string().min(1, "El External ID no puede estar vacío").optional(),
+    externalId: z
+      .string()
+      .min(1, "El External ID no puede estar vacío")
+      .optional(),
     name: z.string().min(1, "El nombre no puede estar vacío").optional(),
     type: measurementTypeEnum.optional(),
     groupId: z.number().int().positive().nullable().optional(),
@@ -355,6 +358,69 @@ export const updateReceptorSchema = z.object({
 export type CreateReceptorInput = z.infer<typeof createReceptorSchema>;
 export type UpdateReceptorInput = z.infer<typeof updateReceptorSchema>;
 
+// ============================================================================
+// Scheduled Downtime Schemas (Paros Programados)
+// ============================================================================
+
+const TIME_HHMM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
+
+const baseScheduledDowntimeShape = {
+  name: z
+    .string()
+    .min(1, "El nombre no puede estar vacío")
+    .max(255, "El nombre no puede exceder 255 caracteres"),
+  areaId: z.number().positive("Debes seleccionar un área"),
+  startTime: z
+    .string()
+    .regex(TIME_HHMM_REGEX, "La hora de inicio debe tener formato HH:mm"),
+  endTime: z
+    .string()
+    .regex(TIME_HHMM_REGEX, "La hora de fin debe tener formato HH:mm"),
+  daysOfWeek: z
+    .array(z.number().min(0).max(6))
+    .min(1, "Selecciona al menos un día de la semana"),
+  isActive: z.boolean().optional(),
+};
+
+// endTime < startTime es VÁLIDO: la ventana cruza medianoche y cierra al día
+// siguiente (ej. 23:00 -> 02:00), siguiendo el modelo DTSTART+DURATION de
+// RFC 5545. daysOfWeek son los días en que la ventana ARRANCA.
+// Solo se rechaza que sean iguales, por ambiguo (¿0 h o 24 h?).
+const SAME_TIME_MESSAGE =
+  "La hora de inicio y fin no pueden ser iguales. Para un día completo usa 00:00 a 23:59.";
+
+export const createScheduledDowntimeSchema = z
+  .object(baseScheduledDowntimeShape)
+  .refine((data) => data.endTime !== data.startTime, {
+    message: SAME_TIME_MESSAGE,
+    path: ["endTime"],
+  });
+
+export const updateScheduledDowntimeSchema = z
+  .object({
+    name: baseScheduledDowntimeShape.name.optional(),
+    areaId: baseScheduledDowntimeShape.areaId.optional(),
+    startTime: baseScheduledDowntimeShape.startTime.optional(),
+    endTime: baseScheduledDowntimeShape.endTime.optional(),
+    daysOfWeek: baseScheduledDowntimeShape.daysOfWeek.optional(),
+    isActive: z.boolean().optional(),
+  })
+  .refine(
+    (data) =>
+      !data.startTime || !data.endTime || data.endTime !== data.startTime,
+    {
+      message: SAME_TIME_MESSAGE,
+      path: ["endTime"],
+    }
+  );
+
+export type CreateScheduledDowntimeInput = z.infer<
+  typeof createScheduledDowntimeSchema
+>;
+export type UpdateScheduledDowntimeInput = z.infer<
+  typeof updateScheduledDowntimeSchema
+>;
+
 // ============================================================================
 // Role Schemas
 // ============================================================================
```

### `dashboard-test/src/pages/CatalogsPage.tsx`

**#32.**

```diff
diff --git a/dashboard-test/src/pages/CatalogsPage.tsx b/dashboard-test/src/pages/CatalogsPage.tsx
index a99e744..d3bee44 100644
--- a/dashboard-test/src/pages/CatalogsPage.tsx
+++ b/dashboard-test/src/pages/CatalogsPage.tsx
@@ -8,6 +8,7 @@ import { AreasCatalog } from "../components/organisms/catalogs/AreasCatalog";
 import { DepartmentsCatalog } from "../components/organisms/catalogs/DepartmentsCatalog";
 import { EmailsCatalog } from "../components/organisms/catalogs/EmailsCatalog";
 import { ReceptorsCatalog } from "../components/organisms/catalogs/ReceptorsCatalog";
+import { ScheduledDowntimesCatalog } from "../components/organisms/catalogs/ScheduledDowntimesCatalog";
 import { TorretaColorsCatalog } from "../components/organisms/catalogs/TorretaColorsCatalog";
 import { TorretasCatalog } from "../components/organisms/catalogs/TorretasCatalog";
 
@@ -17,7 +18,8 @@ type CatalogId =
   | "torretas"
   | "torreta-colors"
   | "receptors"
-  | "emails";
+  | "emails"
+  | "scheduled-downtimes";
 
 const allCatalogs = [
   {
@@ -40,6 +42,12 @@ const allCatalogs = [
   },
   { id: "receptors" as CatalogId, name: "Receptores", icon: "radio" },
   { id: "emails" as CatalogId, name: "Correos", icon: "mail" },
+  {
+    id: "scheduled-downtimes" as CatalogId,
+    name: "Paros Programados",
+    icon: "clock",
+    moduleType: ModuleType.SIGNALS,
+  },
 ];
 
 export function CatalogsPage() {
@@ -69,6 +77,10 @@ export function CatalogsPage() {
         return <ReceptorsCatalog />;
       case "emails":
         return <EmailsCatalog />;
+      case "scheduled-downtimes":
+        if (!modules[ModuleType.SIGNALS]) return null;
+
+        return <ScheduledDowntimesCatalog />;
       default:
         return <AreasCatalog />;
     }
```

### `dashboard-test/src/components/atoms/Icon.tsx`

**#33.**

```diff
diff --git a/dashboard-test/src/components/atoms/Icon.tsx b/dashboard-test/src/components/atoms/Icon.tsx
index ba665b7..2f8a165 100644
--- a/dashboard-test/src/components/atoms/Icon.tsx
+++ b/dashboard-test/src/components/atoms/Icon.tsx
@@ -16,6 +16,7 @@ import {
   FaBroadcastTower,
   FaEnvelope,
   FaLock,
+  FaClock,
 } from "react-icons/fa";
 import { FaShieldHalved } from "react-icons/fa6";
 import { MdTraffic } from "react-icons/md";
@@ -45,6 +46,7 @@ const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
   palette: FaPalette,
   radio: FaBroadcastTower,
   mail: FaEnvelope,
+  clock: FaClock,
 };
 
 export const Icon: React.FC<IconProps> = ({
```

### `dashboard-test/src/constants/permissions.ts`

**#34.** Enum espejo del backend.

```diff
diff --git a/dashboard-test/src/constants/permissions.ts b/dashboard-test/src/constants/permissions.ts
index 9d08c62..063aa94 100644
--- a/dashboard-test/src/constants/permissions.ts
+++ b/dashboard-test/src/constants/permissions.ts
@@ -15,6 +15,7 @@ export enum Module {
   RECEPTORS = "receptors",
   EVENTS = "events",
   EMAILS = "emails",
+  SCHEDULED_DOWNTIMES = "scheduled-downtimes",
   USERS = "users",
   DASHBOARD = "dashboard",
   ROLES_AND_PERMISSIONS = "roles-and-permissions",
```

---

## 8. Migraciones

Las dos migraciones (§5, archivos #11 y #12) ya contienen todo. Aplícalas:

```bash
cd backend-receptor
npm run migration:run
```

**`1785000000000-CreateScheduledDowntimes.ts`**
- `CREATE TABLE scheduled_downtimes` + índices `(area_id)` y `(area_id, is_active)`.
- Seed idempotente (`ON CONFLICT DO NOTHING`) de los 4 permisos del módulo.

**`1785000000001-AddScheduledDowntimeSnapshotColumns.ts`**
- `events`: 3 columnas + índice `(area_id, closed_at)`.
- `area_downtimes`: 4 columnas + índice `(area_id, ends_at)`.
- **Backfill** de las filas ya cerradas: `discount = 0`, `effective = duration`. Es correcto —
  antes de esta fase no existían paros programados, así que el descuento histórico real es 0.
- Los índices sobre `closed_at` / `ends_at` **no existían** y los reportes de Fase 2 los
  necesitan para no hacer seq scan sobre toda la tabla de eventos.

Verificación en BD:

```sql
SELECT * FROM scheduled_downtimes LIMIT 1;
SELECT * FROM permissions WHERE module = 'scheduled-downtimes';   -- 4 filas
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'events' AND column_name LIKE '%scheduled%';  -- 2 filas
```

### 8.1 Configuración de entorno (obligatoria)

Agrega `PLANT_TIMEZONE` al servicio `backend` en `docker/docker-compose.yml`, junto a las otras
variables:

```yaml
      PLANT_TIMEZONE: ${PLANT_TIMEZONE:-America/Mexico_City}
```

Y a `env.example`, documentando que es la zona IANA de la planta (para este cliente,
`America/Chihuahua`). Si es inválida, el backend **falla al arrancar** con un mensaje claro:
es deliberado, ver §2.1.

### 8.2 Permisos y roles

Los permisos quedan en `permissions` pero **no** se asignan a ningún rol automáticamente (solo
`ADMIN` los obtiene todos, vía `ADMIN_USERNAME`). Asigna
`scheduled-downtimes:read/create/update/delete` al rol que corresponda desde *Roles y
Permisos*, o con una migración al estilo de `1773271257507-CreateVirtualDeviceRole.ts`.

---

## 9. Verificación

### 9.1 Backend

```bash
cd backend-receptor
npm install
npx tsc --noEmit -p tsconfig.json     # debe dar 143 errores: la línea base exacta
npx jest scheduled-downtime-calculator # 18/18
npx jest                               # 975/975, 69 suites
npx eslint "src/scheduled-downtimes/**/*.ts" src/config/plant-timezone.config.ts \
  src/signals/application/services/signal.service.ts \
  src/area-downtime/application/services/area-downtime.service.ts \
  src/alert-escalation/application/services/alert-cron.service.ts
```

> **Sobre los 143 errores de `tsc`:** son **preexistentes** en `main`, todos en archivos
> `.spec.ts` (patrones `noUncheckedIndexedAccess` / `exactOptionalPropertyTypes`). El código de
> esta fase aporta **0**. Si obtienes 144+, algo de lo que aplicaste introdujo un error nuevo:
> localízalo antes de seguir. Si obtienes menos de 143, alguien arregló errores preexistentes
> en un commit posterior — verifica que ninguno de los tuyos esté entre los que quedan.

**Prueba de mutación (opcional pero recomendada).** Confirma que las guardas de zona horaria
son reales: en `scheduled-downtime-calculator.service.ts`, dentro de `wallClockToInstant`,
inserta temporalmente al inicio del método:

```ts
return new Date(date.year, date.month - 1, date.day, hours!, minutes!);
```

Corre `npx jest scheduled-downtime-calculator`: deben **fallar 8 tests** (4, 10, 11, 13, 14,
entre otros). Revierte el cambio. Si pasan todos, algo está mal en tu copia del spec.

### 9.2 Frontend

```bash
cd dashboard-test
CYPRESS_INSTALL_BINARY=0 npm install --legacy-peer-deps
# --legacy-peer-deps: conflicto preexistente entre @heroui/theme y @heroui/card, ajeno a esta fase.
# CYPRESS_INSTALL_BINARY=0 solo hace falta sin salida a download.cypress.io.
npx tsc --noEmit    # 0 errores
npx eslint src/components/organisms/catalogs/ScheduledDowntimesCatalog.tsx \
  src/types/scheduled-downtime.ts src/hooks/useCatalogs.ts \
  src/lib/validations/schemas.ts src/pages/CatalogsPage.tsx \
  src/components/atoms/Icon.tsx src/constants/permissions.ts
```

### 9.3 Prueba manual end-to-end

Con backend + BD arriba, `PLANT_TIMEZONE=America/Chihuahua` y sesión como `ADMIN`:

1. **Catálogos → Paros Programados** → crear "Comida", un área, `12:00`–`13:00`, Lun-Vie, activo.
2. Crear "Comida nocturna", misma área, `23:00`–`02:00`, solo Lunes. La tabla debe mostrar
   **`23:00 - 02:00 (+1 día)`** y el formulario el aviso de cruce de medianoche.
3. Editar, desactivar y eliminar (soft delete) uno de ellos.
4. **Caso A** — verificar el cálculo (usa offset explícito `-06:00`):

```bash
curl -G "http://localhost:3000/scheduled-downtimes/area/<AREA_ID>/effective-seconds" \
  --data-urlencode "start=2026-07-13T11:30:00-06:00" \
  --data-urlencode "end=2026-07-13T13:30:00-06:00" \
  -H "Authorization: Bearer <TOKEN>"
```

Esperado: `rawSeconds: 7200`, `discountedSeconds: 3600`, `effectiveSeconds: 3600`, y el
`snapshot.timezone` en `America/Chihuahua`.

5. **Caso B (D1)** — con un paro programado de 13:00 a 14:00 y un umbral de escalamiento de
   30 min, abrir una llamada a las 12:40 hora de planta: **no** debe escalar a las 13:10; debe
   escalar a las 14:10.
6. Cerrar un evento y verificar en BD que se congeló todo:

```sql
SELECT duration_seconds, scheduled_downtime_discount_seconds,
       effective_duration_seconds, scheduled_downtime_snapshot
  FROM events WHERE status = 'closed' ORDER BY id DESC LIMIT 1;
```

7. **Inmutabilidad**: renombra el paro programado y confirma que el `snapshot` del evento ya
   cerrado **sigue mostrando el nombre viejo**. Es el comportamiento correcto (§0.2.1).

---

## 10. API nueva

Base `/scheduled-downtimes`, con `JwtAuthGuard` + `PermissionGuard` y
`@SystemModuleTag(SystemModule.SIGNALS)`.

| Método | Ruta | Permiso |
|---|---|---|
| POST | `/scheduled-downtimes` | `create` |
| GET | `/scheduled-downtimes` (`areaId`, `isActive`, `name`, `limit`, `offset`, `includeDeleted`) | `read` |
| GET | `/scheduled-downtimes/count` | `read` |
| GET | `/scheduled-downtimes/area/:areaId/effective-seconds?start=&end=` | `read` |
| GET | `/scheduled-downtimes/:id` | `read` |
| PATCH | `/scheduled-downtimes/:id` | `update` |
| DELETE | `/scheduled-downtimes/:id` (soft delete) | `delete` |
| PATCH | `/scheduled-downtimes/:id/restore` | `update` |

Contrato:

```ts
{
  name: string;          // requerido en create
  areaId: number;        // debe existir en `areas` → si no, 404
  startTime: string;     // "HH:mm", hora de planta
  endTime: string;       // "HH:mm". PUEDE ser < startTime (cruza medianoche).
                         // Solo se rechaza que sea IGUAL a startTime → 400
  daysOfWeek: number[];  // 0=domingo … 6=sábado. Días en que la ventana ARRANCA
  isActive?: boolean;    // default true
}
```

**Para Fase 2 (Reportes):** inyecta `ScheduledDowntimeCalculatorService` (exportado por
`ScheduledDowntimesModule`). Pero para agregados por rango **no lo llames por fila**: suma las
columnas ya calculadas (`effective_duration_seconds`), que para eso se persistieron. Y recuerda
la regla de §0: disponibilidad de línea sale de `area_downtimes` (deduplicado), atribución por
departamento de `events`; **sumar `events` para disponibilidad cuenta el paro doble**.

---

## 11. Checklist de aceptación

- [ ] Los 12 archivos nuevos de backend (§3.1) y los 2 de frontend (§3.2) existen con el
      contenido de §5 y §6.
- [ ] Los 20 diffs de §7 están aplicados.
- [ ] `PLANT_TIMEZONE` declarada en `docker-compose.yml` y `env.example`.
- [ ] Las dos migraciones corrieron; `scheduled_downtimes` existe y hay 4 permisos nuevos.
- [ ] `npx jest` → **975/975**. `npx jest scheduled-downtime-calculator` → **18/18**.
- [ ] `npx tsc --noEmit` backend → **143** (línea base). Frontend → **0**.
- [ ] ESLint limpio en los archivos tocados.
- [ ] **Caso A** verificado por el endpoint de §9.3.4 (3600 s descontados de 7200).
- [ ] **Caso B (D1)** verificado: la llamada de las 12:40 escala a las 14:10, no a las 13:10.
- [ ] **D2** verificado: se puede capturar "Lunes 23:00 → martes 02:00" y la UI muestra `(+1 día)`.
- [ ] Al cerrar un evento y un downtime de área se persisten las columnas + snapshot.
- [ ] Renombrar un paro programado no altera los snapshots ya escritos.
- [ ] `startTime === endTime` → `400`. Área inexistente → `404`.
- [ ] Un usuario sin permisos `scheduled-downtimes:*` no ve la pestaña.
- [ ] `PLANT_TIMEZONE` inválida → el backend falla al arrancar con mensaje claro.

---

## 12. Lo que esta fase NO hace

- No construye los reportes de disponibilidad ni la exportación a Excel (Fase 2). Deja los
  datos listos y los índices creados.
- No cambia el dashboard en vivo: los paros programados **no** alteran el semáforo del área. Si
  una llamada está abierta durante la comida, la línea sigue en rojo — está parada de verdad. El
  descuento es un concepto de reportería y de reloj de escalamiento, no de estado operativo.
- No soporta excepciones de fecha puntual ("el 25 de diciembre no aplica"). IoTrack tampoco lo
  tiene → no es una regresión.
- No implementa el endpoint de recálculo retroactivo (`POST /scheduled-downtimes/recalculate`)
  descrito en el plan §1.7. **Queda pendiente y es la primera deuda a saldar**: cuando el
  cliente configure mal un horario o lo dé de alta tarde, va a hacer falta. Los snapshots están
  congelados por diseño, así que hoy la única vía sería recalcular a mano.
