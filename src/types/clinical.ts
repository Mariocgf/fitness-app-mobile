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

/**
 * DTO del perfil clínico tal como lo devuelve el backend (GET/PUT /profile).
 *
 * Declaraciones (`hasX`): qué parámetros declara tener el usuario. Default OFF.
 * Consentimientos (`allowAiX`): por parámetro, bajo el master `allowAiUsage`.
 * Un parámetro llega a la IA solo si: `allowAiUsage` && `allowAiX` && `hasX`.
 */
export interface ClinicalProfileDto {
  bloodType: BloodType | null;
  rhFactor: RhFactor | null;
  // Parámetros declarados (opt-in, default OFF)
  hasGlucose: boolean;
  hasTotalCholesterol: boolean;
  hasHdl: boolean;
  hasLdl: boolean;
  hasTriglycerides: boolean;
  // Consentimiento de IA: master + por parámetro (default OFF)
  allowAiUsage: boolean;
  allowAiGlucose: boolean;
  allowAiTotalCholesterol: boolean;
  allowAiHdl: boolean;
  allowAiLdl: boolean;
  allowAiTriglycerides: boolean;
}

/**
 * Payload de PUT /profile. Actualiza grupo sanguíneo, Rh y qué parámetros declara
 * tener el usuario. NO toca consentimientos: eso se maneja en PUT /ai-consent.
 */
export interface ClinicalProfilePayload {
  bloodType?: BloodType | null;
  rhFactor?: RhFactor | null;
  hasGlucose: boolean;
  hasTotalCholesterol: boolean;
  hasHdl: boolean;
  hasLdl: boolean;
  hasTriglycerides: boolean;
}

/**
 * Payload de PUT /ai-consent (SetClinicalAiConsentDto). Master switch + consentimiento
 * por parámetro. Se envía el estado final completo, no incremental.
 */
export interface AiConsentPayload {
  enabled: boolean; // master switch (allowAiUsage)
  glucose: boolean;
  totalCholesterol: boolean;
  hdl: boolean;
  ldl: boolean;
  triglycerides: boolean;
}

// ─── Metadatos de parámetros clínicos ────────────────────────────────────────

/** Claves de declaración (`hasX`) del perfil clínico. */
export type ClinicalHasKey =
  | "hasGlucose"
  | "hasTotalCholesterol"
  | "hasHdl"
  | "hasLdl"
  | "hasTriglycerides";

/** Claves de consentimiento por parámetro (`allowAiX`) del perfil clínico. */
export type ClinicalAllowKey =
  | "allowAiGlucose"
  | "allowAiTotalCholesterol"
  | "allowAiHdl"
  | "allowAiLdl"
  | "allowAiTriglycerides";

/** Descriptor de un parámetro clínico: enlaza declaración, consentimiento y label. */
export interface ClinicalParamMeta {
  /** Clave del consentimiento en AiConsentPayload (glucose, totalCholesterol, …). */
  consentKey: keyof Omit<AiConsentPayload, "enabled">;
  /** Flag de declaración en el perfil (hasGlucose, …). */
  hasKey: ClinicalHasKey;
  /** Flag de consentimiento por parámetro en el perfil (allowAiGlucose, …). */
  allowKey: ClinicalAllowKey;
  /** Label para la UI. */
  label: string;
}

/**
 * Lista canónica de parámetros clínicos. Una sola fuente de verdad para iterar
 * las secciones de "Parámetros declarados" y "Consentimiento por parámetro".
 */
export const CLINICAL_PARAMS: ClinicalParamMeta[] = [
  {
    consentKey: "glucose",
    hasKey: "hasGlucose",
    allowKey: "allowAiGlucose",
    label: "Glucosa",
  },
  {
    consentKey: "totalCholesterol",
    hasKey: "hasTotalCholesterol",
    allowKey: "allowAiTotalCholesterol",
    label: "Colesterol total",
  },
  {
    consentKey: "hdl",
    hasKey: "hasHdl",
    allowKey: "allowAiHdl",
    label: "HDL",
  },
  {
    consentKey: "ldl",
    hasKey: "hasLdl",
    allowKey: "allowAiLdl",
    label: "LDL",
  },
  {
    consentKey: "triglycerides",
    hasKey: "hasTriglycerides",
    allowKey: "allowAiTriglycerides",
    label: "Triglicéridos",
  },
];

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
