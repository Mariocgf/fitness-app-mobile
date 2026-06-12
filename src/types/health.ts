export interface HealthItem {
  id: string;
  name: string;
  severity: "Low" | "Medium" | "High";
}

export type Injury = HealthItem;
export type MedicalCondition = HealthItem;

export interface HealthProfilePayload {
  injuryIds: string[];
  medicalConditionIds: string[];
}

/** Payload para registrar una medición corporal. Todos los campos son opcionales. */
export interface BodyMeasurementPayload {
  date?: string; // YYYY-MM-DD; si se omite el servidor usa la fecha actual
  weightKg?: number;
  waistCm?: number;
  neckCm?: number;
  hipCm?: number;
  chestCm?: number;
  armCm?: number;
  forearmCm?: number;
  thighCm?: number;
  calfCm?: number;
}

/** Respuesta paginada del endpoint GET /api/health/body-measurements */
export interface PagedBodyMeasurementsResponseDto {
  page: number;
  pageSize: number;
  totalCount: number;
  items: BodyMeasurementDto[];
}

/** DTO de una medición corporal tal como la devuelve el backend */
export interface BodyMeasurementDto {
  id: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  weightKg: number | null;
  waistCm: number | null;
  neckCm: number | null;
  hipCm: number | null;
  chestCm: number | null;
  armCm: number | null;
  forearmCm: number | null;
  thighCm: number | null;
  calfCm: number | null;
  /** % de grasa corporal calculado por el servidor (fórmula Marina EE.UU.). null si no hay datos suficientes. */
  bodyFatPercentage: number | null;
  /** Masa magra en kg calculada por el servidor. null si no hay datos suficientes. */
  leanMassKg: number | null;
}

/** Diferencia calculada entre dos mediciones para una métrica específica */
export interface MeasurementMetricDelta {
  key: keyof BodyMeasurementDto;
  label: string;
  unit: string;
  baseValue: number;
  targetValue: number;
  diff: number;
  /** null si baseValue es 0 (evita división por cero) */
  percentChange: number | null;
  direction: 'up' | 'down' | 'same';
}

/** Resultado de comparar dos mediciones: ambos registros + array de deltas por métrica */
export interface MeasurementComparison {
  base: BodyMeasurementDto;
  target: BodyMeasurementDto;
  /** Solo incluye métricas con valor no-null en ambos registros */
  deltas: MeasurementMetricDelta[];
}
