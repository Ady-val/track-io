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
