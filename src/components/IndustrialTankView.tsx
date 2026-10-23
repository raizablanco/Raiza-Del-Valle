import { SimulationParams, SimulationState, AutomatedSequenceStatus } from '../types/simulation';
import { formatNumber } from '../utils/formatters';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

interface IndustrialTankViewProps {
  params: SimulationParams;
  state: SimulationState;
  sequenceStatus?: AutomatedSequenceStatus;
}

export const IndustrialTankView: React.FC<IndustrialTankViewProps> = ({ params, state, sequenceStatus }) => {
  const { volume, levelPct, effectiveInletFlow, effectiveOutletFlow, pumpState, alarms, controlMode } = state;
  const { capacity, onThresholdPct, offThresholdPct, lowAlarmPct, highAlarmPct } = params;

  // Clamped percentage for visual rendering (0% to 100%)
  const visualPct = Math.max(0, Math.min(100, levelPct));

  // Tank SVG coordinates
  // Tank body coordinates: x=170, y=70, width=220, height=310
  const tankX = 170;
  const tankY = 70;
  const tankWidth = 220;
  const tankHeight = 310;

  // Water level calculation: from bottom (tankY + tankHeight) upwards
  const waterHeight = (visualPct / 100) * tankHeight;
  const waterY = tankY + tankHeight - waterHeight;

  // Threshold Y positions in SVG space
  const getYForPct = (pct: number) => tankY + tankHeight - (pct / 100) * tankHeight;

  const yHighAlarm = getYForPct(highAlarmPct);
  const yOffThreshold = getYForPct(offThresholdPct);
  const yOnThreshold = getYForPct(onThresholdPct);
  const yLowAlarm = getYForPct(lowAlarmPct);

  // Liquid color based on alarm status
  let liquidGradientId = 'liquidNormal';
  let surfaceColor = '#38bdf8'; // sky-400
  if (alarms.highLevel || alarms.overflowProtection) {
    liquidGradientId = 'liquidHighAlarm';
    surfaceColor = '#f87171'; // red-400
  } else if (alarms.lowLevel || alarms.cavitationProtection) {
    liquidGradientId = 'liquidLowAlarm';
    surfaceColor = '#fb923c'; // orange-400
  }

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-2xl">
      {/* SCADA Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs uppercase tracking-wider text-slate-400">UNIDAD DE PROCESO:</span>
          <span className="font-bold text-slate-100 text-sm tracking-wide">TK-101 · ESTANQUE PULMÓN</span>
        </div>

        {/* Status badges with text + icon */}
        <div className="flex flex-wrap items-center gap-2">
          {sequenceStatus?.isActive && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50 animate-pulse">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              ENSAYO ETAPA {sequenceStatus.stageNumber}: {sequenceStatus.targetVolume.toFixed(0)} L
            </span>
          )}
          {alarms.overflowProtection && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-red-950/80 text-red-300 border border-red-700/60">
              <ShieldAlert className="w-3.5 h-3.5" /> SOBRELLENADO PREVENIDO
            </span>
          )}
          {alarms.cavitationProtection && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-amber-950/80 text-amber-300 border border-amber-700/60">
              <ShieldAlert className="w-3.5 h-3.5" /> ESTANQUE VACÍO (0 L)
            </span>
          )}
          {alarms.highLevel && !alarms.overflowProtection && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-red-950/70 text-red-400 border border-red-800/50">
              <AlertTriangle className="w-3.5 h-3.5" /> ALARMA: NIVEL ALTO (&ge;{highAlarmPct}%)
            </span>
          )}
          {alarms.lowLevel && !alarms.cavitationProtection && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-orange-950/70 text-orange-400 border border-orange-800/50">
              <AlertTriangle className="w-3.5 h-3.5" /> ALARMA: NIVEL BAJO (&le;{lowAlarmPct}%)
            </span>
          )}
          {!alarms.highLevel && !alarms.lowLevel && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
              <CheckCircle2 className="w-3.5 h-3.5" /> ESTADO NOMINAL
            </span>
          )}
        </div>
      </div>

      {/* Main SVG Schematic */}
      <div className="w-full flex justify-center items-center py-2 overflow-x-auto">
        <svg
          viewBox="0 0 560 420"
          className="w-full max-w-[620px] h-auto select-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="tankBodyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1e293b" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#0f172a" stopOpacity="0.7" />
              <stop offset="70%" stopColor="#0f172a" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#1e293b" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="pipeMetal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#64748b" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#475569" />
            </linearGradient>

            <linearGradient id="liquidNormal" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0369a1" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="liquidHighAlarm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#dc2626" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="liquidLowAlarm" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ea580c" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#c2410c" stopOpacity="0.95" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Grid Pattern for industrial blueprint feel */}
          <g opacity="0.08" stroke="#94a3b8" strokeWidth="0.5">
            <line x1="0" y1="50" x2="560" y2="50" />
            <line x1="0" y1="100" x2="560" y2="100" />
            <line x1="0" y1="150" x2="560" y2="150" />
            <line x1="0" y1="200" x2="560" y2="200" />
            <line x1="0" y1="250" x2="560" y2="250" />
            <line x1="0" y1="300" x2="560" y2="300" />
            <line x1="0" y1="350" x2="560" y2="350" />
            <line x1="0" y1="400" x2="560" y2="400" />
            <line x1="70" y1="0" x2="70" y2="420" />
            <line x1="170" y1="0" x2="170" y2="420" />
            <line x1="270" y1="0" x2="270" y2="420" />
            <line x1="390" y1="0" x2="390" y2="420" />
            <line x1="490" y1="0" x2="490" y2="420" />
          </g>

          {/* ================= INLET PIPING & PUMP P-101 ================= */}
          {/* Inlet Pipe outer steel line */}
          <path
            d="M 10 110 L 80 110 L 80 110 L 170 110"
            fill="none"
            stroke="url(#pipeMetal)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Fluid flow inside inlet pipe */}
          {effectiveInletFlow > 0 && (
            <path
              d="M 10 110 L 170 110"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="6"
              className="animate-pipe-flow-in"
            />
          )}

          {/* Centrifugal Pump P-101 Symbol */}
          <g transform="translate(95, 110)">
            {/* Pump base casing */}
            <circle
              cx="0"
              cy="0"
              r="22"
              fill={pumpState === 'ON' ? '#042f2e' : '#1e293b'}
              stroke={pumpState === 'ON' ? '#14b8a6' : '#64748b'}
              strokeWidth="3"
            />
            {/* Impeller triangle discharge */}
            <polygon
              points="0,-22 22,0 0,0"
              fill={pumpState === 'ON' ? '#0d9488' : '#334155'}
            />
            {/* Rotating impeller blades */}
            <g className={pumpState === 'ON' ? 'animate-spin-pump' : ''}>
              <line x1="-12" y1="0" x2="12" y2="0" stroke={pumpState === 'ON' ? '#5eead4' : '#94a3b8'} strokeWidth="2.5" />
              <line x1="0" y1="-12" x2="0" y2="12" stroke={pumpState === 'ON' ? '#5eead4' : '#94a3b8'} strokeWidth="2.5" />
              <circle cx="0" cy="0" r="4" fill={pumpState === 'ON' ? '#5eead4' : '#94a3b8'} />
            </g>
          </g>

          {/* Pump Label & Tag */}
          <g transform="translate(95, 60)">
            <rect
              x="-48"
              y="-12"
              width="96"
              height="24"
              rx="4"
              fill="#090d16"
              stroke={pumpState === 'ON' ? '#14b8a6' : '#475569'}
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              className="font-mono text-xs font-bold"
              fill={pumpState === 'ON' ? '#5eead4' : '#94a3b8'}
            >
              P-101: {pumpState === 'ON' ? 'ENCENDIDA' : 'APAGADA'}
            </text>
          </g>

          {/* Inlet Flow Meter Indicator Tag */}
          <g transform="translate(70, 150)">
            <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#0b1329" stroke="#0284c7" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" className="font-mono text-xs font-semibold" fill="#7dd3fc">
              Qin: {formatNumber(effectiveInletFlow, 1)} L/min
            </text>
          </g>

          {/* ================= TANK STRUCTURE (TK-101) ================= */}
          {/* Tank Main Body Casing */}
          <rect
            x={tankX}
            y={tankY}
            width={tankWidth}
            height={tankHeight}
            rx="14"
            fill="url(#tankBodyGradient)"
            stroke="#475569"
            strokeWidth="3.5"
          />

          {/* Top Tank Dome / Cover */}
          <path
            d={`M ${tankX} ${tankY + 14} Q ${tankX + tankWidth / 2} ${tankY - 14} ${tankX + tankWidth} ${tankY + 14}`}
            fill="none"
            stroke="#64748b"
            strokeWidth="3"
          />

          {/* Liquid Mass in Tank (Clipped to Tank bounds) */}
          {waterHeight > 0 && (
            <g>
              <clipPath id="tankLiquidClip">
                <rect
                  x={tankX + 3}
                  y={tankY + 3}
                  width={tankWidth - 6}
                  height={tankHeight - 6}
                  rx="11"
                />
              </clipPath>

              {/* Water Column */}
              <rect
                x={tankX + 3}
                y={waterY}
                width={tankWidth - 6}
                height={waterHeight}
                fill={`url(#${liquidGradientId})`}
                clipPath="url(#tankLiquidClip)"
              />

              {/* Meniscus / Animated Water Surface */}
              <line
                x1={tankX + 4}
                y1={waterY}
                x2={tankX + tankWidth - 4}
                y2={waterY}
                stroke={surfaceColor}
                strokeWidth="3"
                clipPath="url(#tankLiquidClip)"
              />
            </g>
          )}

          {/* Inlet Pouring Fluid Jet when effectiveInletFlow > 0 */}
          {effectiveInletFlow > 0 && waterY > tankY + 35 && (
            <line
              x1={tankX + 18}
              y1={110}
              x2={tankX + 18}
              y2={Math.min(tankY + tankHeight - 8, waterY)}
              stroke="#38bdf8"
              strokeWidth="4"
              strokeDasharray="4 4"
              className="animate-pipe-flow-in"
              opacity="0.85"
            />
          )}

          {/* Level Transmitter LT-101 on Top Dome */}
          <g transform={`translate(${tankX + tankWidth / 2}, ${tankY - 26})`}>
            {/* Transmitter body */}
            <circle cx="0" cy="0" r="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <text x="0" y="3" textAnchor="middle" className="font-mono text-[9px] font-bold" fill="#38bdf8">
              LT-101
            </text>
            {/* Probe line */}
            <line x1="0" y1="14" x2="0" y2="28" stroke="#94a3b8" strokeWidth="2" />
          </g>

          {/* ================= THRESHOLD LINES & SETPOINTS ================= */}
          {/* 1. Alarma Alto (90%) */}
          <g>
            <line
              x1={tankX}
              y1={yHighAlarm}
              x2={tankX + tankWidth}
              y2={yHighAlarm}
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.9"
            />
            {/* Right Tag */}
            <rect x={tankX + tankWidth + 6} y={yHighAlarm - 9} width="96" height="18" rx="3" fill="#450a0a" stroke="#dc2626" strokeWidth="1" />
            <text x={tankX + tankWidth + 12} y={yHighAlarm + 4} className="font-mono text-[10px] font-bold" fill="#fca5a5">
              ALTO: {highAlarmPct}% ({((capacity * highAlarmPct) / 100).toFixed(0)} L)
            </text>
          </g>

          {/* 2. Umbral Apagado / OFF (80%) */}
          <g>
            <line
              x1={tankX}
              y1={yOffThreshold}
              x2={tankX + tankWidth}
              y2={yOffThreshold}
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />
            {/* Right Tag */}
            <rect x={tankX + tankWidth + 6} y={yOffThreshold - 9} width="112" height="18" rx="3" fill="#083344" stroke="#0891b2" strokeWidth="1" />
            <text x={tankX + tankWidth + 12} y={yOffThreshold + 4} className="font-mono text-[10px] font-bold" fill="#67e8f9">
              OFF (AUTO): {offThresholdPct}% ({((capacity * offThresholdPct) / 100).toFixed(0)} L)
            </text>
          </g>

          {/* 3. Umbral Encendido / ON (30%) */}
          <g>
            <line
              x1={tankX}
              y1={yOnThreshold}
              x2={tankX + tankWidth}
              y2={yOnThreshold}
              stroke="#10b981"
              strokeWidth="2.5"
              strokeDasharray="6 3"
            />
            {/* Right Tag */}
            <rect x={tankX + tankWidth + 6} y={yOnThreshold - 9} width="112" height="18" rx="3" fill="#064e3b" stroke="#059669" strokeWidth="1" />
            <text x={tankX + tankWidth + 12} y={yOnThreshold + 4} className="font-mono text-[10px] font-bold" fill="#6ee7b7">
              ON (AUTO): {onThresholdPct}% ({((capacity * onThresholdPct) / 100).toFixed(0)} L)
            </text>
          </g>

          {/* 4. Alarma Bajo (20%) */}
          <g>
            <line
              x1={tankX}
              y1={yLowAlarm}
              x2={tankX + tankWidth}
              y2={yLowAlarm}
              stroke="#f97316"
              strokeWidth="2"
              strokeDasharray="4 3"
              opacity="0.9"
            />
            {/* Right Tag */}
            <rect x={tankX + tankWidth + 6} y={yLowAlarm - 9} width="96" height="18" rx="3" fill="#431407" stroke="#ea580c" strokeWidth="1" />
            <text x={tankX + tankWidth + 12} y={yLowAlarm + 4} className="font-mono text-[10px] font-bold" fill="#fdba74">
              BAJO: {lowAlarmPct}% ({((capacity * lowAlarmPct) / 100).toFixed(0)} L)
            </text>
          </g>

          {/* Graduation Scale on Left Wall (0%, 25%, 50%, 75%, 100%) */}
          {[0, 25, 50, 75, 100].map((tickPct) => {
            const yTick = getYForPct(tickPct);
            return (
              <g key={tickPct}>
                <line x1={tankX - 8} y1={yTick} x2={tankX} y2={yTick} stroke="#94a3b8" strokeWidth="1.5" />
                <text
                  x={tankX - 12}
                  y={yTick + 4}
                  textAnchor="end"
                  className="font-mono text-[10px] font-medium"
                  fill="#94a3b8"
                >
                  {tickPct}%
                </text>
              </g>
            );
          })}

          {/* ================= OUTLET PIPING & VALVE ================= */}
          {/* Outlet Pipe from Bottom Right */}
          <path
            d={`M ${tankX + tankWidth - 40} ${tankY + tankHeight} L ${tankX + tankWidth - 40} 360 L 510 360`}
            fill="none"
            stroke="url(#pipeMetal)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Animated Outlet Fluid */}
          {effectiveOutletFlow > 0 && (
            <path
              d={`M ${tankX + tankWidth - 40} ${tankY + tankHeight} L ${tankX + tankWidth - 40} 360 L 510 360`}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="6"
              className="animate-pipe-flow-out"
            />
          )}

          {/* Outlet Control Valve FCV-102 Symbol */}
          <g transform="translate(420, 360)">
            {/* Valve hour-glass symbol */}
            <polygon
              points="-12,-10 12,10 12,-10 -12,10"
              fill={effectiveOutletFlow > 0 ? '#0284c7' : '#334155'}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />
            {/* Actuator stem */}
            <line x1="0" y1="0" x2="0" y2="-12" stroke="#94a3b8" strokeWidth="2" />
            <rect x="-8" y="-18" width="16" height="6" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
          </g>

          {/* Outlet Valve Tag */}
          <g transform="translate(420, 396)">
            <rect x="-42" y="-10" width="84" height="20" rx="3" fill="#090d16" stroke="#475569" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" className="font-mono text-[10px] font-bold" fill="#94a3b8">
              FCV-102: CONSUMO
            </text>
          </g>

          {/* Outlet Flow Meter Tag */}
          <g transform="translate(490, 325)">
            <rect x="-45" y="-12" width="90" height="24" rx="4" fill="#0b1329" stroke="#0284c7" strokeWidth="1" />
            <text x="0" y="4" textAnchor="middle" className="font-mono text-xs font-semibold" fill="#7dd3fc">
              Qout: {formatNumber(effectiveOutletFlow, 1)} L/min
            </text>
          </g>

          {/* Digital Readout Center Overlay (Floating strictly inside upper dry region or header) */}
          <g transform={`translate(${tankX + tankWidth / 2}, ${tankY + 45})`}>
            <rect
              x="-65"
              y="-18"
              width="130"
              height="36"
              rx="6"
              fill="#020617"
              fillOpacity="0.88"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="-2"
              textAnchor="middle"
              className="font-mono text-sm font-extrabold tracking-wider"
              fill="#f8fafc"
            >
              {formatNumber(levelPct, 1)} %
            </text>
            <text
              x="0"
              y="12"
              textAnchor="middle"
              className="font-mono text-[11px] font-semibold"
              fill="#94a3b8"
            >
              {formatNumber(volume, 1)} / {capacity} L
            </text>
          </g>
        </svg>
      </div>

      {/* Legend & Physical Notice */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-red-500 inline-block"></span>
          <span className="text-slate-400">Alarma Alto: &ge;{highAlarmPct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
          <span className="text-slate-400">Umbral OFF: {offThresholdPct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-emerald-400 inline-block"></span>
          <span className="text-slate-400">Umbral ON: {onThresholdPct}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-orange-400 inline-block"></span>
          <span className="text-slate-400">Alarma Bajo: &le;{lowAlarmPct}%</span>
        </div>
      </div>
    </div>
  );
};
