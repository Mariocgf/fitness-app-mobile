/** Funciones puras de formateo reutilizables en toda la aplicación */

/**
 * Capitaliza la primera letra de un string.
 */
export const capitalize = (str: string): string =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : str;

/**
 * Elimina el prefijo de paso (Step/Paso) de una instrucción de ejercicio.
 * Cubre formatos como "Step 1:", "Step:1", "Paso 1:", "Paso:1", etc.
 */
export const cleanStepPrefix = (str: string): string =>
  str.replace(/^(step|paso)\s*:?\s*\d+\s*:?\s*/i, '').trim();

/**
 * Convierte una cantidad total de segundos a formato MM:SS.
 * Útil para cronómetros, descansos y resúmenes de sesión.
 */
export const formatTime = (totalSeconds: number): string => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

/**
 * Formatea las repeticiones de un ejercicio según su tipo (Fixed, Range, Timed).
 * Acepta cualquier objeto que tenga las propiedades necesarias para evaluar el formato.
 */
export const formatReps = (exercise: {
  repType: string;
  durationSeconds?: string | number | null;
  currentRep?: string | number | null;
}): string => {
  if (exercise.repType === 'Timed') {
    const totalSecs = parseInt(String(exercise.durationSeconds || '0'), 10);
    if (totalSecs >= 60) {
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${totalSecs}s`;
  }
  return exercise.currentRep != null ? String(exercise.currentRep) : '-';
};

/**
 * Formatea el objetivo de repeticiones como rango "min–max" cuando existe,
 * o un valor único (currentRep/maxRep/minRep) en su defecto.
 * Devuelve "-" si no hay dato de repeticiones disponible.
 */
export const formatRepRange = (exercise: {
  minRep?: string | number | null;
  maxRep?: string | number | null;
  currentRep?: string | number | null;
}): string => {
  const toInt = (v: string | number | null | undefined): number =>
    v != null ? parseInt(String(v), 10) : NaN;

  const min = toInt(exercise.minRep);
  const max = toInt(exercise.maxRep);
  if (Number.isFinite(min) && Number.isFinite(max) && min > 0 && max > 0 && min !== max) {
    return `${min}–${max}`;
  }

  const current = toInt(exercise.currentRep);
  if (Number.isFinite(current) && current > 0) return String(current);
  if (Number.isFinite(max) && max > 0) return String(max);
  if (Number.isFinite(min) && min > 0) return String(min);
  return '-';
};

export type ExerciseLoadType = 'BodyWeight' | 'ExternalWeight';

/**
 * Objetivo de repeticiones de la serie EN CURSO.
 *
 * Prioriza `currentRep` sobre el rango `min–max`, al revés que `formatRepRange`: el
 * `currentRep` es el valor que el **ajuste de carga actualiza**. Mostrando el rango del
 * plan (que nunca cambia), un ajuste de repeticiones sería invisible para el usuario.
 * Si el ejercicio no tiene `currentRep`, se cae al rango.
 */
export const formatTargetReps = (exercise: {
  minRep?: string | number | null;
  maxRep?: string | number | null;
  currentRep?: string | number | null;
}): string => {
  const current =
    exercise.currentRep != null ? parseInt(String(exercise.currentRep), 10) : NaN;

  if (Number.isFinite(current) && current > 0) return String(current);
  return formatRepRange(exercise);
};

export const formatExerciseLoad = (exercise: {
  loadType?: ExerciseLoadType | string | null;
  plannedWeightKg?: number | string | null;
}): string => {
  if (exercise.loadType === 'ExternalWeight') {
    const kg = Number(exercise.plannedWeightKg);
    return Number.isFinite(kg) && kg > 0 ? `${kg}kg` : '-';
  }

  if (exercise.loadType === 'BodyWeight') {
    return 'peso corporal';
  }

  return '-';
};

/**
 * Convierte segundos totales a formato TimeSpan HH:mm:ss (para el backend).
 */
export const formatTimeSpan = (totalSeconds: number): string => {
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};
