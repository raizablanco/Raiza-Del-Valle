import React, { useState } from 'react';
import {
  AutomatedSequenceConfig,
  AutomatedSequenceStatus,
  SimulationParams,
  SimulationState
} from '../types/simulation';
import { formatNumber, formatSimulatedTime } from '../utils/formatters';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  Sliders,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  XCircle,
  FastForward
} from 'lucide-react';

interface SequencePanelProps {
  sequenceStatus: AutomatedSequenceStatus;
  sequenceConfig: AutomatedSequenceConfig;
  isRunning: boolean;
  speedMultiplier: number;
  params: SimulationParams;
  state: SimulationState;
  onStartSequence: (config?: Partial<AutomatedSequenceConfig>) => void;
  onStopSequence: () => void;
  onPause: () => void;
  onResume: () => void;
  onChangeSpeed: (speed: number) => void;
  onUpdateConfig: (config: Partial<AutomatedSequenceConfig>) => void;
}

export const SequencePanel: React.FC<SequencePanelProps> = ({
  sequenceStatus,
  sequenceConfig,
  isRunning,
  speedMultiplier,
  params,
  state,
  onStartSequence,
  onStopSequence,
  onPause,
  onResume,
  onChangeSpeed,
  onUpdateConfig
}) => {
  const [showConfig, setShowConfig] = useState(false);
  const [formConfig, setFormConfig] = useState(sequenceConfig);

  const {
    isActive,
    stage,
    stageNumber,
    stageTitle,
    stageDescription,
    targetVolume,
    targetPct,
    stageRemainingSeconds,
    progressPct,
    isHolding
  } = sequenceStatus;

  const currentVolume = state.volume;
  const currentPct = state.levelPct;
  const simTime = state.timeSeconds;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formConfig);
    setShowConfig(false);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/40 border-2 border-cyan-500/40 rounded-xl p-5 shadow-2xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm sm:text-base text-slate-100 tracking-tight">
                Secuencia Programada: 800 L → 3 min (300 L) → 1 min (&lt;25%)
              </h3>
              <span className="text-[10px] uppercase font-bold font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Ensayo Automatizado
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ejecución automática en 3 etapas según la consigna solicitada, monitoreando histéresis y alarmas.
            </p>
          </div>
        </div>

        {/* Global Controls & Speed Switcher */}
        <div className="flex items-center gap-2.5">
          {!isActive ? (
            <button
              onClick={() => onStartSequence()}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-sky-400 hover:from-cyan-400 hover:to-sky-300 text-slate-950 rounded-lg font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all transform hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Ejecutar Secuencia</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {isRunning ? (
                <button
                  onClick={onPause}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Pausar</span>
                </button>
              ) : (
                <button
                  onClick={onResume}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold text-xs shadow transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Reanudar</span>
                </button>
              )}

              <button
                onClick={() => onStartSequence()}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                title="Reiniciar secuencia desde el inicio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>

              <button
                onClick={onStopSequence}
                className="flex items-center gap-1.5 px-3 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 rounded-lg font-medium text-xs transition-colors cursor-pointer"
                title="Detener secuencia y volver a modo ordinario"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Detener</span>
              </button>
            </div>
          )}

          {/* Speed Multiplier Pill */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-[10px] font-mono text-slate-400 px-1.5 flex items-center gap-0.5">
              <FastForward className="w-3 h-3 text-cyan-400" />
            </span>
            {[1, 5, 10].map((spd) => (
              <button
                key={spd}
                onClick={() => onChangeSpeed(spd)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors cursor-pointer ${
                  speedMultiplier === spd
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}×
              </button>
            ))}
          </div>

          {/* Config Toggle */}
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-cyan-300 text-xs transition-colors cursor-pointer"
            title="Ajustar parámetros del ensayo"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showConfig ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 3-Stage Progress Timeline Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {/* STAGE 1 CARD */}
        <div
          className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
            stageNumber === 1
              ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
              : stageNumber > 1
              ? 'bg-slate-950/80 border-emerald-800/60 opacity-90'
              : 'bg-slate-950/40 border-slate-800/80 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Etapa 1
              </span>
              {stageNumber > 1 ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" /> Completado
                </span>
              ) : stageNumber === 1 ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-600 animate-pulse">
                  <Flame className="w-3 h-3 text-cyan-400" />
                  {isHolding ? 'En Espera (3:00 min)' : 'En Ejecución'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">Pendiente</span>
              )}
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-slate-100">
              Llenar a 800 Litros
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Bomba P-101 activa con caudal nominal de {sequenceConfig.stage1InletFlow} L/min hasta alcanzar el 80% del estanque.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Meta: 800 L (80%)</span>
              <span className="font-bold text-cyan-400">
                {stageNumber === 1
                  ? `${currentVolume.toFixed(0)} L / 800 L`
                  : stageNumber > 1
                  ? '800 L (Listo)'
                  : '0 L / 800 L'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  stageNumber > 1 ? 'bg-emerald-500 w-full' : 'bg-cyan-500'
                }`}
                style={{
                  width: stageNumber > 1 ? '100%' : `${Math.min(100, (currentVolume / 800) * 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* STAGE 2 CARD */}
        <div
          className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
            stageNumber === 2
              ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-500/20 shadow-lg'
              : stageNumber > 2
              ? 'bg-slate-950/80 border-emerald-800/60 opacity-90'
              : 'bg-slate-950/40 border-slate-800/80 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                Etapa 2
              </span>
              {stageNumber > 2 ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" /> Completado
                </span>
              ) : stageNumber === 2 ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-600 animate-pulse">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {isHolding ? 'Espera 1 min' : 'Drenando'}
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">
                  Se activa a 3:00 min
                </span>
              )}
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-slate-100">
              A los 3 min → Bajar a 300 L
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Bomba apagada. Drenaje controlado mediante válvula FCV-102 ({sequenceConfig.stage2OutletFlow} L/min) hasta 300 L (30%).
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Meta: 300 L (30%)</span>
              <span className="font-bold text-cyan-400">
                {stageNumber === 2
                  ? `${currentVolume.toFixed(0)} L → 300 L`
                  : stageNumber > 2
                  ? '300 L (Listo)'
                  : '300 L'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  stageNumber > 2
                    ? 'bg-emerald-500 w-full'
                    : stageNumber === 2
                    ? 'bg-amber-500'
                    : 'bg-slate-700 w-0'
                }`}
                style={{
                  width:
                    stageNumber > 2
                      ? '100%'
                      : stageNumber === 2
                      ? `${Math.min(100, Math.max(0, ((800 - currentVolume) / 500) * 100))}%`
                      : '0%'
                }}
              ></div>
            </div>
          </div>
        </div>

        {/* STAGE 3 CARD */}
        <div
          className={`rounded-xl p-4 border transition-all flex flex-col justify-between ${
            stageNumber === 3
              ? 'bg-orange-950/50 border-orange-400 ring-2 ring-orange-500/20 shadow-lg'
              : stageNumber === 4
              ? 'bg-slate-950/80 border-emerald-800/60 opacity-90'
              : 'bg-slate-950/40 border-slate-800/80 opacity-70'
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-orange-400">
                Etapa 3
              </span>
              {stageNumber === 4 ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                  <CheckCircle2 className="w-3 h-3" /> Éxito Final
                </span>
              ) : stageNumber === 3 ? (
                <span className="flex items-center gap-1 text-[11px] font-bold text-orange-300 bg-orange-950 px-2 py-0.5 rounded border border-orange-600 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-orange-400" />
                  Alarma &lt;25%
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 font-mono">
                  Tras 1 min en 300 L
                </span>
              )}
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-slate-100">
              Tras 1 min → Bajar a &lt; 25%
            </h4>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Drenaje a menos de 250 L (objetivo 200 L / 20%), comprobando el disparo de la alarma de nivel bajo.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-300 mb-1">
              <span>Meta: &lt; 25% (&le; 200 L)</span>
              <span className="font-bold text-orange-400">
                {stageNumber === 3
                  ? `${currentPct.toFixed(1)}% / 20%`
                  : stageNumber === 4
                  ? `${currentPct.toFixed(1)}% (&lt;25%)`
                  : '20% (<25%)'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  stageNumber === 4
                    ? 'bg-emerald-500 w-full'
                    : stageNumber === 3
                    ? 'bg-orange-500'
                    : 'bg-slate-700 w-0'
                }`}
                style={{
                  width:
                    stageNumber === 4
                      ? '100%'
                      : stageNumber === 3
                      ? `${Math.min(100, Math.max(0, ((300 - currentVolume) / 100) * 100))}%`
                      : '0%'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stage Status Banner */}
      {isActive && (
        <div className="mt-4 p-3 rounded-lg bg-slate-950/90 border border-cyan-500/30 flex flex-wrap items-center justify-between gap-3 relative z-10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="font-mono text-cyan-300 font-bold uppercase tracking-wider">
              {stageTitle}
            </span>
            <span className="text-slate-400 hidden sm:inline">|</span>
            <span className="text-slate-300">{stageDescription}</span>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
              <span>Tiempo Simulado: </span>
              <span className="text-cyan-400 font-bold">{formatSimulatedTime(simTime)}</span>
            </div>
            {stageRemainingSeconds !== null && stageRemainingSeconds > 0 && (
              <div className="bg-slate-900 px-2.5 py-1 rounded border border-slate-800 text-slate-300">
                <span>Tiempo Restante Etapa: </span>
                <span className="text-emerald-400 font-bold">{stageRemainingSeconds.toFixed(0)} s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapsible Parameter Customization Drawer */}
      {showConfig && (
        <form onSubmit={handleSaveConfig} className="mt-4 p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-3 relative z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 uppercase tracking-wide">
              Configuración de Consignas del Ensayo Programado
            </span>
            <span className="text-slate-400 text-[11px]">Modifica los umbrales o tiempos si lo deseas</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">1. Volumen Etapa 1 (L):</label>
              <input
                type="number"
                min="100"
                max="1000"
                value={formConfig.stage1TargetVolume}
                onChange={(e) => setFormConfig({ ...formConfig, stage1TargetVolume: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">2. Tiempo para Etapa 2 (segundos):</label>
              <input
                type="number"
                min="30"
                max="600"
                value={formConfig.stage2TriggerTimeSeconds}
                onChange={(e) => setFormConfig({ ...formConfig, stage2TriggerTimeSeconds: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">180s = 3 minutos</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">3. Volumen Etapa 2 (L):</label>
              <input
                type="number"
                min="50"
                max="800"
                value={formConfig.stage2TargetVolume}
                onChange={(e) => setFormConfig({ ...formConfig, stage2TargetVolume: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">4. Tiempo de Espera Etapa 3 (segundos):</label>
              <input
                type="number"
                min="10"
                max="300"
                value={formConfig.stage3DelaySeconds}
                onChange={(e) => setFormConfig({ ...formConfig, stage3DelaySeconds: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">60s = 1 minuto</span>
            </div>
            <div>
              <label className="block text-slate-400 mb-1">5. Volumen Etapa 3 (&lt;25%):</label>
              <input
                type="number"
                min="10"
                max="240"
                value={formConfig.stage3TargetVolume}
                onChange={(e) => setFormConfig({ ...formConfig, stage3TargetVolume: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-100 font-mono"
              />
              <span className="text-[10px] text-slate-500 font-mono">200 L = 20% (&lt;25%)</span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              Cerrar
            </button>
            <button
              type="submit"
              className="px-4 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded cursor-pointer"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
