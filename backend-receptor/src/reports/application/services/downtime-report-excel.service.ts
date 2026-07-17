import { Injectable } from '@nestjs/common';
import { Workbook, type Worksheet } from 'exceljs';
import { DowntimeReportService } from './downtime-report.service';
import { AreaRepository } from '../../../areas/domain/repositories/area.repository';
import type {
  DowntimeReportQueryDto,
  DowntimeReportSummary,
  EventReportQueryDto,
} from '../dtos/downtime-report.dto';

const EVENT_PAGE_SIZE = 100;

/** Formato de celda de fecha-hora (hora de planta). */
const DATE_FMT = 'yyyy-mm-dd hh:mm:ss';
/** Formato de celda de duración en minutos, con decimales (ver `toMinutes`). */
const MINUTES_FMT = '0.00';

/**
 * Exportación a Excel del reporte de paros (§7). Tres hojas que permiten
 * auditar la cadena completa a mano:
 *  1. Resumen  — una fila por área (+ total), con la resta rehacible.
 *  2. Eventos  — todos los tiempos por evento, visibles y juntos.
 *  3. Paros programados aplicados — una fila por rebanada, el "de qué hora a
 *     qué hora", en HORA DE PLANTA y con nombres CONGELADOS.
 *
 * Los instantes van como CELDAS DE FECHA-HORA reales de Excel (no texto), para
 * que se puedan ordenar y filtrar; las duraciones, en MINUTOS con decimales.
 * Generación en backend.
 */
@Injectable()
export class DowntimeReportExcelService {
  constructor(
    private readonly reportService: DowntimeReportService,
    private readonly areaRepository: AreaRepository
  ) {}

