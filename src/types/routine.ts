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
  weight: string;
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
  isActive: boolean;
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
