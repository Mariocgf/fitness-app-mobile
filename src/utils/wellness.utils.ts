import {
  BeverageType,
  MeditationTechnique,
  MoodLevel,
  SleepQuality,
  WellnessActivityItem,
  WellnessKind,
} from "../types/wellness";

// Meses en español abreviados para "26 jun." (mismo criterio que training-history.utils).
const MONTHS_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

// ─── Labels en español de los enums ──────────────────────────────────────────

/** Etiqueta legible de la calidad del sueño. */
export const SLEEP_QUALITY_LABELS: Record<SleepQuality, string> = {
  VeryPoor: "Muy mala",
  Poor: "Mala",
  Fair: "Regular",
  Good: "Buena",
  Excellent: "Excelente",
};

/** Etiqueta legible del nivel de ánimo. */
export const MOOD_LABELS: Record<MoodLevel, string> = {
  VeryBad: "Muy mal",
  Bad: "Mal",
  Neutral: "Normal",
  Good: "Bien",
  VeryGood: "Muy bien",
};

/**
 * Niveles de ánimo en el orden de la maqueta (peor → mejor). Compartido por el
 * selector del formulario y la escala de solo-lectura de "Último registro"/detalle.
 */
export const MOOD_LEVELS_ORDERED: MoodLevel[] = [
  "VeryBad",
  "Bad",
  "Neutral",
  "Good",
  "VeryGood",
];

/** Etiqueta legible del tipo de bebida. */
export const BEVERAGE_LABELS: Record<BeverageType, string> = {
  Water: "Agua",
  Tea: "Té",
  Coffee: "Café",
  Infusion: "Infusión",
  Other: "Otro",
};

/** Etiqueta legible de la técnica de meditación. */
export const MEDITATION_TECHNIQUE_LABELS: Record<MeditationTechnique, string> = {
  Mindfulness: "Mindfulness",
  Breathing: "Respiración",
  BodyScan: "Body scan",
  LovingKindness: "Bondad amorosa",
  Guided: "Guiada",
  Other: "Otra",
};

// ─── Formateadores ───────────────────────────────────────────────────────────

/** Convierte minutos de sueño a "8 h" o "7 h 30 min" según corresponda. */
export const formatSleepDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} h`;
  return `${hours} h ${mins} min`;
};

/** Formatea una duración corta en minutos: "10 min". */
export const formatMinutes = (minutes: number): string => `${minutes} min`;

/** Formatea una cantidad de líquido: "1500 ml". */
export const formatMl = (amountMl: number): string => `${amountMl} ml`;

/**
 * Formatea una fecha "YYYY-MM-DD" a "26 jun." (día + mes corto).
 * Parsea los componentes a mano para evitar el corrimiento de zona horaria
 * que produce `new Date("2026-06-26")` (interpretado como UTC).
 */
export const formatActivityDate = (dateKey: string): string => {
  const [, month, day] = dateKey.split("-").map((p) => parseInt(p, 10));
  if (!month || !day) return dateKey;
  return `${day} ${MONTHS_SHORT[month - 1]}.`;
};

/**
 * Formatea una fecha "YYYY-MM-DD" a "26 jun. 2026" (día + mes corto + año).
 * Versión con año para el detalle de cada feature (la maqueta lo muestra así).
 */
export const formatFullDate = (dateKey: string): string => {
  const [year, month, day] = dateKey.split("-").map((p) => parseInt(p, 10));
  if (!year || !month || !day) return dateKey;
  return `${day} ${MONTHS_SHORT[month - 1]}. ${year}`;
};

/**
 * Construye la clave "YYYY-MM-DD" a partir de los componentes LOCALES de un Date.
 * Evita el shift de zona horaria que produciría `date.toISOString().slice(0,10)`.
 */
export const toDateKey = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Formatea la hora local "HH:MM" de un timestamp ISO 8601 (ej. el `capturedAt`).
 * Para mostrar "Registrado a las 14:32".
 */
export const formatCapturedTime = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// ─── Actividad reciente (merge de las 4 features) ─────────────────────────────

// La hidratación se titula "Hidratación" en el resumen de Hoy/Registrar, pero
// la maqueta usa "Agua" en la actividad reciente; respetamos esa distinción.
const ACTIVITY_TITLES: Record<WellnessKind, string> = {
  sleep: "Sueño",
  hydration: "Agua",
  mood: "Ánimo",
  meditation: "Meditación",
};

/** Título de una entrada de actividad reciente según su tipo. */
export const getActivityTitle = (kind: WellnessKind): string =>
  ACTIVITY_TITLES[kind];

/** Subtítulo "26 jun. · <valor>" de una entrada de actividad reciente. */
export const getActivitySubtitle = (item: WellnessActivityItem): string => {
  const date = formatActivityDate(item.date);
  switch (item.kind) {
    case "sleep":
      return `${date} · ${formatSleepDuration(
        item.data.durationMinutes,
      )} · ${SLEEP_QUALITY_LABELS[item.data.quality]}`;
    case "hydration":
      return `${date} · ${formatMl(item.data.amountMl)}`;
    case "mood":
      return `${date} · ${MOOD_LABELS[item.data.mood]}`;
    case "meditation":
      return `${date} · ${formatMinutes(item.data.durationMinutes)}`;
  }
};
