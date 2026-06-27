/**
 * Signal de sincronización del módulo Bienestar.
 *
 * Las pantallas (Bienestar, Sueño) refrescan en focus, pero volver de una vista
 * de SOLO LECTURA no debería refetchear: era una llamada al pedo a la API.
 *
 * En vez de refrescar en cada focus, mantenemos una "versión" que solo se
 * incrementa cuando hay una MUTACIÓN real (registrar/eliminar). Cada pantalla
 * recuerda la última versión que cargó y solo refetchea si cambió. Así:
 *  - navegar a una vista de lectura y volver → no refetchea.
 *  - registrar/eliminar y volver → refetchea (la versión avanzó).
 *
 * Estado de módulo (vive mientras corre la app), mismo patrón que
 * `training-history-cache`. No usa subscripción: las pantallas lo consultan
 * dentro de su `useFocusEffect`.
 */
let version = 0;

/** Marca que los datos de Bienestar cambiaron (tras registrar o eliminar). */
export const bumpWellnessData = (): void => {
  version += 1;
};

/** Versión actual de los datos de Bienestar. */
export const getWellnessDataVersion = (): number => version;
