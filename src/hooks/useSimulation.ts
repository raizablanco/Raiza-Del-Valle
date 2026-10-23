import { useState, useRef, useEffect, useCallback } from 'react';
import {
  SimulationParams,
  SimulationState,
  HistoryPoint,
  LogEvent,
  ControlMode,
  PumpState,
  PumpCommandSource,
  DEFAULT_PARAMS,
  AutomatedSequenceConfig,
  AutomatedSequenceStatus,
  SequenceStage,
  DEFAULT_SEQUENCE_CONFIG,
  ScenarioPreset
} from '../types/simulation';
import { formatSimulatedTime } from '../utils/formatters';

export function useSimulation() {
  const [params, setParams] = useState<SimulationParams>(DEFAULT_PARAMS);
  const paramsRef = useRef<SimulationParams>(DEFAULT_PARAMS);
  paramsRef.current = params;

  const [controlMode, setControlMode] = useState<ControlMode>('AUTO');
  const controlModeRef = useRef<ControlMode>('AUTO');
  controlModeRef.current = controlMode;

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const isRunningRef = useRef<boolean>(false);
  isRunningRef.current = isRunning;

  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const speedRef = useRef<number>(1);
  speedRef.current = speedMultiplier;

  // Automated Sequence State
  const [sequenceConfig, setSequenceConfig] = useState<AutomatedSequenceConfig>(DEFAULT_SEQUENCE_CONFIG);
  const sequenceConfigRef = useRef<AutomatedSequenceConfig>(DEFAULT_SEQUENCE_CONFIG);
  sequenceConfigRef.current = sequenceConfig;

  const [sequenceStatus, setSequenceStatus] = useState<AutomatedSequenceStatus>({
    isActive: false,
    stage: 'IDLE',
    stageNumber: 0,
    stageTitle: 'Secuencia Inactiva',
    stageDescription: 'Secuencia lista: 1) Llenar a 800 L → 2) A los 3 min bajar a 300 L → 3) Tras 1 min bajar a <25%.',
    targetVolume: 800,
    targetPct: 80,
    stageElapsedSeconds: 0,
    stageRemainingSeconds: null,
    progressPct: 0,
    isHolding: false
  });
  const sequenceStatusRef = useRef<AutomatedSequenceStatus>(sequenceStatus);
  sequenceStatusRef.current = sequenceStatus;

  const stage2HoldStartRef = useRef<number | null>(null);

  // Primary dynamic state
  const [simState, setSimState] = useState<SimulationState>(() => {
    const initVol = DEFAULT_PARAMS.initialVolume;
    const cap = DEFAULT_PARAMS.capacity;
    const lvl = (initVol / cap) * 100;
    const initialPump: PumpState = lvl <= DEFAULT_PARAMS.onThresholdPct ? 'ON' : 'OFF';

    const effInlet = initialPump === 'ON' ? DEFAULT_PARAMS.inletFlowNominal : 0;
    const effOutlet = DEFAULT_PARAMS.outletFlowNominal;
    const net = effInlet - effOutlet;
    const targetVol = cap * (DEFAULT_PARAMS.offThresholdPct / 100);

    return {
      timeSeconds: 0,
      volume: initVol,
      levelPct: lvl,
      effectiveInletFlow: effInlet,
      effectiveOutletFlow: effOutlet,
      netFlow: net,
      pumpState: initialPump,
      controlMode: 'AUTO',
      pumpCommandSource: 'AUTO',
      alarms: {
        lowLevel: lvl <= DEFAULT_PARAMS.lowAlarmPct,
        highLevel: lvl >= DEFAULT_PARAMS.highAlarmPct,
        overflowProtection: false,
        cavitationProtection: false
      },
      estimatedTimeToOffMinutes:
        initialPump === 'ON' && net > 0 && initVol < targetVol
          ? (targetVol - initVol) / net
          : null,
      targetVolume: targetVol,
      isRunning: false,
      speedMultiplier: 1
    };
  });

  const stateRef = useRef<SimulationState>(simState);
  stateRef.current = simState;

  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [events, setEvents] = useState<LogEvent[]>([]);

  // Refs for tracking transitions and sample timing
  const lastSampleTimeRef = useRef<number>(0);
  const lastAlarmsRef = useRef({
    lowLevel: (DEFAULT_PARAMS.initialVolume / DEFAULT_PARAMS.capacity) * 100 <= DEFAULT_PARAMS.lowAlarmPct,
    highLevel: (DEFAULT_PARAMS.initialVolume / DEFAULT_PARAMS.capacity) * 100 >= DEFAULT_PARAMS.highAlarmPct,
    overflowProtection: false,
    cavitationProtection: false
  });
  const eventCounterRef = useRef<number>(1);

  // Helper to add event
  const addEvent = useCallback((
    category: LogEvent['category'],
    severity: LogEvent['severity'],
    description: string,
    timeSec?: number
  ) => {
    const t = timeSec !== undefined ? timeSec : stateRef.current.timeSeconds;
    const newEvent: LogEvent = {
      id: `EV-${String(eventCounterRef.current++).padStart(4, '0')}`,
      timeSeconds: t,
      timeFormatted: formatSimulatedTime(t),
      category,
      severity,
      description
    };
    setEvents((prev) => [newEvent, ...prev].slice(0, 300));
  }, []);

  // Initialize with startup event
  useEffect(() => {
    addEvent('CONTROL', 'info', 'Sistema inicializado en Modo Automático. Parámetros nominales cargados.', 0);
    const initialHistoryPoint: HistoryPoint = {
      timeSeconds: 0,
      timeFormatted: '00:00',
      levelPct: simState.levelPct,
      volume: simState.volume,
      effectiveInletFlow: simState.effectiveInletFlow,
      effectiveOutletFlow: simState.effectiveOutletFlow,
      netFlow: simState.netFlow,
      pumpState: simState.pumpState,
      controlMode: simState.controlMode,
      activeAlarms: []
    };
    if (simState.alarms.lowLevel) initialHistoryPoint.activeAlarms.push('NIVEL BAJO');
    if (simState.alarms.highLevel) initialHistoryPoint.activeAlarms.push('NIVEL ALTO');
    setHistory([initialHistoryPoint]);
  }, [addEvent]);

  // Main simulation loop using requestAnimationFrame
  useEffect(() => {
    let animId: number;
    let lastTimestamp: number | null = null;

    const tick = (now: number) => {
      if (lastTimestamp === null) {
        lastTimestamp = now;
      }
      const deltaRealMs = Math.min(now - lastTimestamp, 100); // Clamp to 100ms max
      lastTimestamp = now;

      if (isRunningRef.current) {
        const p = paramsRef.current;
        const currentMode = controlModeRef.current;
        const speed = speedRef.current;
        const s = stateRef.current;
        const seqStatus = sequenceStatusRef.current;
        const seqCfg = sequenceConfigRef.current;

        const dtSimSec = (deltaRealMs / 1000) * speed;
        const dtMinutes = dtSimSec / 60;
        const newTime = s.timeSeconds + dtSimSec;

        let pump = s.pumpState;
        let pumpSource = s.pumpCommandSource;
        let effInlet = 0;
        let effOutlet = p.outletFlowNominal;
        let overflow = false;
        let cavitation = false;

        // Check if Automated Sequence is active
        if (seqStatus.isActive) {
          let stage = seqStatus.stage;
          let stageNumber = seqStatus.stageNumber;
          let stageTitle = seqStatus.stageTitle;
          let stageDescription = seqStatus.stageDescription;
          let targetVolume = seqStatus.targetVolume;
          let targetPct = seqStatus.targetPct;
          let stageElapsedSeconds = seqStatus.stageElapsedSeconds;
          let stageRemainingSeconds: number | null = null;
          let progressPct = seqStatus.progressPct;
          let isHolding = false;

          if (stage === 'STAGE_1_FILL_800') {
            stageNumber = 1;
            targetVolume = seqCfg.stage1TargetVolume; // 800 L
            targetPct = (targetVolume / p.capacity) * 100;
            pump = 'ON';
            pumpSource = 'AUTO';
            effInlet = seqCfg.stage1InletFlow; // 100 L/min
            effOutlet = seqCfg.stage1OutletFlow; // 10 L/min

            // Calculate progress to 800 L
            progressPct = Math.min(100, Math.max(0, (s.volume / targetVolume) * 100));
            stageTitle = 'Etapa 1: Llenado a 800 Litros';
            stageDescription = `Llenando con Bomba P-101 activa (+${(effInlet - effOutlet).toFixed(0)} L/min neto) hacia 800 L.`;
            stageElapsedSeconds = newTime;
            const remainingVol = Math.max(0, targetVolume - s.volume);
            const netFill = effInlet - effOutlet;
            stageRemainingSeconds = netFill > 0 ? (remainingVol / netFill) * 60 : null;

            // Check if 800 L reached
            if (s.volume >= targetVolume) {
              pump = 'OFF';
              effInlet = 0;
              effOutlet = 0; // Hold at 800 L

              if (newTime < seqCfg.stage2TriggerTimeSeconds) {
                stage = 'STAGE_1_HOLD';
                addEvent(
                  'CONTROL',
                  'success',
                  `Etapa 1 Completada: Se alcanzaron los ${targetVolume} L (80%). Reteniendo nivel hasta los 3:00 min (180 s) para iniciar descenso a 300 L.`,
                  newTime
                );
              } else {
                stage = 'STAGE_2_DRAIN_300';
                addEvent(
                  'CONTROL',
                  'info',
                  `Etapa 2 Iniciada (a los 3:00 min): Vaciando estanque hacia ${seqCfg.stage2TargetVolume} L (30%).`,
                  newTime
                );
              }
            }
          } else if (stage === 'STAGE_1_HOLD') {
            stageNumber = 1;
            isHolding = true;
            pump = 'OFF';
            effInlet = 0;
            effOutlet = 0; // maintain 800 L
            targetVolume = seqCfg.stage1TargetVolume;
            targetPct = (targetVolume / p.capacity) * 100;
            progressPct = 100;
            stageTitle = 'Etapa 1: Nivel 800 L alcanzado (Esperando marca de 3:00 min)';
            const remTime = Math.max(0, seqCfg.stage2TriggerTimeSeconds - newTime);
            stageRemainingSeconds = remTime;
            stageElapsedSeconds = newTime;
            stageDescription = `Nivel en 800 L. En pausa de llenado hasta cumplir 3:00 min (${remTime.toFixed(0)} s restantes).`;

            if (newTime >= seqCfg.stage2TriggerTimeSeconds) {
              stage = 'STAGE_2_DRAIN_300';
              addEvent(
                'CONTROL',
                'info',
                `Etapa 2 Iniciada (cumplidos 3:00 min de ensayo): Abriendo consumo para descender a ${seqCfg.stage2TargetVolume} L (30%).`,
                newTime
              );
            }
          } else if (stage === 'STAGE_2_DRAIN_300') {
            stageNumber = 2;
            pump = 'OFF';
            pumpSource = 'AUTO';
            effInlet = 0;
            effOutlet = seqCfg.stage2OutletFlow; // 80 L/min
            targetVolume = seqCfg.stage2TargetVolume; // 300 L
            targetPct = (targetVolume / p.capacity) * 100;
            stageTitle = 'Etapa 2: A los 3 minutos → Bajar a 300 Litros';
            stageDescription = `Descendiendo a ${targetVolume} L (30%) con caudal de salida de ${effOutlet} L/min.`;
            stageElapsedSeconds = Math.max(0, newTime - seqCfg.stage2TriggerTimeSeconds);

            const drainRange = seqCfg.stage1TargetVolume - seqCfg.stage2TargetVolume;
            const drained = seqCfg.stage1TargetVolume - s.volume;
            progressPct = drainRange > 0 ? Math.min(100, Math.max(0, (drained / drainRange) * 100)) : 100;

            const remainingDrain = Math.max(0, s.volume - targetVolume);
            stageRemainingSeconds = effOutlet > 0 ? (remainingDrain / effOutlet) * 60 : null;

            if (s.volume <= targetVolume) {
              effOutlet = 0;
              stage = 'STAGE_2_HOLD';
              stage2HoldStartRef.current = newTime;
              addEvent(
                'CONTROL',
                'success',
                `Etapa 2 Completada: Nivel descendió a ${targetVolume} L (30%). Esperando 1 minuto (60 s) antes de bajar a menos del 25%.`,
                newTime
              );
            }
          } else if (stage === 'STAGE_2_HOLD') {
            stageNumber = 2;
            isHolding = true;
            pump = 'OFF';
            effInlet = 0;
            effOutlet = 0; // maintain 300 L
            targetVolume = seqCfg.stage2TargetVolume;
            targetPct = (targetVolume / p.capacity) * 100;
            const holdStart = stage2HoldStartRef.current ?? newTime;
            const holdElapsed = Math.max(0, newTime - holdStart);
            const holdRemaining = Math.max(0, seqCfg.stage3DelaySeconds - holdElapsed);
            stageElapsedSeconds = holdElapsed;
            stageRemainingSeconds = holdRemaining;
            progressPct = Math.min(100, Math.max(0, (holdElapsed / seqCfg.stage3DelaySeconds) * 100));
            stageTitle = 'Etapa 2: Nivel 300 L alcanzado (Esperando 1 minuto de permanencia)';
            stageDescription = `Manteniendo 300 L. Esperando 1 minuto (${holdRemaining.toFixed(0)} s restantes) antes de bajar a menos del 25%.`;

            if (holdElapsed >= seqCfg.stage3DelaySeconds) {
              stage = 'STAGE_3_DRAIN_SUB25';
              addEvent(
                'CONTROL',
                'warning',
                `Etapa 3 Iniciada (tras 1 minuto en 300 L): Descendiendo a menos del 25% (<250 L, objetivo ${seqCfg.stage3TargetVolume} L / 20%).`,
                newTime
              );
            }
          } else if (stage === 'STAGE_3_DRAIN_SUB25') {
            stageNumber = 3;
            pump = 'OFF';
            pumpSource = 'AUTO';
            effInlet = 0;
            effOutlet = seqCfg.stage3OutletFlow; // 60 L/min
            targetVolume = seqCfg.stage3TargetVolume; // 200 L (<25% of 1000L = 250L)
            targetPct = (targetVolume / p.capacity) * 100;
            stageTitle = 'Etapa 3: Bajar a menos del 25% del estanque (<250 L)';
            stageDescription = `Descendiendo por debajo del 25% hacia ${targetVolume} L (20%), activando alarma de nivel bajo.`;

            const drainRange3 = seqCfg.stage2TargetVolume - seqCfg.stage3TargetVolume;
            const drained3 = seqCfg.stage2TargetVolume - s.volume;
            progressPct = drainRange3 > 0 ? Math.min(100, Math.max(0, (drained3 / drainRange3) * 100)) : 100;

            const remainingDrain3 = Math.max(0, s.volume - targetVolume);
            stageRemainingSeconds = effOutlet > 0 ? (remainingDrain3 / effOutlet) * 60 : null;

            if (s.volume <= targetVolume) {
              effOutlet = 0;
              stage = 'COMPLETED';
              stageNumber = 4;
              stageTitle = 'Secuencia Finalizada con Éxito';
              stageDescription = 'Secuencia completada: 1) 800 L alcanzados · 2) A los 3 min bajó a 300 L · 3) Tras 1 min bajó a menos del 25% (<250 L = 200 L).';
              stageRemainingSeconds = 0;
              progressPct = 100;
              addEvent(
                'CONTROL',
                'success',
                `Etapa 3 Completada con Éxito: Nivel en 20% (<25% de capacidad = ${targetVolume} L). Alarma de nivel bajo registrada. Secuencia de prueba finalizada exitosamente.`,
                newTime
              );
            }
          } else if (stage === 'COMPLETED') {
            stageNumber = 4;
            pump = 'OFF';
            effInlet = 0;
            effOutlet = 0;
            progressPct = 100;
            stageRemainingSeconds = 0;
          }

          const nextSeqStatus: AutomatedSequenceStatus = {
            isActive: true,
            stage,
            stageNumber,
            stageTitle,
            stageDescription,
            targetVolume,
            targetPct,
            stageElapsedSeconds,
            stageRemainingSeconds,
            progressPct,
            isHolding
          };
          sequenceStatusRef.current = nextSeqStatus;
          setSequenceStatus(nextSeqStatus);
        } else {
          // Standard Control Logic (Auto or Manual)
          if (currentMode === 'AUTO') {
            if (s.levelPct <= p.onThresholdPct) {
              if (pump !== 'ON') {
                pump = 'ON';
                pumpSource = 'AUTO';
                addEvent(
                  'BOMBA',
                  'info',
                  `Bomba ENCENDIDA por lógica automática (Nivel ${s.levelPct.toFixed(1)}% <= Umbral ON ${p.onThresholdPct}%).`,
                  newTime
                );
              }
            } else if (s.levelPct >= p.offThresholdPct) {
              if (pump !== 'OFF') {
                pump = 'OFF';
                pumpSource = 'AUTO';
                addEvent(
                  'BOMBA',
                  'info',
                  `Bomba APAGADA por lógica automática (Nivel ${s.levelPct.toFixed(1)}% >= Umbral OFF ${p.offThresholdPct}%).`,
                  newTime
                );
              }
            }
          }

          if (pump === 'ON') {
            if (s.volume >= p.capacity) {
              effInlet = 0;
              overflow = true;
            } else {
              effInlet = p.inletFlowNominal;
            }
          } else {
            effInlet = 0;
          }

          effOutlet = p.outletFlowNominal;
          if (s.volume <= 0) {
            effOutlet = 0;
            cavitation = true;
          } else {
            const maxDeliverableFlow = s.volume / Math.max(dtMinutes, 0.0001);
            if (effOutlet > maxDeliverableFlow) {
              effOutlet = maxDeliverableFlow;
              cavitation = true;
            }
          }
        }

        // Volume and Level Integration
        const net = effInlet - effOutlet;
        const rawNewVol = s.volume + net * dtMinutes;
        const newVol = Math.max(0, Math.min(p.capacity, rawNewVol));
        const newLvl = (newVol / p.capacity) * 100;

        // Overflow / Cavitation Event handling
        if (overflow && !lastAlarmsRef.current.overflowProtection) {
          addEvent(
            'PROTECCIÓN',
            'critical',
            'Protección de sobrellenado activada: Estanque al 100%. Caudal de entrada cortado.',
            newTime
          );
        } else if (!overflow && lastAlarmsRef.current.overflowProtection) {
          addEvent('PROTECCIÓN', 'info', 'Protección de sobrellenado desactivada: Nivel por debajo de capacidad máxima.', newTime);
        }

        if (cavitation && !lastAlarmsRef.current.cavitationProtection) {
          addEvent(
            'PROTECCIÓN',
            'warning',
            'Protección de cavitación activada: Estanque vacío. Caudal de salida limitado a disponibilidad.',
            newTime
          );
        } else if (!cavitation && lastAlarmsRef.current.cavitationProtection) {
          addEvent('PROTECCIÓN', 'info', 'Protección de cavitación restablecida: Existe volumen disponible para drenaje.', newTime);
        }

        // Threshold Alarms
        const isLow = newLvl <= p.lowAlarmPct;
        const isHigh = newLvl >= p.highAlarmPct;

        if (isLow && !lastAlarmsRef.current.lowLevel) {
          addEvent('ALARMA', 'warning', `Alarma de Nivel Bajo activada (Nivel ${newLvl.toFixed(1)}% <= ${p.lowAlarmPct}%).`, newTime);
        } else if (!isLow && lastAlarmsRef.current.lowLevel) {
          addEvent('ALARMA', 'success', `Alarma de Nivel Bajo normalizada (Nivel ${newLvl.toFixed(1)}% > ${p.lowAlarmPct}%).`, newTime);
        }

        if (isHigh && !lastAlarmsRef.current.highLevel) {
          addEvent('ALARMA', 'warning', `Alarma de Nivel Alto activada (Nivel ${newLvl.toFixed(1)}% >= ${p.highAlarmPct}%).`, newTime);
        } else if (!isHigh && lastAlarmsRef.current.highLevel) {
          addEvent('ALARMA', 'success', `Alarma de Nivel Alto normalizada (Nivel ${newLvl.toFixed(1)}% < ${p.highAlarmPct}%).`, newTime);
        }

        lastAlarmsRef.current = {
          lowLevel: isLow,
          highLevel: isHigh,
          overflowProtection: overflow,
          cavitationProtection: cavitation
        };

        // Estimated Time to Target (Umbral de apagado o target de secuencia)
        const targetVol = seqStatus.isActive
          ? seqStatus.targetVolume
          : p.capacity * (p.offThresholdPct / 100);

        let estTimeMin: number | null = null;
        if (pump === 'ON' && net > 0 && newVol < targetVol) {
          estTimeMin = (targetVol - newVol) / net;
        }

        const nextState: SimulationState = {
          timeSeconds: newTime,
          volume: newVol,
          levelPct: newLvl,
          effectiveInletFlow: effInlet,
          effectiveOutletFlow: effOutlet,
          netFlow: net,
          pumpState: pump,
          controlMode: currentMode,
          pumpCommandSource: pumpSource,
          alarms: {
            lowLevel: isLow,
            highLevel: isHigh,
            overflowProtection: overflow,
            cavitationProtection: cavitation
          },
          estimatedTimeToOffMinutes: estTimeMin,
          targetVolume: targetVol,
          isRunning: true,
          speedMultiplier: speed
        };

        setSimState(nextState);

        // Record history sample at regular intervals (every ~1.0 simulated second)
        if (newTime - lastSampleTimeRef.current >= 1.0) {
          lastSampleTimeRef.current = newTime;
          const activeAlarmsList: string[] = [];
          if (isLow) activeAlarmsList.push('NIVEL BAJO');
          if (isHigh) activeAlarmsList.push('NIVEL ALTO');
          if (overflow) activeAlarmsList.push('SOBRELLENADO');
          if (cavitation) activeAlarmsList.push('VACÍO');

          const point: HistoryPoint = {
            timeSeconds: newTime,
            timeFormatted: formatSimulatedTime(newTime),
            levelPct: newLvl,
            volume: newVol,
            effectiveInletFlow: effInlet,
            effectiveOutletFlow: effOutlet,
            netFlow: net,
            pumpState: pump,
            controlMode: currentMode,
            activeAlarms: activeAlarmsList
          };

          setHistory((prev) => [...prev, point].slice(-500));
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [addEvent]);

  // Controls
  const startSimulation = useCallback(() => {
    setIsRunning(true);
    addEvent('CONTROL', 'info', 'Simulación iniciada/reanudada.');
  }, [addEvent]);

  const pauseSimulation = useCallback(() => {
    setIsRunning(false);
    addEvent('CONTROL', 'info', 'Simulación pausada. Evolución temporal congelada.');
  }, [addEvent]);

  const resetSimulation = useCallback((overrideParams?: Partial<SimulationParams>) => {
    setIsRunning(false);
    stage2HoldStartRef.current = null;
    const p = { ...paramsRef.current, ...(overrideParams || {}) };
    setParams(p);
    paramsRef.current = p;

    const initVol = p.initialVolume;
    const cap = p.capacity;
    const lvl = (initVol / cap) * 100;
    const initialPump: PumpState = lvl <= p.onThresholdPct ? 'ON' : 'OFF';

    const effInlet = initialPump === 'ON' ? p.inletFlowNominal : 0;
    const effOutlet = p.outletFlowNominal;
    const net = effInlet - effOutlet;
    const targetVol = cap * (p.offThresholdPct / 100);

    const isLow = lvl <= p.lowAlarmPct;
    const isHigh = lvl >= p.highAlarmPct;

    lastAlarmsRef.current = {
      lowLevel: isLow,
      highLevel: isHigh,
      overflowProtection: false,
      cavitationProtection: false
    };
    lastSampleTimeRef.current = 0;

    const resetState: SimulationState = {
      timeSeconds: 0,
      volume: initVol,
      levelPct: lvl,
      effectiveInletFlow: effInlet,
      effectiveOutletFlow: effOutlet,
      netFlow: net,
      pumpState: initialPump,
      controlMode: controlModeRef.current,
      pumpCommandSource: 'AUTO',
      alarms: {
        lowLevel: isLow,
        highLevel: isHigh,
        overflowProtection: false,
        cavitationProtection: false
      },
      estimatedTimeToOffMinutes:
        initialPump === 'ON' && net > 0 && initVol < targetVol
          ? (targetVol - initVol) / net
          : null,
      targetVolume: targetVol,
      isRunning: false,
      speedMultiplier: speedRef.current
    };

    setSimState(resetState);

    const activeList: string[] = [];
    if (isLow) activeList.push('NIVEL BAJO');
    if (isHigh) activeList.push('NIVEL ALTO');

    setHistory([
      {
        timeSeconds: 0,
        timeFormatted: '00:00',
        levelPct: lvl,
        volume: initVol,
        effectiveInletFlow: effInlet,
        effectiveOutletFlow: effOutlet,
        netFlow: net,
        pumpState: initialPump,
        controlMode: controlModeRef.current,
        activeAlarms: activeList
      }
    ]);

    addEvent(
      'CONTROL',
      'info',
      `Simulación reiniciada a condiciones iniciales (Volumen: ${initVol} L, Nivel: ${lvl.toFixed(1)}%).`,
      0
    );
  }, [addEvent]);

  // Automated Sequence Controls
  const startSequence = useCallback((customConfig?: Partial<AutomatedSequenceConfig>) => {
    const mergedCfg = { ...sequenceConfigRef.current, ...(customConfig || {}) };
    setSequenceConfig(mergedCfg);
    sequenceConfigRef.current = mergedCfg;

    // Start with 500 L initial volume, filling to 800 L
    const p: SimulationParams = {
      ...paramsRef.current,
      initialVolume: 500,
      inletFlowNominal: mergedCfg.stage1InletFlow,
      outletFlowNominal: mergedCfg.stage1OutletFlow
    };
    setParams(p);
    paramsRef.current = p;

    stage2HoldStartRef.current = null;
    resetSimulation(p);

    const initialStatus: AutomatedSequenceStatus = {
      isActive: true,
      stage: 'STAGE_1_FILL_800',
      stageNumber: 1,
      stageTitle: 'Etapa 1: Llenado a 800 Litros',
      stageDescription: 'Bomba P-101 activa (+90 L/min neto). Llenando hacia 800 L (80% de capacidad).',
      targetVolume: mergedCfg.stage1TargetVolume,
      targetPct: (mergedCfg.stage1TargetVolume / p.capacity) * 100,
      stageElapsedSeconds: 0,
      stageRemainingSeconds: ((mergedCfg.stage1TargetVolume - 500) / (mergedCfg.stage1InletFlow - mergedCfg.stage1OutletFlow)) * 60,
      progressPct: (500 / mergedCfg.stage1TargetVolume) * 100,
      isHolding: false
    };

    setSequenceStatus(initialStatus);
    sequenceStatusRef.current = initialStatus;

    setIsRunning(true);
    addEvent(
      'CONTROL',
      'info',
      'Secuencia Programada iniciada: 1) Llenar a 800 L → 2) A los 3:00 min bajar a 300 L → 3) Tras 1 min bajar a <25% (200 L).'
    );
  }, [resetSimulation, addEvent]);

  const stopSequence = useCallback(() => {
    setSequenceStatus((prev) => ({
      ...prev,
      isActive: false,
      stage: 'IDLE',
      stageNumber: 0,
      stageTitle: 'Secuencia Desactivada',
      stageDescription: 'Secuencia detenida. El simulador continuará en modo ordinario.',
      isHolding: false
    }));
    sequenceStatusRef.current = {
      ...sequenceStatusRef.current,
      isActive: false,
      stage: 'IDLE',
      stageNumber: 0,
      isHolding: false
    };
    addEvent('CONTROL', 'warning', 'Secuencia programada cancelada por el operador.');
  }, [addEvent]);

  const updateSequenceConfig = useCallback((newPartial: Partial<AutomatedSequenceConfig>) => {
    const updated = { ...sequenceConfigRef.current, ...newPartial };
    setSequenceConfig(updated);
    sequenceConfigRef.current = updated;
    addEvent('PARÁMETRO', 'info', 'Configuración de secuencia programada actualizada.');
  }, [addEvent]);

  // Mode change
  const setMode = useCallback((mode: ControlMode) => {
    if (sequenceStatusRef.current.isActive) {
      stopSequence();
    }
    setControlMode(mode);
    controlModeRef.current = mode;
    addEvent(
      'MODO',
      'info',
      `Modo de operación cambiado a: ${mode === 'AUTO' ? 'AUTOMÁTICO' : 'MANUAL'}.`
    );

    if (mode === 'AUTO') {
      const p = paramsRef.current;
      const s = stateRef.current;
      let newPump = s.pumpState;

      if (s.levelPct <= p.onThresholdPct) {
        newPump = 'ON';
        addEvent('BOMBA', 'info', `Evaluación inmediata en Auto: Nivel (${s.levelPct.toFixed(1)}%) <= Umbral ON (${p.onThresholdPct}%). Bomba ENCENDIDA.`);
      } else if (s.levelPct >= p.offThresholdPct) {
        newPump = 'OFF';
        addEvent('BOMBA', 'info', `Evaluación inmediata en Auto: Nivel (${s.levelPct.toFixed(1)}%) >= Umbral OFF (${p.offThresholdPct}%). Bomba APAGADA.`);
      } else {
        addEvent('CONTROL', 'info', `Nivel (${s.levelPct.toFixed(1)}%) en zona de histéresis [${p.onThresholdPct}% - ${p.offThresholdPct}%]. Se preserva estado de bomba (${newPump}).`);
      }

      const effInlet = newPump === 'ON' ? (s.volume >= p.capacity ? 0 : p.inletFlowNominal) : 0;
      const net = effInlet - s.effectiveOutletFlow;
      const targetVol = p.capacity * (p.offThresholdPct / 100);

      setSimState((prev) => ({
        ...prev,
        controlMode: 'AUTO',
        pumpState: newPump,
        pumpCommandSource: 'AUTO',
        effectiveInletFlow: effInlet,
        netFlow: net,
        estimatedTimeToOffMinutes: newPump === 'ON' && net > 0 && s.volume < targetVol ? (targetVol - s.volume) / net : null
      }));
    } else {
      setSimState((prev) => ({
        ...prev,
        controlMode: 'MANUAL'
      }));
    }
  }, [addEvent, stopSequence]);

  // Manual pump control
  const manualSetPump = useCallback((newState: PumpState) => {
    if (controlModeRef.current !== 'MANUAL') return;
    if (sequenceStatusRef.current.isActive) {
      stopSequence();
    }
    const p = paramsRef.current;
    const s = stateRef.current;

    if (newState === 'ON' && s.volume >= p.capacity) {
      addEvent('PROTECCIÓN', 'warning', 'Acción manual rechazada: Estanque al 100% de capacidad.');
      return;
    }

    const effInlet = newState === 'ON' ? p.inletFlowNominal : 0;
    const net = effInlet - s.effectiveOutletFlow;
    const targetVol = p.capacity * (p.offThresholdPct / 100);

    addEvent(
      'BOMBA',
      'info',
      `Comando MANUAL del Operador: Bomba ${newState === 'ON' ? 'ENCENDIDA' : 'APAGADA'}.`
    );

    setSimState((prev) => ({
      ...prev,
      pumpState: newState,
      pumpCommandSource: 'MANUAL',
      effectiveInletFlow: effInlet,
      netFlow: net,
      estimatedTimeToOffMinutes: newState === 'ON' && net > 0 && s.volume < targetVol ? (targetVol - s.volume) / net : null
    }));
  }, [addEvent, stopSequence]);

  // Change simulation speed
  const changeSpeed = useCallback((speed: number) => {
    setSpeedMultiplier(speed);
    speedRef.current = speed;
    addEvent('CONTROL', 'info', `Velocidad de simulación ajustada a ${speed}×.`);
  }, [addEvent]);

  // Parameter update
  const updateParameters = useCallback((newPartial: Partial<SimulationParams>): { success: boolean; error?: string } => {
    const current = paramsRef.current;
    const candidate: SimulationParams = { ...current, ...newPartial };

    if (candidate.capacity <= 0 || isNaN(candidate.capacity)) {
      return { success: false, error: 'La capacidad del estanque debe ser un número estrictamente mayor que cero (ej. 1.000 L).' };
    }
    if (candidate.inletFlowNominal < 0 || isNaN(candidate.inletFlowNominal)) {
      return { success: false, error: 'El caudal de entrada nominal no puede ser negativo (mínimo 0 L/min).' };
    }
    if (candidate.outletFlowNominal < 0 || isNaN(candidate.outletFlowNominal)) {
      return { success: false, error: 'El caudal de salida solicitado no puede ser negativo (mínimo 0 L/min).' };
    }
    if (candidate.initialVolume < 0 || candidate.initialVolume > candidate.capacity || isNaN(candidate.initialVolume)) {
      return {
        success: false,
        error: `El volumen inicial (${candidate.initialVolume} L) debe estar entre 0 y la capacidad máxima (${candidate.capacity} L).`
      };
    }
    if (candidate.onThresholdPct < 0 || candidate.onThresholdPct > 100 || isNaN(candidate.onThresholdPct)) {
      return { success: false, error: 'El umbral de encendido debe estar en el rango de 0 % a 100 %.' };
    }
    if (candidate.offThresholdPct < 0 || candidate.offThresholdPct > 100 || isNaN(candidate.offThresholdPct)) {
      return { success: false, error: 'El umbral de apagado debe estar en el rango de 0 % a 100 %.' };
    }
    if (candidate.onThresholdPct >= candidate.offThresholdPct) {
      return {
        success: false,
        error: `El umbral de encendido (${candidate.onThresholdPct}%) debe ser estrictamente menor que el umbral de apagado (${candidate.offThresholdPct}%) para mantener la histéresis.`
      };
    }
    if (candidate.lowAlarmPct < 0 || candidate.lowAlarmPct > 100 || isNaN(candidate.lowAlarmPct)) {
      return { success: false, error: 'La alarma de nivel bajo debe estar entre 0 % a 100 %.' };
    }
    if (candidate.highAlarmPct < 0 || candidate.highAlarmPct > 100 || isNaN(candidate.highAlarmPct)) {
      return { success: false, error: 'La alarma de nivel alto debe estar entre 0 % a 100 %.' };
    }
    if (candidate.lowAlarmPct >= candidate.highAlarmPct) {
      return {
        success: false,
        error: `La alarma de nivel bajo (${candidate.lowAlarmPct}%) debe ser menor que la alarma de nivel alto (${candidate.highAlarmPct}%).`
      };
    }

    if (
      (newPartial.capacity !== undefined && newPartial.capacity !== current.capacity) ||
      (newPartial.initialVolume !== undefined && newPartial.initialVolume !== current.initialVolume)
    ) {
      if (isRunningRef.current) {
        return {
          success: false,
          error: 'La capacidad y el volumen inicial solo se pueden modificar con la simulación detenida/pausada.'
        };
      }
    }

    setParams(candidate);
    paramsRef.current = candidate;

    const s = stateRef.current;
    const targetVol = candidate.capacity * (candidate.offThresholdPct / 100);
    const effInlet = s.pumpState === 'ON' ? (s.volume >= candidate.capacity ? 0 : candidate.inletFlowNominal) : 0;
    const effOutlet = s.volume <= 0 ? 0 : candidate.outletFlowNominal;
    const net = effInlet - effOutlet;

    setSimState((prev) => ({
      ...prev,
      targetVolume: targetVol,
      effectiveInletFlow: effInlet,
      effectiveOutletFlow: effOutlet,
      netFlow: net,
      estimatedTimeToOffMinutes: prev.pumpState === 'ON' && net > 0 && prev.volume < targetVol ? (targetVol - prev.volume) / net : null
    }));

    addEvent('PARÁMETRO', 'info', 'Parámetros del proceso actualizados y validados correctamente.');
    return { success: true };
  }, [addEvent]);

  // Load a scenario
  const loadScenario = useCallback((preset: ScenarioPreset) => {
    if (preset.isSequence || preset.id === 'user_sequence_800_300_25') {
      startSequence();
      return;
    }
    stopSequence();
    setIsRunning(false);
    const newVol = preset.initialVolume !== undefined ? preset.initialVolume : paramsRef.current.initialVolume;

    const newParams: SimulationParams = {
      ...paramsRef.current,
      inletFlowNominal: preset.inletFlow,
      outletFlowNominal: preset.outletFlow,
      initialVolume: newVol
    };

    setParams(newParams);
    paramsRef.current = newParams;

    resetSimulation(newParams);
    addEvent('CONTROL', 'info', `Escenario cargado: "${preset.title}". Registros y gráficos reiniciados.`);
  }, [resetSimulation, addEvent, startSequence, stopSequence]);

  return {
    params,
    state: simState,
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
  };
}
