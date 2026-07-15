import { Routine } from '../types/routine';
import { ExerciseLoadType } from './format.utils';

/**
 * Los valores de un ejercicio que el ajuste de carga puede cambiar.
 * `null` significa "el backend no lo tocó", NUNCA "ponelo en cero".
 */
export interface ExerciseLoadPatch {
  loadType: ExerciseLoadType | null;
  plannedWeightKg: number | null;
  currentRep: number | null;
  durationSeconds: number | null;
}

/** True si el ajuste trae al menos un valor nuevo para aplicar. */
export const hasLoadChanges = (patch: ExerciseLoadPatch): boolean =>
  patch.loadType !== null ||
  patch.plannedWeightKg !== null ||
  patch.currentRep !== null ||
  patch.durationSeconds !== null;

/**
 * Aplica un ajuste de carga sobre la rutina y devuelve una COPIA nueva (no muta).
 *
 * El backend ya persistió el ajuste de su lado, pero la app tiene la rutina cacheada:
 * sin esto, al salir de la sesión el detalle seguiría mostrando el peso viejo y la
 * próxima sesión arrancaría de un valor que ya no es el vigente.
 *
 * Cada campo se pisa POR SU CUENTA: un `plannedWeightKg` nuevo se aplica aunque
 * `loadType` venga `null`, y viceversa.
 *
 * @param routine Rutina cacheada.
 * @param dayId Id del día de rutina donde se entrenó.
 * @param exerciseEntryId `id` del ejercicio DENTRO del día (no el `exerciseId` de catálogo).
 */
export const applyLoadAdjustmentToRoutine = (
  routine: Routine,
  dayId: string,
  exerciseEntryId: string,
  patch: ExerciseLoadPatch,
): Routine => {
  if (!hasLoadChanges(patch)) return routine;

  return {
    ...routine,
    days: routine.days.map((day) => {
      if (day.id !== dayId) return day;

      return {
        ...day,
        exercises: day.exercises.map((exercise) => {
          if (exercise.id !== exerciseEntryId) return exercise;

          return {
            ...exercise,
            ...(patch.loadType !== null ? { loadType: patch.loadType } : {}),
            ...(patch.plannedWeightKg !== null ? { plannedWeightKg: patch.plannedWeightKg } : {}),
            ...(patch.currentRep !== null ? { currentRep: String(patch.currentRep) } : {}),
            ...(patch.durationSeconds !== null
              ? { durationSeconds: String(patch.durationSeconds) }
              : {}),
          };
        }),
      };
    }),
  };
};
