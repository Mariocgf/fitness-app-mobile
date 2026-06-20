import { MealType } from '../types/nutrition';
import { RoutineDayName } from '../types/nutritionRoutine';
import { MEAL_LABELS } from './nutrition.utils';

export { MEAL_LABELS };

export const ROUTINE_DAY_ORDER: RoutineDayName[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const ROUTINE_DAY_LABELS: Record<RoutineDayName, string> = {
  Monday: 'Lun',
  Tuesday: 'Mar',
  Wednesday: 'Mié',
  Thursday: 'Jue',
  Friday: 'Vie',
  Saturday: 'Sáb',
  Sunday: 'Dom',
};

export const ROUTINE_DAY_FULL_LABELS: Record<RoutineDayName, string> = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo',
};

/** Retorna el nombre del día de la semana actual en formato RoutineDayName */
export const getTodayRoutineDayName = (): RoutineDayName => {
  const jsDay = new Date().getDay(); // 0=Domingo, 1=Lunes...6=Sábado
  const order: RoutineDayName[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return order[jsDay];
};

/**
 * Parsea un string de macro que puede venir como "350", "350 kcal", "~350".
 * Retorna 0 si no hay número válido.
 */
export const parseMacro = (value: string | number | undefined | null): number => {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;
  return parseFloat(String(value).replace(/[^\d.]/g, '')) || 0;
};

/**
 * Divide el string de instrucciones en pasos.
 * Si el texto viene numerado ("1. Paso uno. 2. Paso dos."), separa en esa lista.
 * Si no, devuelve el texto completo como un único paso.
 */
export const parseInstructionsToSteps = (instructions: string | undefined | null): string[] => {
  if (!instructions) return [];

  // Try numbered steps first (e.g. "1. Hervir... 2. Agregar...")
  const numbered = instructions
    .split(/\d+\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (numbered.length > 1) return numbered;

  // Fallback: split by ". " (period + space between sentences)
  return instructions
    .split(/\.\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
};

/** Calcula el porcentaje de una macro respecto al total de calorías */
export const computeMacroPercent = (macroKcal: number, totalKcal: number): number => {
  if (totalKcal <= 0) return 0;
  return Math.round((macroKcal / totalKcal) * 100);
};

/** Color de acento por tipo de comida (amber-400 para todo el módulo de Nutrición) */
export const MEAL_TYPE_COLOR: Record<MealType, string> = {
  Breakfast: '#f59e0b',
  Lunch: '#f59e0b',
  AfternoonSnack: '#f59e0b',
  Dinner: '#f59e0b',
};
