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

export { i18n };

