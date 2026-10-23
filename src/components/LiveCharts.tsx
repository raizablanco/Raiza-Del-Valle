import { HistoryPoint, SimulationParams, AutomatedSequenceStatus } from '../types/simulation';
import { formatNumber } from '../utils/formatters';
import { TrendingUp, BarChart2, Target } from 'lucide-react';

interface LiveChartsProps {
  history: HistoryPoint[];
  params: SimulationParams;
  currentLevelPct: number;
  currentInletFlow: number;
  currentOutletFlow: number;
  sequenceStatus?: AutomatedSequenceStatus;
}

export const LiveCharts: React.FC<LiveChartsProps> = ({
  history,
  params,
  currentLevelPct,
  currentInletFlow,
  currentOutletFlow,
  sequenceStatus
}) => {
  const { onThresholdPct, offThresholdPct, lowAlarmPct, highAlarmPct } = params;

  // Chart Dimensions
  const width = 640;
  const height = 200;
  const padding = { top: 20, right: 30, bottom: 26, left: 45 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Sample or slice history to fit chart nicely (e.g. last 120 points)
  const chartPoints = history.length > 120 ? history.slice(-120) : history;
  const pointCount = chartPoints.length;

  const minTime = pointCount > 0 ? chartPoints[0].timeSeconds : 0;
  const maxTime = pointCount > 0 ? chartPoints[pointCount - 1].timeSeconds : 60;
  const timeSpan = Math.max(maxTime - minTime, 10);

  // Helper coordinate mappers for Level Chart (Y: 0 to 100%)
  const getX = (t: number) => padding.left + ((t - minTime) / timeSpan) * plotWidth;
  const getYLevel = (lvl: number) => padding.top + plotHeight - (Math.max(0, Math.min(100, lvl)) / 100) * plotHeight;

  // Generate SVG path for Level
  let levelPathD = '';
  if (chartPoints.length > 0) {
    levelPathD = chartPoints.reduce((acc, pt, i) => {
      const x = getX(pt.timeSeconds);
      const y = getYLevel(pt.levelPct);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }

  // Threshold Y positions in Level Chart
  const yHighAlarm = getYLevel(highAlarmPct);
  const yOffThreshold = getYLevel(offThresholdPct);
  const yOnThreshold = getYLevel(onThresholdPct);
  const yLowAlarm = getYLevel(lowAlarmPct);

  // Helper coordinate mappers for Flow Chart (Y: 0 to maxFlow)
  const maxFlowVal = Math.max(
    params.inletFlowNominal * 1.3,
    params.outletFlowNominal * 1.3,
    60
  );
  const getYFlow = (q: number) => padding.top + plotHeight - (Math.max(0, Math.min(maxFlowVal, q)) / maxFlowVal) * plotHeight;

  let inletFlowPathD = '';
  let outletFlowPathD = '';
  if (chartPoints.length > 0) {
    inletFlowPathD = chartPoints.reduce((acc, pt, i) => {
      const x = getX(pt.timeSeconds);
      const y = getYFlow(pt.effectiveInletFlow);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');

    outletFlowPathD = chartPoints.reduce((acc, pt, i) => {
      const x = getX(pt.timeSeconds);
      const y = getYFlow(pt.effectiveOutletFlow);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. CHART: Nivel de Estanque vs Tiempo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Tendencia de Nivel (%) vs Tiempo Simulado
            </h4>
          </div>
          <div className="font-mono text-xs font-bold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            Nivel: {formatNumber(currentLevelPct, 1)}%
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
            {/* Horizontal Grid lines (0, 20, 30, 80, 90, 100) */}
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3">
              {[0, 25, 50, 75, 100].map((val) => (
                <line
                  key={val}
                  x1={padding.left}
                  y1={getYLevel(val)}
                  x2={width - padding.right}
                  y2={getYLevel(val)}
                />
              ))}
            </g>

            {/* Threshold Reference Lines */}
            {/* Alarma Alto (90%) */}
            <line
              x1={padding.left}
              y1={yHighAlarm}
              x2={width - padding.right}
              y2={yHighAlarm}
              stroke="#ef4444"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={width - padding.right + 4} y={yHighAlarm + 3} fill="#ef4444" fontSize="9" fontWeight="bold">
              {highAlarmPct}%
            </text>

            {/* Umbral Apagado (80%) */}
            <line
              x1={padding.left}
              y1={yOffThreshold}
              x2={width - padding.right}
              y2={yOffThreshold}
              stroke="#06b6d4"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={width - padding.right + 4} y={yOffThreshold + 3} fill="#06b6d4" fontSize="9" fontWeight="bold">
              {offThresholdPct}%
            </text>

            {/* Umbral Encendido (30%) */}
            <line
              x1={padding.left}
              y1={yOnThreshold}
              x2={width - padding.right}
              y2={yOnThreshold}
              stroke="#10b981"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={width - padding.right + 4} y={yOnThreshold + 3} fill="#10b981" fontSize="9" fontWeight="bold">
              {onThresholdPct}%
            </text>

            {/* Alarma Bajo (20%) */}
            <line
              x1={padding.left}
              y1={yLowAlarm}
              x2={width - padding.right}
              y2={yLowAlarm}
              stroke="#f97316"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text x={width - padding.right + 4} y={yLowAlarm + 3} fill="#f97316" fontSize="9" fontWeight="bold">
              {lowAlarmPct}%
            </text>

            {/* Referencia 25% de consigna */}
            <line
              x1={padding.left}
              y1={getYLevel(25)}
              x2={width - padding.right}
              y2={getYLevel(25)}
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="2 3"
              opacity="0.7"
            />

            {/* Active Sequence Target Line */}
            {sequenceStatus?.isActive && (
              <g>
                <line
                  x1={padding.left}
                  y1={getYLevel(sequenceStatus.targetPct)}
                  x2={width - padding.right}
                  y2={getYLevel(sequenceStatus.targetPct)}
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="6 2"
                />
                <rect
                  x={padding.left + 8}
                  y={getYLevel(sequenceStatus.targetPct) - 14}
                  width="130"
                  height="13"
                  rx="2"
                  fill="#0369a1"
                  fillOpacity="0.8"
                />
                <text
                  x={padding.left + 12}
                  y={getYLevel(sequenceStatus.targetPct) - 4}
                  fill="#ffffff"
                  fontSize="8"
                  fontWeight="bold"
                >
                  OBJETIVO ETAPA: {sequenceStatus.targetVolume.toFixed(0)} L ({sequenceStatus.targetPct.toFixed(0)}%)
                </text>
              </g>
            )}

            {/* Y Axis Labels */}
            {[0, 25, 50, 75, 100].map((val) => (
              <text
                key={val}
                x={padding.left - 8}
                y={getYLevel(val) + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
              >
                {val}%
              </text>
            ))}

            {/* Level Curve */}
            {levelPathD && (
              <path
                d={levelPathD}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Current Point Dot */}
            {chartPoints.length > 0 && (
              <circle
                cx={getX(chartPoints[chartPoints.length - 1].timeSeconds)}
                cy={getYLevel(chartPoints[chartPoints.length - 1].levelPct)}
                r="4"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="1.5"
              />
            )}

            {/* X Axis Baseline */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={width - padding.right}
              y2={padding.top + plotHeight}
              stroke="#64748b"
              strokeWidth="1"
            />

            {/* Time labels on X Axis */}
            <text x={padding.left} y={height - 6} fill="#64748b" fontSize="9">
              {minTime.toFixed(0)}s
            </text>
            <text x={width - padding.right} y={height - 6} textAnchor="end" fill="#64748b" fontSize="9">
              {maxTime.toFixed(0)}s
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-sky-400 inline-block"></span>
            <span>Nivel Real</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-red-400">● Alarma Alto ({highAlarmPct}%)</span>
            <span className="text-cyan-400">● Umbral OFF ({offThresholdPct}%)</span>
            <span className="text-emerald-400">● Umbral ON ({onThresholdPct}%)</span>
            <span className="text-orange-400">● Alarma Bajo ({lowAlarmPct}%)</span>
          </div>
        </div>
      </div>

      {/* 2. CHART: Caudales Efectivos vs Tiempo */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-100">
              Caudales Efectivos (L/min) vs Tiempo Simulado
            </h4>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/50">
              Qin: {formatNumber(currentInletFlow, 1)} L/min
            </span>
            <span className="text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
              Qout: {formatNumber(currentOutletFlow, 1)} L/min
            </span>
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none font-mono">
            {/* Grid lines */}
            <g stroke="#334155" strokeWidth="0.5" strokeDasharray="2 3">
              {[0, Math.round(maxFlowVal / 2), Math.round(maxFlowVal)].map((val) => (
                <line
                  key={val}
                  x1={padding.left}
                  y1={getYFlow(val)}
                  x2={width - padding.right}
                  y2={getYFlow(val)}
                />
              ))}
            </g>

            {/* Y Axis Labels */}
            {[0, Math.round(maxFlowVal / 2), Math.round(maxFlowVal)].map((val) => (
              <text
                key={val}
                x={padding.left - 8}
                y={getYFlow(val) + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="9"
              >
                {val}
              </text>
            ))}

            {/* Inlet Flow Curve (Qin - Sky) */}
            {inletFlowPathD && (
              <path
                d={inletFlowPathD}
                fill="none"
                stroke="#0284c7"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Outlet Flow Curve (Qout - Indigo) */}
            {outletFlowPathD && (
              <path
                d={outletFlowPathD}
                fill="none"
                stroke="#818cf8"
                strokeWidth="2"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* X Axis Baseline */}
            <line
              x1={padding.left}
              y1={padding.top + plotHeight}
              x2={width - padding.right}
              y2={padding.top + plotHeight}
              stroke="#64748b"
              strokeWidth="1"
            />

            {/* Time labels on X Axis */}
            <text x={padding.left} y={height - 6} fill="#64748b" fontSize="9">
              {minTime.toFixed(0)}s
            </text>
            <text x={width - padding.right} y={height - 6} textAnchor="end" fill="#64748b" fontSize="9">
              {maxTime.toFixed(0)}s
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-sky-500 inline-block"></span>
              <span className="text-sky-300 font-medium">Qin (Entrada efectiva)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-indigo-400 inline-block border-b border-dashed"></span>
              <span className="text-indigo-300 font-medium">Qout (Consumo efectivo)</span>
            </div>
          </div>
          <span className="text-slate-500 text-[10px]">Unidades en Litros por minuto</span>
        </div>
      </div>
    </div>
  );
};
