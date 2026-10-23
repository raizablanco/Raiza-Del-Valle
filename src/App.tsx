/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { IndustrialTankView } from './components/IndustrialTankView';
import { KpiMetricsBar } from './components/KpiMetricsBar';
import { ControlDeck } from './components/ControlDeck';
import { ScenarioPresets } from './components/ScenarioPresets';
import { LiveCharts } from './components/LiveCharts';
import { DataExplanation } from './components/DataExplanation';
import { HistoryAndEvents } from './components/HistoryAndEvents';
import { ParametersModal } from './components/ParametersModal';
import { ProcessExplanationModal } from './components/ProcessExplanationModal';
import { SequencePanel } from './components/SequencePanel';
import {
  AlertTriangle,
  BookOpen,
  Sliders,
  Activity,
  Layers,
  Database,
  Info,
  Sparkles
} from 'lucide-react';

export default function App() {
  const {
    params,
    state,
    history,
    events,
    controlMode,
    isRunning,
    speedMultiplier,
    sequenceStatus,
    sequenceConfig,
    startSequence,
    stopSequence,
    updateSequenceConfig,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setMode,
    manualSetPump,
    changeSpeed,
    updateParameters,
    loadScenario
  } = useSimulation();

  const [isParamsOpen, setIsParamsOpen] = useState(false);
  const [isProcessExplanationOpen, setIsProcessExplanationOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Bar following design constitution */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-sky-400 flex items-center justify-center shadow-md shadow-cyan-500/20 text-slate-950 font-bold">
              <Activity className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap">
                Simulador de Monitoreo y Control de Estanque Industrial
              </h1>
              <span className="text-[11px] text-slate-400 block -mt-0.5">
                Ingeniería en Automatización y Control Industrial · Proceso TK-101
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-400">
            <a href="#sequence-program" className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Secuencia 800L→300L→&lt;25%
            </a>
            <a href="#scada-view" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Supervisión SCADA
            </a>
            <a href="#charts" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Curvas de Proceso
            </a>
            <a href="#diagnostics" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              ¿Qué significan los datos?
            </a>
            <a href="#history" className="hover:text-slate-100 transition-colors whitespace-nowrap shrink-0">
              Historial y Eventos
            </a>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsProcessExplanationOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-md cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Explicación del Proceso (5 Pasos)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mandatory Prominent Educational Notice */}
      <div className="bg-amber-950/70 border-b border-amber-600/40 px-4 py-2 text-center text-xs font-medium text-amber-200 flex items-center justify-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Simulación educativa con datos simulados.</strong> Sin conexión a equipos reales.
        </span>
        <span className="hidden sm:inline text-amber-400/80">
          (Cálculos analíticos en tiempo real mediante balance de masa y lógica de histéresis).
        </span>
      </div>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Key Process Indicators (KPI Bar) */}
        <section id="kpis">
          <KpiMetricsBar params={params} state={state} />
        </section>

        {/* Automated Sequence Engine requested by user */}
        <section id="sequence-program">
          <SequencePanel
            sequenceStatus={sequenceStatus}
            sequenceConfig={sequenceConfig}
            isRunning={isRunning}
            speedMultiplier={speedMultiplier}
            params={params}
            state={state}
            onStartSequence={startSequence}
            onStopSequence={stopSequence}
            onPause={pauseSimulation}
            onResume={startSimulation}
            onChangeSpeed={changeSpeed}
            onUpdateConfig={updateSequenceConfig}
          />
        </section>

        {/* Dual-Zone Sandbox: Left = SCADA Tank, Right = Control Deck & Presets */}
        <section id="scada-view" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Industrial Tank Graphic (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <IndustrialTankView
              params={params}
              state={state}
              sequenceStatus={sequenceStatus}
            />
          </div>

          {/* Right Column: Control Deck & Scenarios (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            <ControlDeck
              params={params}
              state={state}
              controlMode={controlMode}
              isRunning={isRunning}
              speedMultiplier={speedMultiplier}
              sequenceStatus={sequenceStatus}
              onStart={startSimulation}
              onPause={pauseSimulation}
              onReset={() => resetSimulation()}
              onSetMode={setMode}
              onManualSetPump={manualSetPump}
              onChangeSpeed={changeSpeed}
              onOpenParams={() => setIsParamsOpen(true)}
              onStartSequence={startSequence}
              onStopSequence={stopSequence}
            />

            <ScenarioPresets onSelectScenario={loadScenario} />
          </div>
        </section>

        {/* Real-Time Live Process Charts */}
        <section id="charts">
          <LiveCharts
            history={history}
            params={params}
            currentLevelPct={state.levelPct}
            currentInletFlow={state.effectiveInletFlow}
            currentOutletFlow={state.effectiveOutletFlow}
            sequenceStatus={sequenceStatus}
          />
        </section>

        {/* Dynamic Explanation Section: "¿Qué significan estos datos?" */}
        <section id="diagnostics">
          <DataExplanation
            params={params}
            state={state}
            sequenceStatus={sequenceStatus}
          />
        </section>

        {/* History and Events Log Table */}
        <section id="history">
          <HistoryAndEvents history={history} events={events} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-6 px-4 mt-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Ingeniería en Automatización y Control Industrial · Modelo de Estanque con Histéresis
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Fórmulas Deterministas</span>
            <span>·</span>
            <span>Sensor LT-101</span>
            <span>·</span>
            <span>Bomba P-101</span>
          </div>
        </div>
      </footer>

      {/* Parameter Adjustment Modal */}
      <ParametersModal
        isOpen={isParamsOpen}
        onClose={() => setIsParamsOpen(false)}
        params={params}
        isRunning={isRunning}
        onUpdateParams={updateParameters}
      />

      {/* Process 5-Steps Explanation Modal for Presentation */}
      <ProcessExplanationModal
        isOpen={isProcessExplanationOpen}
        onClose={() => setIsProcessExplanationOpen(false)}
      />
    </div>
  );
}
