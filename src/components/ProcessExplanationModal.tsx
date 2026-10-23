import React from 'react';
import { X, CheckCircle, Radio, ShieldCheck, LineChart, FileText, ToggleLeft, AlertTriangle } from 'lucide-react';

interface ProcessExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProcessExplanationModal: React.FC<ProcessExplanationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
              Apoyo Didáctico para Exposición Universitaria
            </span>
            <h2 className="text-lg font-bold text-slate-100">
              Arquitectura del Proceso: Los 5 Pasos del Ciclo de Control
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Important Engineering Note: ON-OFF with Hysteresis vs PID */}
          <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-amber-300 text-sm">
                Nota Fundamental de Ingeniería de Control (ON-OFF con Histéresis vs PID)
              </h4>
              <p className="text-xs text-amber-200/90 mt-1 leading-relaxed">
                El control implementado en este estanque es de tipo <strong>Todo/Nada (ON-OFF) con banda muerta o histéresis</strong>.
                No es un control PID (Proporcional-Integral-Derivativo), debido a que el actuador principal es una bomba con contactor electromecánico
                que solo admite dos estados discretos (energizado al 100% o desenergizado al 0%), y no una válvula modulante continua ni variador de frecuencia (VFD).
                La histéresis es la técnica industrial estándar para evitar el ciclo límite destructivo (chattering).
              </p>
            </div>
          </div>

          {/* 5 Process Steps Grid */}
          <div className="space-y-4">
            {/* Paso 1 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center font-mono font-bold text-sky-400 text-sm">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Paso 1: Captura de Mediciones (Instrumentación de Campo)</h3>
                  <span className="text-xs text-slate-400 font-mono">Transmisor de Nivel LT-101</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                Generación periódica de las mediciones del proceso físico. En una planta real, esto corresponde a un sensor ultrasónico o hidrostático con señal estándar 4–20 mA conectada a una tarjeta de entradas analógicas (AI) de un PLC. En el simulador, se calcula determinísticamente la evolución del volumen integrando en el tiempo los caudales:
                <br />
                <span className="font-mono text-cyan-300 block my-1">
                  Volumen(t + &Delta;t) = Volumen(t) + (Qin - Qout) &times; &Delta;t
                </span>
                <span className="font-mono text-cyan-300 block">
                  Nivel(%) = (Volumen actual / Capacidad) &times; 100
                </span>
              </p>
            </div>

            {/* Paso 2 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center font-mono font-bold text-emerald-400 text-sm">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Paso 2: Validación de Datos e Integridad de Rango</h3>
                  <span className="text-xs text-slate-400 font-mono">Filtros de Coherencia Física y Sanitización</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                Antes de emplear las variables en la toma de decisiones, el sistema aplica reglas deterministas de validación:
                los caudales no pueden ser negativos, la capacidad debe ser positiva, el volumen no puede superar la capacidad ni caer bajo cero,
                y se verifica que el umbral de encendido sea estrictamente inferior al de apagado. En caso de parámetros anómalos, el sistema los rechaza y preserva el último estado seguro.
              </p>
            </div>

            {/* Paso 3 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Paso 3: Análisis y Balance Volumétrico</h3>
                  <span className="text-xs text-slate-400 font-mono">Evaluación de Caudal Neto y Proyección Temporal</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                El controlador evalúa el gradiente de cambio mediante el caudal neto (Qneto = Qin − Qout).
                Si la bomba está encendida y Qneto &gt; 0, el sistema proyecta analíticamente el tiempo estimado hasta el apagado:
                <br />
                <span className="font-mono text-indigo-300 block my-1">
                  Tiempo estimado = (Volumen objetivo &minus; Volumen actual) / Caudal neto
                </span>
                Si el caudal de consumo es mayor que el de llenado, el análisis detecta que el objetivo es inalcanzable y emite la alerta preventiva correspondiente.
              </p>
            </div>

            {/* Paso 4 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center font-mono font-bold text-purple-400 text-sm">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Paso 4: Gestión de Datos (Historian y Registro de Eventos)</h3>
                  <span className="text-xs text-slate-400 font-mono">Trazabilidad, Muestreo Periódico y Logbook</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                Las mediciones se registran a intervalos regulares de tiempo simulado (base de datos temporal o Historian SCADA),
                mientras que los eventos operacionales (cambios de modo de control, accionamientos de bomba, enclavamientos y transiciones de alarmas)
                se registran únicamente al producirse la transición de estado (filtro anti-inundación de alarmas).
                Los datos son exportables en formato estándar CSV para auditoría y curvas de desempeño.
              </p>
            </div>

            {/* Paso 5 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center font-mono font-bold text-cyan-400 text-sm">
                  5
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Paso 5: Decisión Operacional (Lógica de Histéresis y Seguridad)</h3>
                  <span className="text-xs text-slate-400 font-mono">Comando del Actuador P-101 y Enclavamientos Físicos</span>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pl-11">
                En cada ciclo de escaneo (scan cycle):
                <br />
                &bull; Si Nivel &le; 30% &rarr; Activar salida a relé (Bomba ON).
                <br />
                &bull; Si Nivel &ge; 80% &rarr; Desactivar salida a relé (Bomba OFF).
                <br />
                &bull; Si 30% &lt; Nivel &lt; 80% &rarr; Conservar el estado anterior (efecto memoria / histéresis).
                <br />
                Adicionalmente, los enclavamientos de seguridad física (interlocks) supervisan que si el volumen alcanza el 100%,
                el flujo de entrada se corte de inmediato independientemente del comando manual o automático, protegiendo las instalaciones.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Entendido, volver a la simulación
          </button>
        </div>
      </div>
    </div>
  );
};
