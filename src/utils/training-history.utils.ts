import { AxiosError } from 'axios';

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
