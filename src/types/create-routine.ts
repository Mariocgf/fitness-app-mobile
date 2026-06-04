import { ExerciseLoadType } from '../utils/format.utils';

export interface CreateRoutineExercise {
  id: string;
  exerciseId: string;
  name: string;
  gifUrl: string | null;
  equipments: string[];
  sets: number;
  reps: number;
  repMode: 'reps' | 'secs';
  restSeconds: number;
  loadType: ExerciseLoadType;
  plannedWeightKg: number | null;
}

export interface CreateRoutineDay {
  id: string;
  value: string; // "monday", "tuesday", etc.
  label: string; // "Lunes", "Martes", etc.
  exercises: CreateRoutineExercise[];
}

export interface RoutineDraft {
  name: string;
  days: CreateRoutineDay[];
}
