export interface HealthItem {
  id: string;
  name: string;
  severity: "Low" | "Medium" | "High";
}

export type Injury = HealthItem;
export type MedicalCondition = HealthItem;

/**
 * Condición médica asociada al usuario, con su consentimiento de uso por la IA.
 * Devuelta por GET /api/health/user-medical-conditions. `allowAiUsage` arranca en
 * true por defecto (a la IA va el hecho declarado, nunca un valor numérico).
 */
export interface UserMedicalConditionDto extends HealthItem {
  allowAiUsage: boolean;
}

/** Payload de PUT /api/health/user-medical-conditions/ai-consent (toggle por condición). */
export interface MedicalConditionAiConsentPayload {
  conditionId: string;
  enabled: boolean;
}

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

/** Punto temporal para graficar una métrica corporal. */
export interface BodyMetricPoint {
  date: string;
  value: number;
}

/** Serie de tendencia para una métrica corporal devuelta por el backend. */
export interface BodyMetricTrend {
  metric: string;
  label: string;
  unit: string;
  latestValue: number | null;
  absoluteChange: number | null;
  percentageChange: number | null;
  points: BodyMetricPoint[];
}

/** Dashboard de evolución física listo para renderizar en la vista de Salud. */
export interface BodyEvolutionDashboardDto {
  fromDate: string | null;
  toDate: string | null;
  metrics: BodyMetricTrend[];
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
