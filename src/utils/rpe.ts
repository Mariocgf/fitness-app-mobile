/**
 * Escala de esfuerzo percibido (RPE).
 *
 * Categorías en la pantalla, números en el contrato: el usuario elige una PALABRA
 * y el backend recibe un número que la ciencia del entrenamiento entiende. Nadie
 * sabe qué es "un RPE 7", así que nunca se le muestra el número al usuario.
 *
 * `0` dejó de ser un valor válido y `null` significa "el usuario no lo registró".
 */

export interface EffortOption {
  /** Etiqueta que ve el usuario. */
  readonly label: string;
  /** Valor que viaja al backend (1-10). */
  readonly value: number;
  /**
   * Opción más visible del selector (botón más grande). NO viene preseleccionada:
   * un default se cosecha por inercia y describiría al default, no al usuario.
   */
  readonly emphasized?: boolean;
}

/**
 * ÚNICO lugar del código donde vive el mapeo palabra → número.
 *
 * La escala está por cambiar a `Fácil 6 / Exigente 8 / Muy exigente 9 / Al fallo 10`
 * junto con el rediseño de la progresión de cargas: cuando llegue, se toca SOLO esta
 * constante y nada más (ver `docs/frontend-rpe.md`).
 */
export const EFFORT_OPTIONS: readonly EffortOption[] = [
  { label: 'Suave', value: 4 },
  { label: 'Justo', value: 6, emphasized: true },
  { label: 'Duro', value: 8 },
  { label: 'Al fallo', value: 10 },
];

/** Rango válido del contrato. El backend rechaza con 400 cualquier cosa fuera de acá. */
export const MIN_RPE = 1;
export const MAX_RPE = 10;

/**
 * Promedia los esfuerzos registrados IGNORANDO los `null` (ausencia no es cero).
 *
 * Devuelve `null` cuando no hay ni un solo dato: sin RPE no hay ajuste posible y no
 * se inventa un valor por defecto para poder llamar al endpoint.
 */
export const averageRpe = (values: readonly (number | null)[]): number | null => {
  const recorded = values.filter((value): value is number => value !== null);
  if (recorded.length === 0) return null;

  const average = recorded.reduce((sum, value) => sum + value, 0) / recorded.length;
  return Math.min(MAX_RPE, Math.max(MIN_RPE, Math.round(average)));
};

/** Texto para una serie sin esfuerzo registrado. La ausencia se dice, no se disfraza de 0. */
export const EFFORT_UNRECORDED_LABEL = 'Sin esfuerzo';

/**
 * Traduce un RPE numérico a la etiqueta de la escala: al usuario NUNCA se le muestra
 * el número, ni cuando lo elige ni cuando lo relee en el historial.
 *
 * No alcanza con buscar el valor exacto: en la lectura puede aparecer cualquier 1-10
 * (datos viejos con un `5` o un `7`, o el promedio de una sesión que da `9`). Se elige
 * la categoría MÁS CERCANA y, si empata, la más suave — nunca se le atribuye al usuario
 * un esfuerzo mayor del que se puede sostener con el dato.
 *
 * Se deriva de `EFFORT_OPTIONS`, así que cuando cambie la escala esto se reacomoda solo.
 */
export const effortLabelFor = (rpe: number | null): string | null => {
  if (rpe == null) return null;

  return EFFORT_OPTIONS.reduce((closest, option) =>
    Math.abs(option.value - rpe) < Math.abs(closest.value - rpe) ? option : closest
  ).label;
};
