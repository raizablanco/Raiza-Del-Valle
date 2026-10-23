import React from 'react';
import { SimulationParams, SimulationState } from '../types/simulation';
import { formatNumber } from '../utils/formatters';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Gauge,
  Minus,
  Power
} from 'lucide-react';

interface KpiMetricsBarProps {
  params: SimulationParams;
  state: SimulationState;
}

export const KpiMetricsBar: React.FC<KpiMetricsBarProps> = ({ params, state }) => {
  const {
    levelPct,
    volume,
    effectiveInletFlow,
    effectiveOutletFlow,
    netFlow,
    pumpState,
    pumpCommandSource,
    controlMode,
    estimatedTimeToOffMinutes
  } = state;

  const { capacity, inletFlowNominal, outletFlowNominal, offThresholdPct } = params;

  // Net flow trend indicator
  let trendIcon = <Minus className="w-4 h-4 text-slate-400" />;
  let trendLabel = 'Estable';
  let trendClass = 'text-slate-400';

  if (netFlow > 0.05) {
    trendIcon = <ArrowUpRight className="w-4 h-4 text-emerald-400" />;
    trendLabel = `Subiendo (+${formatNumber(netFlow, 1)} L/min)`;
    trendClass = 'text-emerald-400';
  } else if (netFlow < -0.05) {
    trendIcon = <ArrowDownRight className="w-4 h-4 text-amber-400" />;
    trendLabel = `Bajando (${formatNumber(netFlow, 1)} L/min)`;
    trendClass = 'text-amber-400';
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Nivel Actual */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Nivel de Proceso</span>
          <Gauge className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {formatNumber(levelPct, 1)} <span className="text-sm font-sans text-cyan-400">%</span>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {formatNumber(volume, 1)} / {capacity} L
          </div>
        </div>
      </div>

      {/* 2. Caudal de Entrada Efectivo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Caudal Entrada Efectivo</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            Qin
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-sky-400 tracking-tight">
            {formatNumber(effectiveInletFlow, 1)}{' '}
            <span className="text-sm font-sans text-slate-400">L/min</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Nominal: {inletFlowNominal} L/min
          </div>
        </div>
      </div>

      {/* 3. Caudal de Salida Efectivo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Caudal Salida Efectivo</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            Qout
          </span>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-indigo-400 tracking-tight">
            {formatNumber(effectiveOutletFlow, 1)}{' '}
            <span className="text-sm font-sans text-slate-400">L/min</span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Solicitado: {outletFlowNominal} L/min
          </div>
        </div>
      </div>

      {/* 4. Caudal Neto y Balance */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Caudal Neto (Balance)</span>
          <Activity className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-2">
          <div className={`text-2xl font-bold font-mono tracking-tight ${trendClass}`}>
            {netFlow > 0 ? `+${formatNumber(netFlow, 1)}` : formatNumber(netFlow, 1)}{' '}
            <span className="text-sm font-sans text-slate-400">L/min</span>
          </div>
          <div className="flex items-center gap-1 text-xs mt-0.5 font-medium">
            {trendIcon}
            <span className={trendClass}>{trendLabel}</span>
          </div>
        </div>
      </div>

      {/* 5. Estado de la Bomba */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Bomba P-101</span>
          <Power className={`w-4 h-4 ${pumpState === 'ON' ? 'text-emerald-400' : 'text-slate-500'}`} />
        </div>
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                pumpState === 'ON' ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-slate-600'
              }`}
            />
            <span
              className={`text-lg font-bold font-mono tracking-tight ${
                pumpState === 'ON' ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {pumpState === 'ON' ? 'ENCENDIDA' : 'APAGADA'}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Origen: {pumpCommandSource === 'AUTO' ? 'Lógica Auto' : pumpCommandSource === 'MANUAL' ? 'Operador Manual' : 'Protección'}
          </div>
        </div>
      </div>

      {/* 6. Tiempo Estimado hasta Umbral de Apagado */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs">
          <span className="font-medium">Tiempo a Umbral ({offThresholdPct}%)</span>
          <Clock className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-2">
          {estimatedTimeToOffMinutes !== null ? (
            <>
              <div className="text-2xl font-bold font-mono text-cyan-400 tracking-tight">
                {formatNumber(estimatedTimeToOffMinutes, 1)}{' '}
                <span className="text-sm font-sans text-slate-400">min</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Caudal constante
              </div>
            </>
          ) : (
            <>
              <div className="text-xs font-medium text-amber-400/90 leading-tight">
                No alcanzable
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {pumpState === 'OFF' ? 'Bomba apagada' : netFlow <= 0 ? 'Caudal neto &le; 0' : 'Meta superada'}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
