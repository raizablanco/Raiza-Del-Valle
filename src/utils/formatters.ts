import { HistoryPoint, LogEvent } from '../types/simulation';

export function formatSimulatedTime(totalSeconds: number): string {
  const floorSec = Math.floor(totalSeconds);
  const hours = Math.floor(floorSec / 3600);
  const minutes = Math.floor((floorSec % 3600) / 60);
  const seconds = floorSec % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatNumber(val: number, decimals: number = 1): string {
  if (isNaN(val) || !isFinite(val)) return '0.0';
  return val.toFixed(decimals);
}

export function exportSimulationToCsv(
  history: HistoryPoint[],
  events: LogEvent[]
): string {
  const lines: string[] = [];

  // Header and Metadata
  lines.push('# SIMULADOR DE MONITOREO Y CONTROL DE ESTANQUE INDUSTRIAL');
  lines.push('# Presentación Académica: Ingeniería en Automatización y Control Industrial');
  lines.push(`# Fecha de exportación: ${new Date().toISOString()}`);
  lines.push('');

  // History Data Table
  lines.push('--- REGISTRO HISTÓRICO DE VARIABLES DE PROCESO ---');
  lines.push([
    'Tiempo (s)',
    'Tiempo (mm:ss)',
    'Nivel (%)',
    'Volumen (L)',
    'Caudal Entrada Efectivo (L/min)',
    'Caudal Salida Efectivo (L/min)',
    'Caudal Neto (L/min)',
    'Estado Bomba',
    'Modo Control',
    'Alarmas Activas'
  ].join(';'));

  for (const h of history) {
    lines.push([
      h.timeSeconds.toFixed(1),
      h.timeFormatted,
      h.levelPct.toFixed(2),
      h.volume.toFixed(2),
      h.effectiveInletFlow.toFixed(2),
      h.effectiveOutletFlow.toFixed(2),
      h.netFlow.toFixed(2),
      h.pumpState,
      h.controlMode,
      h.activeAlarms.length > 0 ? `"${h.activeAlarms.join(', ')}"` : 'Ninguna'
    ].join(';'));
  }

  lines.push('');
  lines.push('--- REGISTRO DE EVENTOS OPERACIONALES (LOGBOOK) ---');
  lines.push(['ID', 'Tiempo Simulado', 'Categoría', 'Severidad', 'Descripción'].join(';'));

  for (const ev of events) {
    lines.push([
      ev.id,
      ev.timeFormatted,
      ev.category,
      ev.severity.toUpperCase(),
      `"${ev.description.replace(/"/g, '""')}"`
    ].join(';'));
  }

  return lines.join('\n');
}

export function triggerDownload(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
