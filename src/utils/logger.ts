/**
 * Logger dev-only. En producción (`__DEV__ === false`) no emite nada: mantiene
 * la consola limpia y evita filtrar datos por logs. Es el ÚNICO punto de logging
 * del frontend — si más adelante se quiere reporte de errores (Sentry, etc.),
 * se engancha acá y se cubre toda la app de una.
 */
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};
