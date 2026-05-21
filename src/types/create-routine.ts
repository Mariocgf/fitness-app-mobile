export interface CreateRoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string | null;
  sets: number;
  reps: number;
  restSeconds: number;
}

export interface CreateRoutineDay {
  id: string;
  value: string; // "monday", "tuesday", etc.
  label: string; // "Lunes", "Martes", etc.
  exercises: CreateRoutineExercise[];
}
