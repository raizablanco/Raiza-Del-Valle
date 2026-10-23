import { SimulationParams, SimulationState, AutomatedSequenceStatus } from '../types/simulation';
import { formatNumber } from '../utils/formatters';
import { HelpCircle, Calculator, Cpu, Database, AlertCircle, Sparkles } from 'lucide-react';

interface DataExplanationProps {
  params: SimulationParams;
  state: SimulationState;
  sequenceStatus?: AutomatedSequenceStatus;
}

export const DataExplanation: React.FC<DataExplanationProps> = ({ params, state, sequenceStatus }) => {
  const {
    volume,
    levelPct,
    effectiveInletFlow,
    effectiveOutletFlow,
    netFlow,
    pumpState,
    pumpCommandSource,
    controlMode,
    alarms,
    estimatedTimeToOffMinutes
  } = state;

  const {
    capacity,
    inletFlowNominal,
    outletFlowNominal,
    onThresholdPct,
    offThresholdPct,
    lowAlarmPct,
    highAlarmPct
  } = params;

  // Rate of percentage change per minute
  const pctChangePerMinute = (netFlow / capacity) * 100;

  // Narrative generation based on current state
  let trendDescription = '';
  if (Math.abs(netFlow) < 0.05) {
    trendDescription = 'El sistema se encuentra en equilibrio volumétrico (Caudal de Entrada = Caudal de Salida). El nivel permanece constante.';
  } else if (netFlow > 0) {
    trendDescription = `Ingresan ${formatNumber(effectiveInletFlow, 1)} L/min y salen ${formatNumber(effectiveOutletFlow, 1)} L/min. El volumen aumenta ${formatNumber(netFlow, 1)} litros por minuto. En un estanque de ${capacity.toLocaleString()} litros, esto equivale a un aumento de ${formatNumber(pctChangePerMinute, 2)} puntos porcentuales de nivel por minuto.`;
  } else {
    trendDescription = `Salen ${formatNumber(effectiveOutletFlow, 1)} L/min y solo ingresan ${formatNumber(effectiveInletFlow, 1)} L/min. La demanda supera el aporte en ${formatNumber(Math.abs(netFlow), 1)} L/min. El volumen disminuye a razón de ${formatNumber(Math.abs(pctChangePerMinute), 2)} puntos porcentuales de nivel por minuto.`;
  }

  // Why is the pump ON or OFF
  let pumpDiagnosis = '';
  if (pumpCommandSource === 'MANUAL') {
    pumpDiagnosis = `La bomba fue comandada manualmente a estado ${pumpState} por intervención directa del operador desde la interfaz. Las protecciones de seguridad física se mantienen vigilantes.`;
  } else {
    if (pumpState === 'ON') {
      if (levelPct <= onThresholdPct) {
        pumpDiagnosis = `El nivel (${formatNumber(levelPct, 1)}%) cayó por debajo o igual al umbral de encendido (${onThresholdPct}%). El automatismo conmutó la bomba a ENCENDIDA para recuperar volumen.`;
      } else {
        pumpDiagnosis = `El nivel (${formatNumber(levelPct, 1)}%) se encuentra en la zona de histéresis (entre ${onThresholdPct}% y ${offThresholdPct}%). Dado que la bomba venía encendida, el control retiene el estado hasta alcanzar el umbral de apagado.`;
      }
    } else {
      if (levelPct >= offThresholdPct) {
        pumpDiagnosis = `El nivel (${formatNumber(levelPct, 1)}%) alcanzó o superó el umbral de apagado (${offThresholdPct}%). El automatismo apagó la bomba para evitar sobrellenado.`;
      } else {
        pumpDiagnosis = `El nivel (${formatNumber(levelPct, 1)}%) se encuentra en la zona de histéresis (entre ${onThresholdPct}% y ${offThresholdPct}%). Como la bomba venía apagada, se mantiene apagada hasta que el nivel baje a ${onThresholdPct}%.`;
      }
    }
  }

  // Difference between nominal and effective flow
  let flowDifferenceExplanation = '';
  if (pumpState === 'OFF') {
    flowDifferenceExplanation = `La bomba está apagada; por ende, el caudal de entrada efectivo es 0,0 L/min, aun cuando la bomba tenga una capacidad nominal configurada de ${inletFlowNominal} L/min.`;
  } else if (alarms.overflowProtection) {
    flowDifferenceExplanation = `El estanque ha alcanzado su capacidad máxima (${capacity} L). El caudal de entrada efectivo se fuerza a 0,0 L/min para evitar rebalse físico.`;
  } else {
    flowDifferenceExplanation = `La bomba está activa y el estanque tiene espacio disponible, por lo que el caudal de entrada efectivo coincide con el nominal (${inletFlowNominal} L/min).`;
  }

  // Alarm Diagnosis
  let alarmDiagnosis = 'Ninguna alarma activa en este momento. Proceso en rango de operación normal.';
  if (alarms.overflowProtection) {
    alarmDiagnosis = '¡Condición Crítica! Nivel al 100% de capacidad. Se activó el enclavamiento de seguridad por sobrellenado.';
  } else if (alarms.cavitationProtection) {
    alarmDiagnosis = '¡Condición de advertencia! Volumen en 0 L. Se interrumpió el caudal de salida para prevenir daño por cavitación en la succión del proceso receptor.';
  } else if (alarms.highLevel) {
    alarmDiagnosis = `Alarma de Nivel Alto activa: El nivel (${formatNumber(levelPct, 1)}%) es mayor o igual al límite crítico configurado (${highAlarmPct}%). Se requiere supervisión.`;
  } else if (alarms.lowLevel) {
    alarmDiagnosis = `Alarma de Nivel Bajo activa: El nivel (${formatNumber(levelPct, 1)}%) es menor o igual al límite configurado (${lowAlarmPct}%). Riesgo de desabastecimiento.`;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5">
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <HelpCircle className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-base text-slate-100 tracking-wide uppercase">
          ¿Qué significan estos datos? (Diagnóstico en Vivo del Proceso)
        </h3>
      </div>

      {/* Active Sequence Diagnostic Banner */}
      {sequenceStatus?.isActive && (
        <div className="bg-gradient-to-r from-cyan-950/70 to-slate-900 border border-cyan-500/40 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-cyan-500/20 text-cyan-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center gap-2">
                <span>Diagnóstico del Ensayo Programado (Etapa {sequenceStatus.stageNumber})</span>
                <span className="text-[10px] bg-cyan-900/80 px-2 py-0.5 rounded text-cyan-200 font-mono">
                  Meta: {sequenceStatus.targetVolume.toFixed(0)} L ({sequenceStatus.targetPct.toFixed(0)}%)
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                {sequenceStatus.stageDescription}
              </p>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 shrink-0">
            {sequenceStatus.isHolding ? 'Fase de Permanencia' : 'Transición Dinámica'}
          </div>
        </div>
      )}

      {/* Real-time Narrative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dynamic Balance Narrative */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-cyan-300 mb-1.5 flex items-center gap-1.5">
              <Calculator className="w-4 h-4" /> Balance de Masa y Dinámica de Nivel
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {trendDescription}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
            Fórmula: Caudal Neto = Qin ({formatNumber(effectiveInletFlow, 1)}) − Qout ({formatNumber(effectiveOutletFlow, 1)}) = {netFlow >= 0 ? '+' : ''}{formatNumber(netFlow, 1)} L/min
          </div>
        </div>

        {/* Dynamic Pump Decision Narrative */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-300 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4" /> Diagnóstico de la Bomba P-101
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {pumpDiagnosis}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 font-mono text-[11px] text-slate-400">
            Modo: {controlMode} · Umbral ON: {onThresholdPct}% · Umbral OFF: {offThresholdPct}%
          </div>
        </div>

        {/* Nominal vs Effective Flow explanation */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
              <Database className="w-4 h-4" /> Caudal Configurado vs Caudal Efectivo
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {flowDifferenceExplanation}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            En instrumentación industrial, el actuador (bomba) solo entrega flujo físico cuando está energizado y cuenta con fluido disponible.
          </div>
        </div>

        {/* Alarms and Safety limits explanation */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-300 mb-1.5 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Estado de Alarmas y Enclavamientos
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              {alarmDiagnosis}
            </p>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
            Límites de Alarma: Bajo &le; {lowAlarmPct}% · Alto &ge; {highAlarmPct}%
          </div>
        </div>
      </div>

      {/* Target Time Calculation formula box */}
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
          Cálculo del Tiempo Estimado hasta el Umbral de Apagado ({offThresholdPct}% = {((capacity * offThresholdPct) / 100).toFixed(0)} L)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div>
            <div className="font-mono bg-slate-900 p-2.5 rounded border border-slate-800 text-cyan-300">
              Tiempo estimado = (Volumen Objetivo − Volumen Actual) / Caudal Neto
            </div>
            <p className="text-slate-400 text-[11px] mt-2">
              Esta estimación analítica asume caudales constantes de entrada y salida hasta alcanzar el umbral superior.
            </p>
          </div>

          <div className="bg-slate-900/80 p-3 rounded border border-slate-800 font-mono text-xs">
            {pumpState === 'ON' && netFlow > 0 && volume < (capacity * offThresholdPct) / 100 ? (
              <div className="space-y-1">
                <div>Volumen objetivo = {capacity} L &times; {offThresholdPct}% = <span className="text-cyan-400 font-bold">{((capacity * offThresholdPct) / 100).toFixed(0)} L</span></div>
                <div>Volumen actual = <span className="text-slate-200 font-bold">{formatNumber(volume, 1)} L</span></div>
                <div>Volumen faltante = {((capacity * offThresholdPct) / 100 - volume).toFixed(1)} L</div>
                <div>Caudal neto = <span className="text-emerald-400 font-bold">+{formatNumber(netFlow, 1)} L/min</span></div>
                <div className="pt-1.5 border-t border-slate-700 text-cyan-300 font-bold">
                  Tiempo = {((capacity * offThresholdPct) / 100 - volume).toFixed(1)} / {formatNumber(netFlow, 1)} = {formatNumber(estimatedTimeToOffMinutes || 0, 1)} minutos
                </div>
              </div>
            ) : (
              <div className="text-amber-400/90 py-2">
                &times; No se alcanzará el objetivo con las condiciones actuales:
                <ul className="list-disc ml-5 mt-1 text-[11px] text-slate-400 font-sans space-y-0.5">
                  {pumpState === 'OFF' && <li>La bomba está apagada (no hay inyección de caudal).</li>}
                  {netFlow <= 0 && <li>El caudal neto es negativo o nulo (el consumo iguala o supera la entrada).</li>}
                  {volume >= (capacity * offThresholdPct) / 100 && <li>El nivel ya superó o igualó el objetivo.</li>}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Differentiation Matrix: Datos Simulados vs Valores Calculados vs Decisiones de Control */}
      <div>
        <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2.5">
          Estructura de la Información de Control Industrial
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950 font-mono">
                <th className="py-2.5 px-3">Categoría de Variable</th>
                <th className="py-2.5 px-3">Variables del Sistema</th>
                <th className="py-2.5 px-3">Origen / Mecanismo</th>
                <th className="py-2.5 px-3">Función en el Lazo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-sans">
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-cyan-300">1. Datos Simulados</td>
                <td className="py-2.5 px-3 font-mono">Volumen (L), Nivel (%)</td>
                <td className="py-2.5 px-3">Lectura del sensor de nivel LT-101 (transductor de presión hidrostática o ultrasónico)</td>
                <td className="py-2.5 px-3">Variable de Proceso (PV - Process Variable) realimentada al controlador.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-indigo-300">2. Valores Calculados</td>
                <td className="py-2.5 px-3 font-mono">Caudal Neto (L/min), dV/dt, Tiempo a Umbral</td>
                <td className="py-2.5 px-3">Algoritmo matemático de balance de masa en el controlador PLC/DCS</td>
                <td className="py-2.5 px-3">Diagnóstico operacional, estimación predictiva y detección de perturbaciones.</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2.5 px-3 font-semibold text-emerald-300">3. Decisiones de Control</td>
                <td className="py-2.5 px-3 font-mono">Comando Bomba P-101 (ON/OFF), Salidas a Relé</td>
                <td className="py-2.5 px-3">Lógica Booleana con Histéresis ejecutada en el ciclo de scan del autómata</td>
                <td className="py-2.5 px-3">Variable Manipulada (MV - Manipulated Variable) que actúa sobre el proceso.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