  async generateWorkbookBuffer(query: DowntimeReportQueryDto): Promise<Buffer> {
    const report = await this.reportService.getDowntimeReport(query);
    const timezone = report.range.timezone;
    const workbook = new Workbook();
    workbook.creator = 'Track.IO';
    workbook.created = new Date();

    await this.buildSummarySheet(workbook, query, report.summary, timezone);
    await this.buildEventSheets(workbook, query, timezone);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private async buildSummarySheet(
    workbook: Workbook,
    query: DowntimeReportQueryDto,
    totalSummary: DowntimeReportSummary,
    timezone: string
  ): Promise<void> {
    const sheet = workbook.addWorksheet('Resumen');

    sheet.addRow(['Reporte de paros — Track.IO']);
    sheet.addRow([
      `Rango consultado: ${this.fmt(query.from, timezone)} — ${this.fmt(query.to, timezone)}`,
    ]);
    sheet.addRow([`Zona horaria de planta: ${timezone}`]);
    sheet.addRow([`Generado: ${this.fmt(new Date().toISOString(), timezone)}`]);
    sheet.addRow([
      'Nota: el sistema solo mide el paro reportado con la botonera (Andon). ' +
        'El paro no reportado no aparece aquí.',
    ]);
    sheet.addRow([]);

    const header = sheet.addRow([
      'Área',
      'Tiempo calendario (min)',
      'Paro programado (min)',
      'Tiempo productivo planeado (min)',
      'Paro no programado (min)',
      'Tiempo corriendo (min)',
      'Disponibilidad',
      'Nº paros',
      'Atención prom. (min)',
      'Solución prom. (min)',
    ]);
    header.font = { bold: true };

    sheet.getColumn(1).width = 18;
    for (const col of [2, 3, 4, 5, 6, 9, 10]) {
      sheet.getColumn(col).numFmt = MINUTES_FMT;
      sheet.getColumn(col).width = 18;
    }

    const areas = query.areaId
      ? [{ id: query.areaId, name: '' }]
      : (await this.areaRepository.findAll({})).data.map(a => ({
          id: a.id,
          name: a.name,
        }));

    for (const area of areas) {
      const areaReport = await this.reportService.getDowntimeReport({
        ...query,
        areaId: area.id,
      });
      const name = area.name || areaReport.scope.areaName || `Área ${area.id}`;
      this.addSummaryRow(sheet, name, areaReport.summary);
    }

    if (!query.areaId) {
      const totalRow = this.addSummaryRow(sheet, 'TOTAL', totalSummary);
      totalRow.font = { bold: true };
    }
  }

  private addSummaryRow(
    sheet: Worksheet,
    label: string,
    summary: DowntimeReportSummary
  ): ReturnType<Worksheet['addRow']> {
    return sheet.addRow([
      label,
      this.toMinutes(summary.calendarSeconds),
      this.toMinutes(summary.scheduledDowntimeSeconds),
      this.toMinutes(summary.plannedProductionSeconds),
      this.toMinutes(summary.unplannedDowntimeSeconds),
      this.toMinutes(summary.runSeconds),
      summary.availability == null
        ? '—'
        : `${(summary.availability * 100).toFixed(2)}%`,
      summary.eventCount,
      this.toMinutes(summary.avgResponseSeconds),
      this.toMinutes(summary.avgResolutionSeconds),
    ]);
  }

  private async buildEventSheets(
    workbook: Workbook,
    query: DowntimeReportQueryDto,
    timezone: string
  ): Promise<void> {
    const eventsSheet = workbook.addWorksheet('Eventos');
    eventsSheet.addRow([
      'Área',
      'Departamento',
      'Inicio',
      'Atendido',
      'Cierre',
      'Duración (min)',
      'Paro programado en el evento (min)',
      'Duración efectiva (min)',
      'Atención (min)',
      'Atención efectiva (min)',
      'Solución (min)',
      'Solución efectiva (min)',
      'Origen',
      'Motivo',
      'Comentario',
    ]).font = { bold: true };

    for (const col of [3, 4, 5]) {
      eventsSheet.getColumn(col).numFmt = DATE_FMT;
      eventsSheet.getColumn(col).width = 20;
    }
    for (const col of [6, 7, 8, 9, 10, 11, 12]) {
      eventsSheet.getColumn(col).numFmt = MINUTES_FMT;
      eventsSheet.getColumn(col).width = 16;
    }

    const slicesSheet = workbook.addWorksheet('Paros programados aplicados');
    slicesSheet.addRow([
      'Evento ID',
      'Área',
      'Paro programado',
      'Ventana configurada',
      'Ocurrió desde',
      'Ocurrió hasta',
      'Minutos',
      'Tramo',
    ]).font = { bold: true };

    for (const col of [5, 6]) {
      slicesSheet.getColumn(col).numFmt = DATE_FMT;
      slicesSheet.getColumn(col).width = 20;
    }
    slicesSheet.getColumn(7).numFmt = MINUTES_FMT;

    let offset = 0;
    for (;;) {
      const eventQuery: EventReportQueryDto = {
        from: query.from,
        to: query.to,
        limit: EVENT_PAGE_SIZE,
        offset,
      };
      if (query.areaId) {
        eventQuery.areaId = query.areaId;
      }
      const page = await this.reportService.getEventReport(eventQuery);

      for (const event of page.data) {
        eventsSheet.addRow([
          event.areaName,
          event.departmentName,
          this.plantDateCell(event.createdAt, timezone),
          event.inProgressAt
            ? this.plantDateCell(event.inProgressAt, timezone)
            : '',
          event.closedAt ? this.plantDateCell(event.closedAt, timezone) : '',
          this.toMinutes(event.durationSeconds),
          this.toMinutes(event.scheduledDowntimeDiscountSeconds),
          this.toMinutes(event.effectiveDurationSeconds),
          this.toMinutes(event.responseSeconds),
          this.toMinutes(event.effectiveResponseSeconds),
          this.toMinutes(event.resolutionSeconds),
          this.toMinutes(event.effectiveResolutionSeconds),
          event.virtualDevice ? 'Virtual' : 'Físico',
          event.reason ?? '',
          event.comment ?? '',
        ]);

        for (const slice of event.scheduledDowntimeSlices) {
          slicesSheet.addRow([
            event.id,
            event.areaName,
            slice.name, // nombre CONGELADO de la rebanada
            `${slice.configuredStartTime}–${slice.configuredEndTime}`,
            this.plantDateCell(slice.occurredFrom, timezone),
            this.plantDateCell(slice.occurredTo, timezone),
            this.toMinutes(slice.seconds),
            slice.segment === 'response' ? 'Atención' : 'Solución',
          ]);
        }
      }

      if (page.data.length < EVENT_PAGE_SIZE) {
        break;
      }
      offset += EVENT_PAGE_SIZE;
    }
  }

  /**
   * ISO → celda de fecha-hora de Excel en HORA DE PLANTA.
   *
   * Excel no guarda zona horaria: un serial de fecha es hora de pared "desnuda",
   * y ExcelJS lo calcula desde `date.getTime()` (epoch UTC). Para que la celda
   * MUESTRE la hora de planta hay que desplazar el instante de modo que sus
   * componentes UTC sean los de la planta. Sin esto, una comida de las 12:00 de
   * planta se exportaría como 18:00.
   */
  private plantDateCell(iso: string, timeZone: string): Date | string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
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
    return new Date(
      Date.UTC(
        map['year']!,
        map['month']! - 1,
        map['day']!,
        map['hour']! % 24,
        map['minute']!,
        map['second']!
      )
    );
  }

  /**
   * Segundos → minutos, conservando decimales a propósito.
   *
   * Redondear cada tiempo al minuto entero rompería la comprobación de la resta
   * que el cliente debe poder rehacer a mano: 80 s − 40 s = 40 s se convertiría
   * en 1 − 1 = 0. Con decimales, `duración − programado = efectiva` sigue
   * cuadrando en la hoja.
   */
  private toMinutes(seconds: number | null | undefined): number | string {
    return seconds == null ? '' : seconds / 60;
  }

  /** ISO → 'YYYY-MM-DD HH:mm:ss' en hora de planta (para textos de encabezado). */
  private fmt(iso: string, timeZone: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
      return iso;
    }
    const dtf = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const map: Record<string, string> = {};
    for (const part of dtf.formatToParts(date)) {
      if (part.type !== 'literal') map[part.type] = part.value;
    }
    const hour = map['hour'] === '24' ? '00' : map['hour'];
    return `${map['year']}-${map['month']}-${map['day']} ${hour}:${map['minute']}:${map['second']}`;
  }
}
