import { AxiosError } from 'axios';
import { TrainingHistorySession, TrainingHistorySet } from '../types/training-history';

/** Formatea una fecha a "Lun 24 mar 2025" (sin hora) */
export const formatSessionDate = (d: Date): string =>
  d.toLocaleDateString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Formatea una fecha a "Lunes 24 de marzo, 09:30" */
export const formatSessionDateTime = (d: Date): string => {
  const datePart = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timePart = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${datePart}, ${timePart}`;
};

/** Formatea una fecha relativa a hoy: "Hoy", "Ayer", "Hace 3 días", "Hace 2 semanas" o fecha corta */
export const formatRelativeDay = (d: Date): string => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86_400_000);

  if (diffDays <= 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;
  }
  return formatSessionDate(d);
};

/** Convierte segundos totales a "1 h 24 min" o "45 min" o "30 s" */
export const formatDurationLong = (seconds: number): string => {
  if (seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  if (m > 0) return s > 0 ? `${m} min ${s} s` : `${m} min`;
  return `${s} s`;
};

/** "Viernes 12 de junio • 14:36" (día de semana capitalizado, separador •) */
export const formatSessionDateTimeDot = (d: Date): string => {
  const datePart = d.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const timePart = d.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);
  return `${capitalized} • ${timePart}`;
};

/** Métricas resumidas de una sesión, derivadas de los sets reales (no del backend) */
export interface SessionStats {
  completedSets: number;
  totalSets: number;
  totalReps: number;
  /** RPE promedio (entero) de los ejercicios con esfuerzo registrado; 0 si no hay */
  averageRpe: number;
}

/** Calcula series completadas/total, repeticiones totales y RPE promedio de una sesión */
export const computeSessionStats = (session: TrainingHistorySession): SessionStats => {
  let completedSets = 0;
  let totalSets = 0;
  let totalReps = 0;
  let rpeSum = 0;
  let rpeCount = 0;

  for (const exercise of session.exercises) {
    totalSets += exercise.sets.length;
    for (const set of exercise.sets) {
      if (set.isCompleted) completedSets += 1;
      totalReps += set.repsPerformed;
    }
    if (exercise.rpe > 0) {
      rpeSum += exercise.rpe;
      rpeCount += 1;
    }
  }

  return {
    completedSets,
    totalSets,
    totalReps,
    averageRpe: rpeCount > 0 ? Math.round(rpeSum / rpeCount) : 0,
  };
};

/** Detalle de un set para el listado: "12 rep • 20 kg", "45 s" o "—" si no se completó */
export const formatSetDetail = (set: TrainingHistorySet): string => {
  if (!set.isCompleted) return '—';
  const parts: string[] = [];
  if (set.repsPerformed > 0) parts.push(`${set.repsPerformed} rep`);
  if (set.weightUsed > 0) parts.push(formatWeightKg(set.weightUsed));
  if (set.durationSeconds > 0) parts.push(`${set.durationSeconds} s`);
  return parts.length > 0 ? parts.join(' • ') : '—';
};

/** Formatea un peso en kg a "12,5 kg" o "—" si es 0 */
export const formatWeightKg = (kg: number): string =>
  kg > 0
    ? `${kg.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} kg`
    : '—';

/**
 * Traduce un error HTTP (AxiosError o Error genérico)
 * a un mensaje amigable en español.
 */
export const mapHttpErrorToFriendlyMessage = (err: unknown): string => {
  if (err instanceof AxiosError) {
    const status = err.response?.status;
    if (status === 401) return 'Tu sesión expiró. Volvé a iniciar sesión.';
    if (status === 403) return 'No tenés permiso para ver esta información.';
    if (status === 404) return 'No encontramos lo que buscabas.';
    if (status === 408 || err.code === 'ECONNABORTED') return 'La conexión tardó demasiado. Revisá tu red.';
    if (status && status >= 500) return 'El servidor tuvo un problema. Intentá de nuevo en unos minutos.';
    if (!err.response) return 'No pudimos conectarnos. Verificá tu conexión a internet.';
  }
  return 'Ocurrió un error inesperado. Intentá de nuevo.';
};
