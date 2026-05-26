/** Interfaces del dominio "historial de entrenamiento" — ya mapeadas desde el DTO del backend */

export interface TrainingHistorySet {
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
  durationSeconds: number;
  isCompleted: boolean;
}

export interface TrainingHistoryExercise {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEs: string | null;
  gifUrl: string | null;
  targetMuscles: string[];
  rpe: number;
  sets: TrainingHistorySet[];
}

export interface TrainingHistorySession {
  id: string;
  /** Fecha/hora de la sesión de entrenamiento */
  trainedAt: Date;
  /** Duración total de la sesión en segundos (mapeado desde "HH:mm:ss") */
  totalSeconds: number;
  routineId: string;
  routineName: string;
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
  isCompleted: boolean;
}

export interface TrainingHistoryExerciseDto {
  exerciseId: string;
  exerciseName: string;
  exerciseNameEs: string | null;
  gifUrl: string | null;
  targetMuscles: string[];
  rpe: string;
  sets: TrainingHistorySetDto[];
}

export interface TrainingHistorySessionDto {
  id: string;
  trainedAt: string;
  totalTime: string;
  routineId: string;
  routineName: string;
  exercises: TrainingHistoryExerciseDto[];
}

export interface PagedTrainingHistoryResponseDto {
  page: string;
  pageSize: string;
  totalCount: string;
  items: TrainingHistorySessionDto[];
}
