export interface SimulationParams {
  capacity: number; // Liters, > 0, default 1000
  initialVolume: number; // Liters, 0 <= initialVolume <= capacity, default 500
  inletFlowNominal: number; // L/min, >= 0, default 40
  outletFlowNominal: number; // L/min, >= 0, default 10
  onThresholdPct: number; // %, 0 <= onThreshold < offThreshold <= 100, default 30
  offThresholdPct: number; // %, 0 <= onThreshold < offThreshold <= 100, default 80
  lowAlarmPct: number; // %, default 20
  highAlarmPct: number; // %, default 90
}

export type ControlMode = 'AUTO' | 'MANUAL';
export type PumpState = 'ON' | 'OFF';
export type PumpCommandSource = 'AUTO' | 'MANUAL' | 'PROTECTION';

export interface AlarmsState {
  lowLevel: boolean;
  highLevel: boolean;
  overflowProtection: boolean;
  cavitationProtection: boolean;
}

export interface SimulationState {
  timeSeconds: number;
  volume: number; // Liters
  levelPct: number; // %
  effectiveInletFlow: number; // L/min
  effectiveOutletFlow: number; // L/min
  netFlow: number; // L/min
  pumpState: PumpState;
  controlMode: ControlMode;
  pumpCommandSource: PumpCommandSource;
  alarms: AlarmsState;
  estimatedTimeToOffMinutes: number | null;
  targetVolume: number;
  isRunning: boolean;
  speedMultiplier: number;
}

export interface HistoryPoint {
  timeSeconds: number;
  timeFormatted: string;
  levelPct: number;
  volume: number;
  effectiveInletFlow: number;
  effectiveOutletFlow: number;
  netFlow: number;
  pumpState: PumpState;
  controlMode: ControlMode;
  activeAlarms: string[];
}

export interface LogEvent {
  id: string;
  timeSeconds: number;
  timeFormatted: string;
  category: 'CONTROL' | 'BOMBA' | 'ALARMA' | 'PARÁMETRO' | 'MODO' | 'PROTECCIÓN';
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
}

export interface ScenarioPreset {
  id: string;
  title: string;
  description: string;
  inletFlow: number;
  outletFlow: number;
  initialVolume?: number;
  badge: string;
  isSequence?: boolean;
}

export type SequenceStage =
  | 'IDLE'
  | 'STAGE_1_FILL_800'
  | 'STAGE_1_HOLD'
  | 'STAGE_2_DRAIN_300'
  | 'STAGE_2_HOLD'
  | 'STAGE_3_DRAIN_SUB25'
  | 'COMPLETED';

export interface AutomatedSequenceConfig {
  stage1TargetVolume: number; // default 800 L
  stage1InletFlow: number; // default 100 L/min for smooth, timely reach
  stage1OutletFlow: number; // default 10 L/min
  stage2TriggerTimeSeconds: number; // default 180s (3 minutes)
  stage2TargetVolume: number; // default 300 L
  stage2OutletFlow: number; // default 80 L/min
  stage3DelaySeconds: number; // default 60s (1 minute after reaching 300L)
  stage3TargetVolume: number; // default 200 L (<25% of 1000L = 250L)
  stage3OutletFlow: number; // default 60 L/min
}

export interface AutomatedSequenceStatus {
  isActive: boolean;
  stage: SequenceStage;
  stageNumber: number; // 0 for idle, 1, 2, 3, 4 (completed)
  stageTitle: string;
  stageDescription: string;
  targetVolume: number;
  targetPct: number;
  stageElapsedSeconds: number;
  stageRemainingSeconds: number | null;
  progressPct: number;
  isHolding: boolean;
}

export const DEFAULT_SEQUENCE_CONFIG: AutomatedSequenceConfig = {
  stage1TargetVolume: 800,
  stage1InletFlow: 100,
  stage1OutletFlow: 10,
  stage2TriggerTimeSeconds: 180, // 3 minutes
  stage2TargetVolume: 300,
  stage2OutletFlow: 80,
  stage3DelaySeconds: 60, // 1 minute
  stage3TargetVolume: 200, // < 25% (20% of 1000L)
  stage3OutletFlow: 60,
};

export const DEFAULT_PARAMS: SimulationParams = {
  capacity: 1000,
  initialVolume: 500,
  inletFlowNominal: 40,
  outletFlowNominal: 10,
  onThresholdPct: 30,
  offThresholdPct: 80,
  lowAlarmPct: 20,
  highAlarmPct: 90,
};

