import { I18n } from 'i18n-js';

import en from './locales/en.json';
import es from './locales/es.json';

const i18n = new I18n({ en, es });

i18n.locale = 'es';
i18n.defaultLocale = 'es';
i18n.enableFallback = true;

export function translateDay(key: string): string {
  const translation = i18n.t(`days.${key.toLowerCase()}`, { defaultValue: null });
  return translation ?? key;
}

/**
 * Traduce valores que llegan del backend en inglés (nombres de objetivos,
 * subobjetivos, módulos y sus descripciones). Se resuelven por lookup directo
 * sobre el diccionario y no con `i18n.t`, porque las descripciones terminan en
 * punto y ese carácter es el separador de rutas de i18n-js.
 *
 * La comparación es tolerante: normaliza mayúsculas, espacios y el punto final,
 * porque el backend no es consistente (unas descripciones llegan con punto y
 * otras sin él).
 */
type LookupSection =
  | 'globalGoals'
  | 'subGoalNames'
  | 'subGoalDescriptions'
  | 'moduleNames'
  | 'moduleDescriptions';

const normalize = (value: string): string =>
  value.trim().replace(/\.+$/, '').toLowerCase();

/** Índice normalizado por sección, calculado una sola vez. */
const normalizedIndex: Partial<Record<LookupSection, Record<string, string>>> = {};

function getNormalizedDict(section: LookupSection): Record<string, string> {
  let index = normalizedIndex[section];
  if (!index) {
    index = {};
    const dict = (es as Record<string, Record<string, string>>)[section] ?? {};
    for (const [key, translation] of Object.entries(dict)) {
      index[normalize(key)] = translation;
    }
    normalizedIndex[section] = index;
  }
  return index;
}

function lookup(section: LookupSection, value: string): string {
  if (!value) return value;
  return getNormalizedDict(section)[normalize(value)] ?? value;
}

export function translateModuleName(name: string): string {
  return lookup('moduleNames', name);
}

export function translateModuleDescription(description: string): string {
  return lookup('moduleDescriptions', description);
}

export function translateGlobalGoal(name: string): string {
  return lookup('globalGoals', name);
}

export function translateSubGoalName(name: string): string {
  return lookup('subGoalNames', name);
}

export function translateSubGoalDescription(description: string): string {
  return lookup('subGoalDescriptions', description);
}

export { i18n };

