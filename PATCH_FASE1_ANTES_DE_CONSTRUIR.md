# PARCHE al BUILD SPEC de Fase 1 — aplicar ANTES de construirla

> **Léelo antes de tocar `CLAUDE_CODE_BUILD_SPEC_FASE1.md`.**
>
> **Contexto:** la Fase 2 (`BUILD_SPEC_FASE2_DASHBOARD.md` §2) sustituye la columna
> `events.scheduled_downtime_snapshot` (jsonb) por una tabla normalizada
> `event_scheduled_downtime_slices`, porque el negocio exige saber **de qué hora a qué hora**
> influyó cada paro programado y poder consultarlo con SQL.
>
> Como la **Fase 1 aún no está desplegada** (camino A confirmado con el cliente), no tiene
> sentido construir esa columna para borrarla acto seguido. Este parche la elimina del spec de
> Fase 1 antes de que exista.

---

## 1. Lo que NO cambia (tranquilízate: es casi todo)

Sigue **exactamente igual** al spec de Fase 1, verificado con 975/975 tests:

- `ScheduledDowntimeCalculatorService` completo, incluidos `getDiscountedSeconds()`,
  `getEffectiveSeconds()` y `getDiscountSnapshot()`.
- **Los 18 tests del calculador**, incluida la prueba de mutación de zona horaria.
- Toda la lógica de zona horaria, ventanas que cruzan medianoche y unión de intervalos.
- El escalamiento por minutos productivos (D1) y su caché.
- El catálogo, su CRUD, su UI y sus permisos.
- El snapshot `jsonb` de **`area_downtimes`** — ese **se queda**. Es auditoría del número de
  disponibilidad y no es la unidad de transparencia que pidió el negocio.

**El parche solo toca `events`.** Cuatro cambios pequeños.

---

## 2. Los cuatro cambios

### 2.1 Entidad `events`

En `backend-receptor/src/events/domain/entities/event.entity.ts`, del diff **#18** del spec de
Fase 1: **omite el campo `scheduledDowntimeSnapshot`**. Los otros dos se quedan:

```ts
// ✅ SE QUEDAN
scheduledDowntimeDiscountSeconds?: number;
effectiveDurationSeconds?: number;

// ❌ NO LO AGREGUES — la Fase 2 lo sustituye por event_scheduled_downtime_slices
// scheduledDowntimeSnapshot?: object | null;
```

`area_downtimes` (diff **#19**) **no se toca**: conserva sus cuatro columnas, snapshot incluido.

### 2.2 Migración

En `backend-receptor/src/migrations/1785000000001-AddScheduledDowntimeSnapshotColumns.ts`
(archivo **#12**), quita `scheduled_downtime_snapshot` **solo del `ALTER TABLE "events"`**:

```sql
-- Queda así:
ALTER TABLE "events"
  ADD COLUMN "scheduled_downtime_discount_seconds" integer,
  ADD COLUMN "effective_duration_seconds" integer;
```

El `ALTER TABLE "area_downtimes"` se queda **completo, con su jsonb**. Ajusta el `down()` en
consecuencia.

### 2.3 `SignalService.closeEvent()`

En el diff **#15**, deja de persistir el snapshot en el evento. Sigue calculándolo (lo necesitas
para el número), pero solo guarda las cifras:

```ts
const updatedEvent = await this.eventRepository.updateStatus(event.id, EventStatus.CLOSED, {
  durationSeconds,
  scheduledDowntimeDiscountSeconds: discount.totalDiscountedSeconds,
  effectiveDurationSeconds: Math.max(0, durationSeconds - discount.totalDiscountedSeconds),
  // scheduledDowntimeSnapshot: discount.snapshot,   ← ELIMINAR
});
```

`safeCalculateDiscount()` puede seguir devolviendo el snapshot: la Fase 2 reemplazará su
interior por las rebanadas. **Mantén intacta la degradación segura**: si el cálculo falla, el
evento se cierra igual con descuento 0. El cierre del Andon sigue siendo sagrado.

`AreaDowntimeService.endAreaDowntime()` (diff **#16**) **no se toca**: sigue guardando su
snapshot.

### 2.4 `signal.service.spec.ts`

En el diff **#27**, ajusta el assert del cierre para que **no espere**
`scheduledDowntimeSnapshot` en el `updateStatus` de `events`. Los demás campos se verifican
igual.

El spec de `area-downtime.service.spec.ts` (**#28**) **no cambia**: ahí el snapshot sí se
espera.

---

## 3. Verificación tras el parche

Las mismas cifras del spec de Fase 1 deben seguir dándose:

```bash
cd backend-receptor
npx jest scheduled-downtime-calculator   # 18/18 — no los tocaste, deben pasar idénticos
npx jest                                  # 975/975
npx tsc --noEmit -p tsconfig.json         # 143 = línea base exacta
```

Si `npx jest scheduled-downtime-calculator` no da 18/18, tocaste algo que este parche no pedía:
revísalo antes de seguir.

---

## 4. Qué hace la Fase 2 encima

Para que veas a dónde va esto y no te sorprenda:

| Fase 2 agrega | Sobre |
|---|---|
| `events.response_discount_seconds` | La columna que separa el descuento del tramo de atención del de solución |
| Tabla `event_scheduled_downtime_slices` | El "de qué hora a qué hora", consultable y con nombres congelados |
| `calculator.getDiscount()` con **rebanadas disjuntas** | Nuevo método. `getDiscountSnapshot()` pasa a derivarse de él, para no tener dos fuentes de verdad |
| Doble llamada en `closeEvent()` | Un cálculo por tramo (atención / solución) |
| `POST /scheduled-downtimes/recalculate` | La red de seguridad para corregir históricos |

Nada de eso invalida lo que construyes en la Fase 1: **es aditivo**.
