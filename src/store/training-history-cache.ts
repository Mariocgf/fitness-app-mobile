import { TrainingHistorySession } from '../types/training-history';

/** Cache en memoria de sesiones de entrenamiento.
 *  Evita pasar JSON por URL y permite al detalle leer sin fetch cuando viene del listado. */
const cache = new Map<string, TrainingHistorySession>();

/** Guarda o sobreescribe una sesión en el cache */
export const setSession = (session: TrainingHistorySession): void => {
  cache.set(session.id, session);
};

/** Recupera una sesión del cache por id. Retorna undefined si no existe. */
export const getSession = (id: string): TrainingHistorySession | undefined =>
  cache.get(id);

/** Guarda múltiples sesiones en el cache */
export const setMany = (sessions: TrainingHistorySession[]): void => {
  sessions.forEach((s) => cache.set(s.id, s));
};

/** Limpia todo el cache */
export const clearSessionCache = (): void => {
  cache.clear();
};

/** Elimina una sesión del cache por id */
export const remove = (id: string): boolean => {
  return cache.delete(id);
};
