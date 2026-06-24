import { ExerciseLoadType } from '../utils/format.utils';

export type RepType = 'Fixed' | 'Range' | 'Timed';

export interface RoutineExercise {
  id: string;
  exerciseId: string;
  order: string;
  name: string;
  gifUrl: string | null;
  sets: string;
  repType: RepType;
  minRep: string | null;
  maxRep: string | null;
  currentRep: string | null;
  durationSeconds: string | null;
  rest: string;
  loadType: ExerciseLoadType | null;
  plannedWeightKg: number | null;
  primaryMuscleGroup: string | null;
}

export interface RoutineDay {
  id: string;
  day: string; // e.g. "Día 1 - Pecho & Hombros"
  approxTimeSession: string; // e.g. "45 min aprox."
  exercises: RoutineExercise[];
}

export type RoutineSource = 'AI' | 'Manual';

export interface Routine {
  id: string;
  name: string; // e.g. "Fuerza Pro - Nivel Intermedio"
  createdAt: string;
  source: RoutineSource;
  isActive: boolean; // rutina activa del usuario (NO la versión, ver versionado abajo)
  days: RoutineDay[];
  // ── Versionado ──────────────────────────────────────────────────────────
  // El backend ya devuelve estos campos en GET /api/routine/{id} y /active-routine.
  // Opcionales para degradar sin romper si una respuesta vieja todavía no los trae.
  /** Versión cuyo contenido está en days[] (la que se usa ahora). */
  activeVersionId?: string | null;
  /** Última versión creada (puede diferir de activeVersionId). */
  latestVersionId?: string | null;
  /** Número de la versión activa mostrada (v1, v2, ...). */
  versionNumber?: number | null;
}

/* ──────────────────────────── Versionado de rutinas ─────────────────────── */

/** Metadata de una versión en el historial (sin el contenido de days[]). */
export interface RoutineVersionSummary {
  id: string;
  versionNumber: number;
  isActive: boolean;
  isLatest: boolean;
  basedOnVersionId: string | null;
  changeReason: string | null;
  createdAt: string; // ISO
}

/** Respuesta de GET /{routineId}/versions — historial completo. */
export interface RoutineVersionsResponse {
  routineId: string;
  name: string;
  activeVersionId: string | null;
  latestVersionId: string | null;
  versions: RoutineVersionSummary[]; // ordenadas de la más nueva a la más vieja
}

/**
 * Contenido completo de una versión. Reusa RoutineDay/RoutineExercise: el backend
 * documenta "el mismo shape de days[]/exercises[] que devuelve GET /api/routine/{id}".
 */
export interface RoutineVersionDetail {
  id: string;
  routineId: string;
  versionNumber: number;
  isActive: boolean;
  basedOnVersionId: string | null;
  changeReason: string | null;
  createdAt: string;
  days: RoutineDay[];
}

/* ──────────────────────────── Swap exercises ─────────────────────────────── */

export type WarningLevel = 'High' | 'Medium' | 'Low';

export interface HealthWarning {
  condition: string;
  severity: string;
  message: string;
}

export interface SwapCandidate {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  /** Score informativo (0-10). */
  score: number;
}

export interface SwapSuggestionItem {
  replaces: {
    routineExerciseId: string;
    exerciseId: string;
    exerciseName: string;
  };
  candidates: SwapCandidate[];
}

export interface SwapSuggestionsResponse {
  hasHealthWarning: boolean;
  warningLevel: WarningLevel | null;
  warnings: HealthWarning[];
  suggestions: SwapSuggestionItem[];
}

export interface SwapPick {
  routineExerciseId: string;
  newExerciseId: string;
}

/* ──────────────────────────── Listado de Rutinas ─────────────────────────── */

/** Resumen de rutina para listados (sin detalle de ejercicios) */
export interface RoutineSummary {
  id: string;
  name: string;
  source: RoutineSource;
  isActive: boolean;
  dayCount: number;
  createdAt: string;
  updatedAt: string | null;
}

/** Respuesta paginada de rutinas del usuario */
export interface PagedRoutinesResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: RoutineSummary[];
}

/** Respuesta del preview de rutinas (5 AI + 5 Manual) */
export interface RoutinePreviewResponse {
  ai: RoutineSummary[];
  manual: RoutineSummary[];
}

/* ──────────────────────────── Adaptación con IA ──────────────────────────── */

export interface AdaptRoutineExercise {
  exerciseId: string;
  name: string;
  gifUrl: string | null;
  targetMuscles: string[];
  order: number;
  sets: number;
  repType: 'Reps' | 'Timed' | string;
  minRep: number | null;
  maxRep: number | null;
  durationSeconds: number | null;
  rest: number;
  loadType: ExerciseLoadType | null;
  plannedWeightKg: number | null;
  primaryMuscleGroup: string | null;
}

export interface AdaptRoutineDay {
  dayOfWeek: string;
  approxTimeSession: number;
  exercises: AdaptRoutineExercise[];
}

export interface AdaptRoutineMotive {
  exerciseId: string;
  exerciseName: string;
  reason: string;
}

export interface AdaptRoutineResponseDto {
  pendingAdaptationId: string | null;
  hasChanges: boolean;
  days: AdaptRoutineDay[];
  motives: AdaptRoutineMotive[];
}

