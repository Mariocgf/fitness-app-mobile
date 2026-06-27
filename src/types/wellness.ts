// Tipos del módulo de Bienestar (Wellness): Sueño, Hidratación, Ánimo y Meditación.
// Contrato: docs/wellness-api-frontend-contract.md
// IMPORTANTE: a diferencia del módulo clínico (enums numéricos), acá los enums se
// serializan como STRINGS exactos ("Good", "Water", etc.); el backend los valida así.

// ─── Enums (uniones de literales string) ─────────────────────────────────────

/** Calidad del sueño. */
export type SleepQuality = "VeryPoor" | "Poor" | "Fair" | "Good" | "Excellent";

/** Nivel de ánimo (también usado en moodBefore/moodAfter de meditación). */
export type MoodLevel = "VeryBad" | "Bad" | "Neutral" | "Good" | "VeryGood";

/** Tipo de bebida en un registro de hidratación. */
export type BeverageType = "Water" | "Tea" | "Coffee" | "Infusion" | "Other";

/** Técnica de meditación. */
export type MeditationTechnique =
  | "Mindfulness"
  | "Breathing"
  | "BodyScan"
  | "LovingKindness"
  | "Guided"
  | "Other";

// ─── Paginación genérica ─────────────────────────────────────────────────────

/** Respuesta paginada estándar de los listados de wellness (descendente por fecha). */
export interface PagedResponseDto<T> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: T[];
}

/** Parámetros de query comunes a todos los listados paginados. */
export interface WellnessQueryParams {
  page?: number;
  pageSize?: number;
}

// ─── Sueño ───────────────────────────────────────────────────────────────────

/** DTO de un registro de sueño (POST/GET /api/sleep). */
export interface SleepLogDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  durationMinutes: number;
  quality: SleepQuality;
  note: string | null;
}

/** Payload de POST /api/sleep. durationMinutes entre 1 y 720; note máx 500. */
export interface AddSleepLogDto {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  quality: SleepQuality;
  note?: string | null;
}

// ─── Hidratación ─────────────────────────────────────────────────────────────

/** DTO de un registro de hidratación (POST/GET /api/hydration). */
export interface HydrationLogDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  amountMl: number;
  beverageType: BeverageType;
}

/** Payload de POST /api/hydration. amountMl entre 1 y 10000. */
export interface AddHydrationLogDto {
  date: string; // YYYY-MM-DD
  amountMl: number;
  beverageType: BeverageType;
}

// ─── Ánimo ───────────────────────────────────────────────────────────────────

/** DTO de un registro de ánimo (POST/GET /api/mood). */
export interface MoodLogDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  mood: MoodLevel;
  note: string | null;
}

/** Payload de POST /api/mood. note máx 500. */
export interface AddMoodLogDto {
  date: string; // YYYY-MM-DD
  mood: MoodLevel;
  note?: string | null;
}

// ─── Meditación ──────────────────────────────────────────────────────────────

/** DTO de una guía del catálogo de meditación (GET /api/meditation/guides). */
export interface MeditationGuideDto {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  technique: MeditationTechnique;
  audioUrl: string; // puede venir vacío
  imageUrl: string | null;
}

/** DTO de una sesión de meditación del usuario (POST/GET /api/meditation). */
export interface MeditationSessionDto {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  capturedAt: string; // ISO 8601 UTC
  durationMinutes: number;
  technique: MeditationTechnique;
  guideId: string | null;
  moodBefore: MoodLevel | null;
  moodAfter: MoodLevel | null;
  note: string | null;
}

/** Payload de POST /api/meditation. durationMinutes entre 1 y 600; note máx 500. */
export interface AddMeditationSessionDto {
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  technique: MeditationTechnique;
  guideId?: string | null;
  moodBefore?: MoodLevel | null;
  moodAfter?: MoodLevel | null;
  note?: string | null;
}

// ─── Modelos de UI (derivados para el dashboard de Bienestar) ────────────────

/** Identifica de qué feature proviene una entrada en "Actividad reciente". */
export type WellnessKind = "sleep" | "hydration" | "mood" | "meditation";

/**
 * Entrada normalizada para "Actividad reciente": unión discriminada por `kind`
 * que conserva el DTO original para renderizar sin volver a pedir datos.
 */
export type WellnessActivityItem =
  | { kind: "sleep"; id: string; capturedAt: string; date: string; data: SleepLogDto }
  | {
      kind: "hydration";
      id: string;
      capturedAt: string;
      date: string;
      data: HydrationLogDto;
    }
  | { kind: "mood"; id: string; capturedAt: string; date: string; data: MoodLogDto }
  | {
      kind: "meditation";
      id: string;
      capturedAt: string;
      date: string;
      data: MeditationSessionDto;
    };

/** Resumen "Hoy" del dashboard de Bienestar: lo registrado en la fecha actual. */
export interface WellnessTodaySummary {
  /** Último registro de sueño de hoy, o null si no hay. */
  sleep: SleepLogDto | null;
  /** Suma de ml de hidratación registrados hoy. */
  hydrationMl: number;
  /** Último registro de ánimo de hoy, o null si no hay. */
  mood: MoodLogDto | null;
  /** Suma de minutos de meditación registrados hoy. */
  meditationMinutes: number;
}
