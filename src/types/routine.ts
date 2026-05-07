export interface RoutineExercise {
  id: string;
  exercise: string; // The name of the exercise conceptually based on the mockup
  gifUrl: string;
  sets: string;
  reps: string;
  rest: string;
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
