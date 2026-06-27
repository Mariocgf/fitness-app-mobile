// Tipos del módulo de Datos Clínicos.
// Contrato: docs/clinical-data-frontend-guide.md
// IMPORTANTE: este endpoint serializa los enums clínicos como STRINGS
// (ej. "A", "Positive"), no como números. Los tipos reflejan ese contrato real.

/** Grupo sanguíneo, tal como lo serializa el backend. */
export type BloodType = "A" | "B" | "AB" | "O";

/** Factor Rh, tal como lo serializa el backend. */
export type RhFactor = "Positive" | "Negative";

/** Mapa de grupo sanguíneo a label legible. */
export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
};

/** Mapa de factor Rh a label legible. */
export const RH_LABELS: Record<RhFactor, string> = {
  Positive: "+",
  Negative: "−",
};

// ─── Perfil clínico ──────────────────────────────────────────────────────────

/** DTO del perfil clínico tal como lo devuelve el backend (GET/PUT /profile). */
export interface ClinicalProfileDto {
  bloodType: BloodType | null;
  rhFactor: RhFactor | null;
  hasGlucose: boolean;
  hasDyslipidemia: boolean;
  allowAiUsage: boolean;
}

/**
 * Payload de PUT /profile. Actualiza grupo sanguíneo, Rh y flags.
 * NO incluye allowAiUsage: eso se maneja aparte en PUT /ai-consent.
 */
export interface ClinicalProfilePayload {
  bloodType?: BloodType | null;
  rhFactor?: RhFactor | null;
  hasGlucose: boolean;
  hasDyslipidemia: boolean;
}

/** Payload de PUT /ai-consent. Activa o desactiva el consentimiento de IA. */
export interface AiConsentPayload {
  enabled: boolean;
}

// ─── Lecturas clínicas ───────────────────────────────────────────────────────

/** DTO de una lectura clínica. Todos los valores pueden ser null (campos opcionales). */
export interface ClinicalReadingDto {
  id: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  glucoseMgDl: number | null;
  totalCholesterolMgDl: number | null;
  hdlMgDl: number | null;
  ldlMgDl: number | null;
  triglyceridesMgDl: number | null;
}

/**
 * Payload de POST /readings. Todos los campos son opcionales: se manda solo lo cargado.
 * Los valores deben ser > 0 (un 0 o negativo devuelve 400).
 */
export interface ClinicalReadingPayload {
  date?: string; // YYYY-MM-DD; si se omite el backend usa la fecha de hoy (UTC)
  glucoseMgDl?: number;
  totalCholesterolMgDl?: number;
  hdlMgDl?: number;
  ldlMgDl?: number;
  triglyceridesMgDl?: number;
}

/** Respuesta paginada del endpoint GET /api/clinical/readings */
export interface PagedClinicalReadingsResponseDto {
  page: number;
  pageSize: number;
  totalCount: number;
  items: ClinicalReadingDto[];
}
