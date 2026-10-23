import React, { useState, useEffect } from 'react';
import { SimulationParams } from '../types/simulation';
import { X, Check, AlertCircle, Info, Lock } from 'lucide-react';

interface ParametersModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: SimulationParams;
  isRunning: boolean;
  onUpdateParams: (newParams: Partial<SimulationParams>) => { success: boolean; error?: string };
}

export const ParametersModal: React.FC<ParametersModalProps> = ({
  isOpen,
  onClose,
  params,
  isRunning,
  onUpdateParams
}) => {
  const [formData, setFormData] = useState<SimulationParams>(params);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setFormData(params);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [params, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof SimulationParams, value: string) => {
    const num = parseFloat(value);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num
    }));
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const result = onUpdateParams(formData);
    if (!result.success) {
      setErrorMessage(result.error || 'Parámetros inválidos.');
      setSuccessMessage(null);
    } else {
      setErrorMessage(null);
      setSuccessMessage('¡Parámetros actualizados y validados correctamente!');
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleResetDefaults = () => {
    const defaults: SimulationParams = {
      capacity: 1000,
      initialVolume: 500,
      inletFlowNominal: 40,
      outletFlowNominal: 10,
      onThresholdPct: 30,
      offThresholdPct: 80,
      lowAlarmPct: 20,
      highAlarmPct: 90
    };
    setFormData(defaults);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Configuración de Instrumentación
            </span>
            <h2 className="text-base font-bold text-slate-100">
              Parámetros de Operación y Umbrales de Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Error Message banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-950/70 border border-red-700/80 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Error de Validación: </span>
                {errorMessage}
              </div>
            </div>
          )}

          {/* Success Message banner */}
          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-950/70 border border-emerald-700/80 text-xs text-emerald-200">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Section 1: Estanque (Capacidad y Volumen Inicial) */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                1. Dimensionamiento Físico del Estanque
              </h3>
              {isRunning && (
                <span className="flex items-center gap-1 text-[11px] text-amber-400/90 font-medium">
                  <Lock className="w-3.5 h-3.5" /> Bloqueado durante ejecución (pause para editar)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Capacidad Total del Estanque (L)
                </label>
                <input
                  type="number"
                  min="1"
                  step="10"
                  disabled={isRunning}
                  value={formData.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Debe ser estrictamente mayor que 0 L (predeterminado: 1.000 L).
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Volumen Inicial al Reiniciar (L)
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.capacity}
                  step="10"
                  disabled={isRunning}
                  value={formData.initialVolume}
                  onChange={(e) => handleChange('initialVolume', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Debe estar entre 0 L y {formData.capacity} L (predeterminado: 500 L).
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Caudales */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              2. Caudales del Proceso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Caudal Entrada Nominal Bomba (L/min)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.inletFlowNominal}
                  onChange={(e) => handleChange('inletFlowNominal', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Flujo cuando P-101 está encendida (predeterminado: 40 L/min).
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Caudal de Salida / Demanda (L/min)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.outletFlowNominal}
                  onChange={(e) => handleChange('outletFlowNominal', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-slate-100"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Consumo solicitado de la planta (predeterminado: 10 L/min).
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: Umbrales de Histéresis */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              3. Umbrales de Control Automático (Histéresis)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Umbral de Encendido (ON) (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.onThresholdPct}
                  onChange={(e) => handleChange('onThresholdPct', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Bomba arranca si nivel &le; este valor (predeterminado: 30%).
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Umbral de Apagado (OFF) (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.offThresholdPct}
                  onChange={(e) => handleChange('offThresholdPct', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-cyan-400 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Bomba se detiene si nivel &ge; este valor (predeterminado: 80%).
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Límites de Alarma */}
          <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              4. Alarmas de Proceso
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Alarma de Nivel Bajo (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.lowAlarmPct}
                  onChange={(e) => handleChange('lowAlarmPct', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-orange-400 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Alerta por desabastecimiento (predeterminado: &le; 20%).
                </span>
              </div>

              <div>
                <label className="block text-xs text-slate-300 font-medium mb-1">
                  Alarma de Nivel Alto (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.highAlarmPct}
                  onChange={(e) => handleChange('highAlarmPct', e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs font-mono text-rose-400 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Alerta por sobrellenado (predeterminado: &ge; 90%).
                </span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:underline transition-colors cursor-pointer"
            >
              Restablecer Valores Predeterminados
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-md"
              >
                Guardar y Validar Parámetros
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
