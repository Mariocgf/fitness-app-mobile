/**
 * Formatea una fecha ISO a un tiempo relativo corto: "hace un momento", "hace 3 min",
 * "hace 2 h", "hace 4 d". Para intervalos largos cae a una fecha corta (es-AR).
 *
 * Complementa a `formatRelativeDay` (granularidad de días) de training-history.utils:
 * este llega hasta segundos/minutos, necesario para el feed del foro ("Posted 3m ago").
 */
export const formatRelativeTime = (isoDate: string): string => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'hace un momento';

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `hace ${diffHour} h`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `hace ${diffDay} d`;

  // Más de una semana: fecha corta "22 jun" (sin año si es del año en curso).
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: sameYear ? undefined : 'numeric',
  });
};
