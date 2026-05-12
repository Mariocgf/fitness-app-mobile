/** Funciones puras de formateo reutilizables en toda la aplicación */

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
  durationSeconds?: string | null;
  currentRep?: string | null;
}): string => {
  if (exercise.repType === 'Timed') {
    const totalSecs = parseInt(exercise.durationSeconds || '0', 10);
    if (totalSecs >= 60) {
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${totalSecs}s`;
  }
  return exercise.currentRep || '-';
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
