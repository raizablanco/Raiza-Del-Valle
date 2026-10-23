import { ControlMode, PumpState, SimulationParams, SimulationState, AutomatedSequenceStatus } from '../types/simulation';
import { formatSimulatedTime } from '../utils/formatters';
import { Play, Pause, RotateCcw, Power, FastForward, Sliders, Info, Sparkles } from 'lucide-react';

interface ControlDeckProps {
  params: SimulationParams;
  state: SimulationState;
  controlMode: ControlMode;
  isRunning: boolean;
  speedMultiplier: number;
  sequenceStatus?: AutomatedSequenceStatus;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSetMode: (mode: ControlMode) => void;
  onManualSetPump: (pump: PumpState) => void;
  onChangeSpeed: (speed: number) => void;
  onOpenParams: () => void;
  onStartSequence?: () => void;
  onStopSequence?: () => void;
}

export const ControlDeck: React.FC<ControlDeckProps> = ({
  params,
  state,
  controlMode,
  isRunning,
  speedMultiplier,
  sequenceStatus,
  onStart,
  onPause,
  onReset,
  onSetMode,
  onManualSetPump,
  onChangeSpeed,
  onOpenParams,
  onStartSequence,
  onStopSequence
}) => {
  const { onThresholdPct, offThresholdPct } = params;
  const { pumpState, timeSeconds } = state;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-4">
      {/* Simulation Playback & Clock */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        {/* Clock & Status */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">TIEMPO SIMULADO:</span>
            <span className="font-mono text-lg font-bold text-cyan-400 tabular-nums">
              {formatSimulatedTime(timeSeconds)}
            </span>
          </div>

          <span
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
              isRunning
                ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60'
                : 'bg-amber-950/70 text-amber-300 border-amber-800/60'
            }`}
          >
            {isRunning ? 'EN EJECUCIÓN' : 'PAUSADO'}
          </span>

          {sequenceStatus?.isActive && (
            <span className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-cyan-950 text-cyan-300 border border-cyan-500/50">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              ENSAYO ETAPA {sequenceStatus.stageNumber}
            </span>
          )}
        </div>

        {/* Play/Pause/Reset Primary Actions */}
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-xs shadow-md transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Iniciar Simulación</span>
            </button>
          ) : (
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-xs shadow-md transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pausar Simulación</span>
            </button>
          )}

          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition-colors cursor-pointer"
            title="Reiniciar a condiciones iniciales y limpiar registros"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>

          <button
            onClick={onOpenParams}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition-colors cursor-pointer"
            title="Modificar parámetros de proceso"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Parámetros</span>
          </button>
        </div>

        {/* Speed Multiplier Segmented Control */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 border border-slate-800 rounded-lg">
          <span className="text-[11px] text-slate-400 px-2 font-mono flex items-center gap-1">
            <FastForward className="w-3 h-3 text-slate-500" />
            VEL:
          </span>
          {[1, 5, 10].map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors cursor-pointer ${
                speedMultiplier === spd
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {spd}×
            </button>
          ))}
        </div>
      </div>

      {/* Control Modes & Actuator Overrides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: Mode Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Modo de Control Operacional
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => onSetMode('AUTO')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                controlMode === 'AUTO'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modo Automático
            </button>
            <button
              onClick={() => onSetMode('MANUAL')}
              className={`px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                controlMode === 'MANUAL'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Modo Manual
            </button>
          </div>
        </div>

        {/* Right: Manual Actuation Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Accionamiento Manual de Bomba P-101
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onManualSetPump('ON')}
              disabled={controlMode !== 'MANUAL' || pumpState === 'ON'}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                controlMode !== 'MANUAL'
                  ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                  : pumpState === 'ON'
                  ? 'bg-emerald-950 text-emerald-400 border-emerald-800/80 cursor-default font-bold'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 cursor-pointer shadow-md'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Encender Bomba</span>
            </button>

            <button
              onClick={() => onManualSetPump('OFF')}
              disabled={controlMode !== 'MANUAL' || pumpState === 'OFF'}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                controlMode !== 'MANUAL'
                  ? 'bg-slate-950 text-slate-600 border-slate-800 cursor-not-allowed opacity-60'
                  : pumpState === 'OFF'
                  ? 'bg-slate-800 text-slate-400 border-slate-700 cursor-default font-bold'
                  : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 cursor-pointer shadow-md'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>Apagar Bomba</span>
            </button>
          </div>
        </div>
      </div>

      {/* Educational Note about Hysteresis */}
      <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-cyan-300">Concepto clave (Histéresis / Banda Muerta): </span>
          En modo automático, la bomba enciende al caer a &le; <span className="font-mono text-emerald-400 font-bold">{onThresholdPct}%</span> y
          apaga al subir a &ge; <span className="font-mono text-cyan-400 font-bold">{offThresholdPct}%</span>. Entre ambos umbrales, el sistema retiene el estado anterior.
          Esta separación previene conmutaciones o chattering destructivo en los contactores mecánicos del motor.
        </div>
      </div>
    </div>
  );
};
