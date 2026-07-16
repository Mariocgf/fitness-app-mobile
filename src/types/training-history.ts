/** Interfaces del dominio "historial de entrenamiento" — ya mapeadas desde el DTO del backend */

export interface TrainingHistorySet {
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
  durationSeconds: number;
  /**
   * Esfuerzo percibido (1–10), o `null` si el usuario no lo registró.
   * `0` ya no es un valor: la UI tiene que renderizar la ausencia, no un cero.
   */
  rpe: number | null;
  isCompleted: boolean;
}

export interface TrainingHistoryExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEs: string | null;
  gifUrl: string | null;
  targetMuscles: string[];
  /** RPE representativo, derivado de los sets. `null` si ningún set tiene esfuerzo. */
  rpe: number | null;
  sets: TrainingHistorySet[];
}

export interface TrainingHistorySession {
  id: string;
  /** Fecha/hora de la sesión de entrenamiento */
  trainedAt: Date;
  /** Duración total de la sesión en segundos (mapeado desde "HH:mm:ss") */
  totalSeconds: number;
  /** Null en sesiones manuales (sin rutina asociada). */
  routineId: string | null;
  routineName: string;
  /** Versión de la rutina con la que se hizo este entreno (queda clavada). */
  routineVersionId: string | null;
  /** Número de esa versión (v1, v2, ...). Null si el backend no lo registró. */
  routineVersionNumber: number | null;
  exercises: TrainingHistoryExercise[];
}

/** Filtros que acepta el endpoint GET /api/Routine/training-history */
export interface TrainingHistoryFilters {
  fromDate: Date | null;
  toDate: Date | null;
  routineId: string | null;
  targetMuscle: string | null;
}

export interface PagedTrainingHistoryResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: TrainingHistorySession[];
}

/* ── DTO crudo del backend (usado solo internamente en el service) ──────────── */

export interface TrainingHistorySetDto {
  setNumber: string;
  repsPerformed: string;
  weightUsed: string;
  durationSeconds: string;
  // RPE ahora vive en el set (nuevo contrato). Opcional por compatibilidad con back viejo.
  rpe?: string | number | null;
  isCompleted: boolean;
}

export interface TrainingHistoryExerciseDto {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEs: string | null;
  gifUrl: string | null;
  targetMuscles: string[];
  // El back movió el RPE al set; a nivel ejercicio ya no viene (se deja opcional por retrocompat).
  rpe?: string | number | null;
  sets: TrainingHistorySetDto[];
}

export interface TrainingHistorySessionDto {
  id: string;
  trainedAt: string;
  totalTime: string;
  // Null en sesiones manuales.
  routineId: string | null;
  routineName: string;
  // El backend puede mandar el número como number o string (resto del DTO usa strings).
  routineVersionId?: string | null;
  routineVersionNumber?: number | string | null;
  exercises: TrainingHistoryExerciseDto[];
}

export interface PagedTrainingHistoryResponseDto {
  page: string;
  pageSize: string;
  totalCount: string;
  items: TrainingHistorySessionDto[];
}

/* ── Comparación de sesiones ─────────────────────────────────────────────── */

export interface SessionMetricDelta {
  key: string;
  label: string;
  unit: string;
  baseValue: number;
  targetValue: number;
  diff: number;
  percentChange: number | null;
  direction: 'up' | 'down' | 'same';
}

/** Set representativo (top set) de una sesión: peso × repeticiones */
export interface SessionSetSnapshot {
  weight: number;
  reps: number;
}

/** Tipo de cambio destacado entre los top sets de un ejercicio */
export type ExerciseHeadlineKind = 'weight' | 'reps' | 'none';

export interface SessionExerciseDelta {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEs: string | null;
  /** Top set de la sesión más antigua (referencia) */
  baseTopSet: SessionSetSnapshot;
  /** Top set de la sesión más reciente (actual) */
  targetTopSet: SessionSetSnapshot;
  /** Qué cambió entre ambos top sets: peso, repeticiones o nada */
  headlineKind: ExerciseHeadlineKind;
  /** Diferencia firmada del cambio destacado (kg si `weight`, reps si `reps`) */
  headlineDiff: number;
}

/** Veredicto general de la comparación, derivado de series completadas y volumen */
export type ComparisonVerdict = 'better' | 'worse' | 'similar';

export interface TrainingSessionComparison {
  /** Sesión más antigua (referencia) */
  base: TrainingHistorySession;
  /** Sesión más reciente (actual) */
  target: TrainingHistorySession;
  /** Veredicto general derivado de las métricas de trabajo */
  overall: ComparisonVerdict;
  summaryDeltas: SessionMetricDelta[];
  exerciseDeltas: SessionExerciseDelta[];
}

/* ── Registro manual de sesión (POST /api/routine/sessions/manual) ─────────── */

/** Un set dentro del form de sesión manual. Todo opcional salvo por construcción. */
export interface ManualSessionSet {
  reps: number;
  /** Esfuerzo percibido (1–10), o `null` si el usuario no lo eligió. Nunca `0`. */
  rpe: number | null;
  weight: number;
  /** Para ejercicios por tiempo; null si no aplica. */
  durationSeconds: number | null;
}

/** Un ejercicio del form de sesión manual (con su ExternalId de catálogo). */
export interface ManualSessionExercise {
  /** ExternalId del catálogo de Mongo (viene de /api/Exercise/search). */
  exerciseId: string;
  /** Nombre de respaldo por si el catálogo no resuelve el nombre. */
  exerciseNameSnapshot: string;
  sets: ManualSessionSet[];
}

/** Payload de dominio para crear una sesión manual (lo arma el hook del form). */
export interface CreateManualSessionPayload {
  /** Fecha en que se entrenó. Si es null, el back usa "ahora". */
  trainedAt: Date | null;
  /** Duración total en segundos. Si es 0/null, el back guarda 00:00:00. */
  totalSeconds: number | null;
  exercises: ManualSessionExercise[];
}
