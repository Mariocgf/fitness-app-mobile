import {
  BodyMeasurementDto,
  MeasurementComparison,
  MeasurementMetricDelta,
} from '../types/health';

/** Definición ordenada de métricas comparables: composición primero, perímetros después */
const METRIC_DEFINITIONS: {
  key: keyof BodyMeasurementDto;
  label: string;
  unit: string;
}[] = [
  { key: 'weightKg', label: 'Peso', unit: 'kg' },
  { key: 'bodyFatPercentage', label: 'Grasa corporal', unit: '%' },
  { key: 'leanMassKg', label: 'Masa magra', unit: 'kg' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm' },
  { key: 'neckCm', label: 'Cuello', unit: 'cm' },
  { key: 'hipCm', label: 'Cadera', unit: 'cm' },
  { key: 'chestCm', label: 'Pecho', unit: 'cm' },
  { key: 'armCm', label: 'Brazo', unit: 'cm' },
  { key: 'forearmCm', label: 'Antebrazo', unit: 'cm' },
  { key: 'thighCm', label: 'Muslo', unit: 'cm' },
  { key: 'calfCm', label: 'Pantorrilla', unit: 'cm' },
];

/** Tolerancia mínima para considerar un cambio significativo (evita "same" con ruido flotante) */
const DIRECTION_THRESHOLD = 0.001;

/**
 * Calcula los deltas entre dos registros de medición.
 * Solo incluye métricas presentes (non-null) en ambos registros.
 * No interpreta si el cambio es positivo o negativo para la salud — eso es dominio del backend.
 */
export function buildMeasurementComparison(
  baseArg: BodyMeasurementDto,
  targetArg: BodyMeasurementDto,
): MeasurementComparison {
  // Orden cronológico: base = más antigua, target = más reciente, para que el diff
  // represente siempre "anterior → actual" sin importar qué registro se abrió primero.
  // (Las fechas son 'YYYY-MM-DD', así que la comparación de strings es válida.)
  const [base, target] =
    baseArg.date <= targetArg.date ? [baseArg, targetArg] : [targetArg, baseArg];

  const deltas: MeasurementMetricDelta[] = [];

  for (const { key, label, unit } of METRIC_DEFINITIONS) {
    const baseRaw = base[key];
    const targetRaw = target[key];

    // Omitir métricas sin datos en cualquiera de los dos registros
    if (baseRaw == null || targetRaw == null) continue;

    const baseValue = baseRaw as number;
    const targetValue = targetRaw as number;
    const diff = targetValue - baseValue;

    const percentChange = baseValue !== 0 ? (diff / baseValue) * 100 : null;

    const direction: MeasurementMetricDelta['direction'] =
      Math.abs(diff) < DIRECTION_THRESHOLD
        ? 'same'
        : diff > 0
          ? 'up'
          : 'down';

    deltas.push({ key, label, unit, baseValue, targetValue, diff, percentChange, direction });
  }

  return { base, target, deltas };
}
