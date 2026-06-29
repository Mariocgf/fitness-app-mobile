/**
 * Signal de sincronización del módulo Salud.
 *
 * El dashboard de Salud refresca en focus, pero volver de una vista de SOLO
 * LECTURA (mediciones, evolución, historial, detalle) no debería refetchear:
 * era una llamada al pedo a la API.
 *
 * En vez de refrescar en cada focus, mantenemos una "versión" que solo se
 * incrementa cuando hay una MUTACIÓN real (registrar/eliminar medición, registrar
 * lectura clínica, editar perfil clínico). El dashboard recuerda la última
 * versión que cargó y solo refetchea si cambió. Así:
 *  - navegar a una vista de lectura y volver → no refetchea.
 *  - registrar/editar y volver → refetchea (la versión avanzó).
 *
 * Estado de módulo (vive mientras corre la app), mismo patrón que
 * `wellness-sync` y `training-history-cache`. No usa subscripción: el dashboard
 * lo consulta dentro de su `useFocusEffect`.
 */
let version = 0;

/** Marca que los datos de Salud cambiaron (tras registrar, eliminar o editar). */
export const bumpHealthData = (): void => {
  version += 1;
};

/** Versión actual de los datos de Salud. */
export const getHealthDataVersion = (): number => version;
