/**
 * Signal de sincronización del módulo Nutrición.
 *
 * Mismo patrón que `wellness-sync`: el Home y la pantalla de Nutrición refrescan
 * en focus, pero volver de una vista de SOLO LECTURA no debería refetchear.
 *
 * En vez de refrescar en cada focus, mantenemos una "versión" que solo se
 * incrementa cuando hay una MUTACIÓN real (registrar/editar alimentos de una
 * comida). Cada pantalla recuerda la última versión que cargó y solo refetchea
 * si cambió. Así:
 *  - navegar a una vista de lectura y volver → no refetchea.
 *  - registrar un alimento/comida y volver → refetchea (la versión avanzó).
 *
 * Estado de módulo (vive mientras corre la app). No usa subscripción: las
 * pantallas lo consultan dentro de su `useFocusEffect`.
 */
let version = 0;

/** Marca que los datos de Nutrición cambiaron (tras registrar/editar comidas). */
export const bumpNutritionData = (): void => {
  version += 1;
};

/** Versión actual de los datos de Nutrición. */
export const getNutritionDataVersion = (): number => version;
