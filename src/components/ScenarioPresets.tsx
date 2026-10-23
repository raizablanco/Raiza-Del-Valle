import React from 'react';
import { SCENARIOS } from '../constants/scenarios';
import { ScenarioPreset } from '../types/simulation';
import { Bookmark, Sparkles } from 'lucide-react';

interface ScenarioPresetsProps {
  onSelectScenario: (scenario: ScenarioPreset) => void;
}

export const ScenarioPresets: React.FC<ScenarioPresetsProps> = ({ onSelectScenario }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-cyan-400" />
          <h3 className="font-bold text-sm text-slate-100 tracking-wide uppercase">
            Escenarios de Demostración para Exposición
          </h3>
        </div>
        <span className="text-xs text-slate-400">
          Carga casos típicos para explicar el comportamiento del lazo de control
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            onClick={() => onSelectScenario(sc)}
            className={`flex flex-col text-left p-3.5 rounded-lg border transition-all group cursor-pointer ${
              sc.isSequence
                ? 'bg-gradient-to-b from-cyan-950/50 to-slate-950 border-cyan-500/60 shadow-md shadow-cyan-950/50 hover:border-cyan-400'
                : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-cyan-500/50'
            }`}
          >
            <div className="flex items-center justify-between gap-1 w-full mb-1.5">
              <span className={`font-semibold text-xs transition-colors ${
                sc.isSequence ? 'text-cyan-300 group-hover:text-cyan-200' : 'text-slate-200 group-hover:text-cyan-300'
              }`}>
                {sc.title}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                sc.isSequence ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
              }`}>
                {sc.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
              {sc.description}
            </p>
            <div className="mt-auto pt-2 flex items-center gap-1 text-[11px] font-medium text-cyan-400/80 group-hover:text-cyan-300">
              <Sparkles className="w-3 h-3" />
              <span>{sc.isSequence ? 'Ejecutar secuencia' : 'Cargar escenario'}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
