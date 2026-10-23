import { ScenarioPreset } from '../types/simulation';

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'user_sequence_800_300_25',
    title: 'Secuencia: 800L → 3min → 300L → 1min → <25%',
    description: 'Ensayo dinámico solicitado: Llena a 800 L (80%), a los 3 min baja a 300 L (30%), y tras 1 min desciende a menos del 25% (<250 L / 200 L).',
    inletFlow: 100,
    outletFlow: 10,
    initialVolume: 500,
    badge: '★ Secuencia Solicitada',
    isSequence: true
  },
  {
    id: 'normal',
    title: 'Operación Normal',
    description: 'Entrada de 40 L/min y salida de 10 L/min. Caudal neto positivo (+30 L/min). Ciclo estándar de histéresis.',
    inletFlow: 40,
    outletFlow: 10,
    initialVolume: 500,
    badge: 'Caudal Neto: +30 L/min'
  },
  {
    id: 'high_demand',
    title: 'Demanda Elevada',
    description: 'Entrada de 40 L/min y consumo de 60 L/min. El caudal neto es negativo (-20 L/min); el nivel desciende incluso con la bomba encendida.',
    inletFlow: 40,
    outletFlow: 60,
    initialVolume: 500,
    badge: 'Caudal Neto: -20 L/min'
  },
  {
    id: 'zero_consumption',
    title: 'Sin Consumo',
    description: 'Salida de 0 L/min y entrada de 40 L/min. Llenado continuo sin perturbación hasta cortar automáticamente en el umbral del 80%.',
    inletFlow: 40,
    outletFlow: 0,
    initialVolume: 350,
    badge: 'Salida: 0 L/min'
  },
  {
    id: 'low_level_start',
    title: 'Nivel Inicial Bajo',
    description: 'Volumen inicial de 150 L (15%). Demuestra activación inmediata de la alarma de nivel bajo (<= 20%) y encendido automático de la bomba.',
    inletFlow: 40,
    outletFlow: 10,
    initialVolume: 150,
    badge: 'Nivel Inicial: 15%'
  },
  {
    id: 'academic_test',
    title: 'Verificación Académica',
    description: 'Capacidad 1.000 L, volumen inicial 250 L (25%), entrada 40 L/min y salida 10 L/min. El tiempo estimado hasta 800 L (80%) es ~18,3 min.',
    inletFlow: 40,
    outletFlow: 10,
    initialVolume: 250,
    badge: 'Obj: 80% en ~18.3 min'
  }
];
