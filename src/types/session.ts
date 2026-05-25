import { RepType } from './routine';

export type SessionExercise = {
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
  rest: string; // seconds as string
  weight: string;
};

export type SessionDay = {
  id: string;
  day: string;
  approxTimeSession: string;
  exercises: SessionExercise[];
};

export interface SessionSet {
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
  durationSeconds: number | null;
  isCompleted: boolean;
}

export type ExerciseLog = {
  exerciseId: string;
  rpe: number; // default 5
  totalWeight: number;
  sets: SessionSet[];
};

/** Formato plano que espera la API: cada set es una entrada independiente */
export type SessionExerciseEntry = {
  exerciseId: string;
  rpe: number;
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
  durationSeconds: number | null;
  isCompleted: boolean;
};

export type SessionLog = {
  routineId: string;
  trainedAt: string; // ISO date string
  totalTime: string; // formato "HH:mm:ss"
  exercises: SessionExerciseEntry[];
};
