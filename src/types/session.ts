export type SessionExercise = {
  id: string;
  exercise: string;
  gifUrl: string | null;
  sets: string;
  reps: string;
  rest: string; // seconds as string
};

export type SessionDay = {
  id: string;
  day: string;
  approxTimeSession: string;
  exercises: SessionExercise[];
};

export type ExerciseLog = {
  exerciseId: string;
  rpe: number; // default 5
  totalWeight: number; // default 0 por ahora
};

export type SessionLog = {
  routineId: string;
  trainedAt: string; // ISO date string
  totalTime: string; // formato "HH:MM:SS" o segundos
  exercises: ExerciseLog[];
};
