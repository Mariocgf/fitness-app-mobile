export type RepType = 'Fixed' | 'Range' | 'Timed';

export interface RoutineExercise {
  id: string;
  exercise: string; // The name of the exercise conceptually based on the mockup
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

export interface Routine {
  id: string;
  name: string; // e.g. "Fuerza Pro - Nivel Intermedio"
  createdAt: string;
  days: RoutineDay[];
}
