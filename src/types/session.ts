import { RepType } from './routine';

export type SessionExercise = {
  id: string;
  exercise: string;
  gifUrl: string | null;
  sets: string;
  repType: RepType;
  minRep: string | null;
  maxRep: string | null;
  currentRep: string | null;
  durationSeconds: string | null;
  rest: string; // seconds as string
  weight: string;
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
