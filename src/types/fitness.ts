// ── Labels para la UI ──

export const EXPERIENCE_LEVEL_OPTIONS = [
  { value: '1', label: 'Principiante' },
  { value: '2', label: 'Intermedio' },
  { value: '3', label: 'Avanzado' },
];

export const TRAINING_HISTORY_OPTIONS = [
  { value: '1', label: '0 a 3 meses' },
  { value: '2', label: '3 a 12 meses' },
  { value: '3', label: '1 a 3 años' },
  { value: '4', label: 'Más de 3 años' },
];

export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'L', isWeekend: false },
  { value: 2, label: 'M', isWeekend: false },
  { value: 3, label: 'X', isWeekend: false },
  { value: 4, label: 'J', isWeekend: false },
  { value: 5, label: 'V', isWeekend: false },
  { value: 6, label: 'S', isWeekend: true },
  { value: 0, label: 'D', isWeekend: true },
];

/** Enum WorkoutLocation: None=0, Home=1, Gym=2 */
export const WORKOUT_LOCATION_OPTIONS = [
  { value: '1', label: 'Home' },
  { value: '2', label: 'Gym' },
];

// ── Tipos del backend ──

export interface Equipment {
  id: string;
  name: string;
}

export interface EquipmentSelection {
  id: string;
  name?: string;
  qty: number;
}

export interface SubGoal {
  id: string;
  name: string;
  description: string;
}

// ── Payload del POST ──

export interface FitnessProfilePayload {
  experienceLevel: string;
  trainingHistory: string;
  preferredWorkoutDays: number[];
  availableEquipment: EquipmentSelection[];
  workoutLocation?: string;
  sessionDurationPreference: number;
  subGoals: string[];
}

// ── Draft local ──

export interface FitnessConfigDraft {
  experienceLevel?: string;
  trainingHistory?: string;
  preferredWorkoutDays?: number[];
  availableEquipment?: EquipmentSelection[];
  workoutLocation?: string;
  sessionDurationPreference?: number;
  /** Indica si el usuario eligió "Tengo tiempo" (true) o "Elegir tiempo" (false) */
  hasFlexibleTime?: boolean;
  selectedSubGoalIds?: string[];
}
