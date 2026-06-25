// Tipos del módulo de Datos Clínicos.
// Contrato: docs/clinical-data-frontend-guide.md
// IMPORTANTE: los enums se serializan como NÚMEROS (no strings), igual que el resto de la API.

/** Grupo sanguíneo. A=0, B=1, AB=2, O=3 (ver guía §4). */
export type BloodType = 0 | 1 | 2 | 3;

/** Factor Rh. Positivo (+)=0, Negativo (−)=1 (ver guía §4). */
export type RhFactor = 0 | 1;

/** Mapa de grupo sanguíneo a label legible. */
export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  0: "A",
  1: "B",
  2: "AB",
  3: "O",
};

/** Mapa de factor Rh a label legible. */
export const RH_LABELS: Record<RhFactor, string> = {
  0: "+",
  1: "−",
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
