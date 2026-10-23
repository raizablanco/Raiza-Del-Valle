import React, { useState } from 'react';
import { HistoryPoint, LogEvent } from '../types/simulation';
import { formatNumber, exportSimulationToCsv, triggerDownload } from '../utils/formatters';
import { Download, List, History, ShieldAlert, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface HistoryAndEventsProps {
  history: HistoryPoint[];
  events: LogEvent[];
}

export const HistoryAndEvents: React.FC<HistoryAndEventsProps> = ({ history, events }) => {
  const [activeTab, setActiveTab] = useState<'history' | 'events'>('events');

  const handleDownloadCsv = () => {
    const csvContent = exportSimulationToCsv(history, events);
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    triggerDownload(csvContent, `registro_estanque_industrial_${dateStr}.csv`);
  };

  const getSeverityBadge = (sev: LogEvent['severity']) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-800/60">
            <ShieldAlert className="w-3 h-3" /> CRÍTICO
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/60">
            <AlertTriangle className="w-3 h-3" /> ADVERTENCIA
          </span>
        );
      case 'success':
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/60">
            <CheckCircle className="w-3 h-3" /> RECUPERADO
          </span>
        );
      case 'info':
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            <Info className="w-3 h-3 text-cyan-400" /> INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        {/* Tab switchers */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'events'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Registro de Eventos ({events.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Muestras Históricas ({history.length})</span>
          </button>
        </div>

        {/* Download CSV button */}
        <button
          onClick={handleDownloadCsv}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 hover:border-cyan-500/50 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Descargar Registro CSV</span>
        </button>
      </div>

      {/* Tab 1: Event Log */}
      {activeTab === 'events' && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {events.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Sin eventos registrados aún. Inicie la simulación.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Tiempo</th>
                  <th className="py-2 px-3">Categoría</th>
                  <th className="py-2 px-3">Severidad</th>
                  <th className="py-2 px-3">Descripción del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-200">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-slate-500 text-[11px]">{ev.id}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{ev.timeFormatted}</td>
                    <td className="py-2 px-3">
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ev.category}
                      </span>
                    </td>
                    <td className="py-2 px-3">{getSeverityBadge(ev.severity)}</td>
                    <td className="py-2 px-3 font-sans text-slate-200 text-xs">
                      {ev.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Tab 2: History Table */}
      {activeTab === 'history' && (
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {history.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Sin registros históricos. Inicie la simulación para acumular datos.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse font-mono">
              <thead className="sticky top-0 bg-slate-950 text-slate-400 text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">Tiempo (s)</th>
                  <th className="py-2 px-3">Nivel (%)</th>
                  <th className="py-2 px-3">Volumen (L)</th>
                  <th className="py-2 px-3">Qin (L/min)</th>
                  <th className="py-2 px-3">Qout (L/min)</th>
                  <th className="py-2 px-3">Qneto (L/min)</th>
                  <th className="py-2 px-3">Bomba</th>
                  <th className="py-2 px-3">Modo</th>
                  <th className="py-2 px-3">Alarmas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {history.slice(-100).reverse().map((pt, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-cyan-300">{pt.timeFormatted}</td>
                    <td className="py-2 px-3 font-bold text-slate-100">{formatNumber(pt.levelPct, 1)}%</td>
                    <td className="py-2 px-3">{formatNumber(pt.volume, 1)}</td>
                    <td className="py-2 px-3 text-sky-400">{formatNumber(pt.effectiveInletFlow, 1)}</td>
                    <td className="py-2 px-3 text-indigo-400">{formatNumber(pt.effectiveOutletFlow, 1)}</td>
                    <td className={`py-2 px-3 font-semibold ${pt.netFlow > 0 ? 'text-emerald-400' : pt.netFlow < 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {pt.netFlow > 0 ? `+${formatNumber(pt.netFlow, 1)}` : formatNumber(pt.netFlow, 1)}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${pt.pumpState === 'ON' ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                        {pt.pumpState}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400">{pt.controlMode}</td>
                    <td className="py-2 px-3 text-[11px]">
                      {pt.activeAlarms.length > 0 ? (
                        <span className="text-amber-400 font-semibold">{pt.activeAlarms.join(', ')}</span>
                      ) : (
                        <span className="text-slate-500">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
