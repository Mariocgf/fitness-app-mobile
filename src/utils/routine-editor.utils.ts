/**
 * Helpers puros compartidos por la creación y la edición de rutinas.
 * Centraliza el mapa de días, el cálculo de duración aproximada, la conversión
 * de una Routine al formato editable (draft) y el armado del payload de la API,
 * para que ambos flujos no dupliquen esta lógica.
 */
import { translateDay } from '@/src/i18n';
import { CreateRoutineDayPayload, CreateRoutinePayload } from '@/src/services/routine.service';
import { CreateRoutineDay, CreateRoutineExercise } from '@/src/types/create-routine';
import { RoutineDay } from '@/src/types/routine';

/** Mapa de días: valor en inglés → etiqueta en español (orden semanal) */
export const DAYS_MAP: { value: string; label: string }[] = [
  { value: 'monday', label: 'Lunes' },
  { value: 'tuesday', label: 'Martes' },
  { value: 'wednesday', label: 'Miércoles' },
  { value: 'thursday', label: 'Jueves' },
  { value: 'friday', label: 'Viernes' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const DAY_KEYS = DAYS_MAP.map((d) => d.value);

/** Genera un id temporal para días/ejercicios nuevos en el cliente */
export const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Índice semanal de un día (para ordenar); -1 si no está en el mapa */
export const dayOrderIndex = (value: string): number => DAYS_MAP.findIndex((d) => d.value === value);

/** Ordena los días por su posición en la semana (Lunes → Domingo) */
export const sortDaysByWeek = (days: CreateRoutineDay[]): CreateRoutineDay[] =>
  [...days].sort((a, b) => dayOrderIndex(a.value) - dayOrderIndex(b.value));

/** Extrae la clave en inglés (monday…sunday) contenida en la etiqueta del día */
export const getDayKey = (dayLabel: string): string | null =>
  DAY_KEYS.find((k) => dayLabel.toLowerCase().includes(k)) ?? null;

/** Tiempo aproximado de sesión (min) a partir de los ejercicios de un día */
export const calcDayApproxTime = (exercises: CreateRoutineExercise[]): number => {
  if (exercises.length === 0) return 0;
  const totalSeconds = exercises.reduce((acc, ex) => {
    const execTime = ex.repMode === 'secs' ? ex.reps * ex.sets : ex.reps * 3 * ex.sets;
    const restTime = ex.restSeconds * (ex.sets - 1);
    return acc + (execTime + restTime) * 1.15;
  }, 0);
  return Math.round(totalSeconds / 60);
};

/** Convierte los días de una Routine (DTO del backend) al formato editable (draft) */
export const routineToDraftDays = (days: RoutineDay[]): CreateRoutineDay[] =>
  days.map((day): CreateRoutineDay => {
    const key = getDayKey(day.day);
    return {
      id: day.id,
      value: key ?? day.day.toLowerCase(),
      label: key ? translateDay(key) : day.day,
      exercises: day.exercises.map((ex): CreateRoutineExercise => ({
        id: ex.id,
        exerciseId: ex.exerciseId,
        name: ex.name,
        gifUrl: ex.gifUrl,
        equipments: [],
        sets: parseInt(ex.sets, 10) || 3,
        reps: ex.repType === 'Timed'
          ? parseInt(ex.durationSeconds ?? '30', 10)
          : parseInt(ex.currentRep ?? ex.minRep ?? '12', 10),
        repMode: ex.repType === 'Timed' ? 'secs' : 'reps',
        restSeconds: parseInt(ex.rest, 10) || 60,
        loadType: ex.loadType ?? 'BodyWeight',
        plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
      })),
    };
  });

/**
 * Arma el payload de la API a partir del nombre + días editables.
 * Ignora los días sin ejercicios (no se envían). Lo usan tanto crear como editar.
 */
export const buildRoutinePayload = (
  name: string,
  days: CreateRoutineDay[],
  activate: boolean,
): CreateRoutinePayload => ({
  name: name.trim(),
  activate,
  days: days
    .filter((d) => d.exercises.length > 0)
    .map((day): CreateRoutineDayPayload => ({
      dayOfWeek: day.value,
      approxTimeSession: calcDayApproxTime(day.exercises),
      exercises: day.exercises.map((ex, idx) => ({
        exerciseId: ex.exerciseId,
        order: idx + 1,
        sets: ex.sets,
        repMode: ex.repMode,
        reps: ex.repMode === 'reps' ? ex.reps : null,
        durationSeconds: ex.repMode === 'secs' ? ex.reps : null,
        restSeconds: ex.restSeconds,
        loadType: ex.loadType,
        plannedWeightKg: ex.loadType === 'ExternalWeight' ? ex.plannedWeightKg : null,
      })),
    })),
});
