import { FitnessDay } from '../types/fitness';

/**
 * Mapeo entre los días en inglés que usa el backend (monday..sunday) y los
 * valores numéricos que usa `WeekDayPicker` / `WEEKDAY_OPTIONS` (Lunes=1..Sábado=6,
 * Domingo=0). Se centraliza acá para que tanto la config de perfil como el modal
 * de generación de rutina compartan la misma conversión (DRY).
 */
export const dayToPickerValue: Record<FitnessDay, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

export const pickerValueToDay: Record<number, FitnessDay> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  0: 'sunday',
};

/** Convierte días del backend (inglés) a valores numéricos del picker. */
export const toPickerDays = (days: FitnessDay[]): number[] =>
  days.map((day) => dayToPickerValue[day]);

/** Convierte valores numéricos del picker a días del backend (inglés). */
export const toFitnessDays = (days: number[]): FitnessDay[] =>
  days
    .map((day) => pickerValueToDay[day])
    .filter((day): day is FitnessDay => Boolean(day));
