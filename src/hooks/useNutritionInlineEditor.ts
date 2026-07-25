import { logger } from '@/src/utils/logger';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getNutritionGenerationOptions } from '../services/nutritionRoutine.service';
import {
  updateUserFoodAllergies,
  updateUserTypeOfDiets,
} from '../services/profile.service';
import {
  NutritionCatalogItem,
  NutritionGenerationDraft,
  NutritionGenerationOptions,
} from '../types/nutritionRoutine';

/** Objetivos diarios del perfil. Solo lectura: los calcula el backend. */
export interface NutritionTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

interface UseNutritionInlineEditorReturn {
  /** Catálogo de alergias seleccionables (nombres ya en español). */
  allergies: NutritionCatalogItem[];
  /** Catálogo de tipos de dieta seleccionables. */
  diets: NutritionCatalogItem[];
  allergyIds: string[];
  setAllergyIds: (ids: string[]) => void;
  dietIds: string[];
  setDietIds: (ids: string[]) => void;
  /** Objetivos calóricos vigentes. `null` mientras no cargó. */
  targets: NutritionTargets | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  /**
   * Snapshot crudo de `generation-options`. Sus `selected*Ids` son la BASE del diff
   * (lo que hay guardado en el servidor). El padre lo conserva para reabrir el modal
   * tras un fallo sin repetir la llamada.
   */
  options: NutritionGenerationOptions | null;
  /**
   * Persiste los cambios ANTES de generar (el backend lee del perfil, no del body).
   * Cada campo se manda SOLO si cambió: sin cambios no viaja ningún request.
   * Ambos endpoints son de reemplazo total, así que se envía la lista completa.
   */
  persist: () => Promise<void>;
}

const hasDiff = (current: string[], initial: string[]): boolean =>
  current.length !== initial.length || current.some((id) => !initial.includes(id));

const toTargets = (data: NutritionGenerationOptions): NutritionTargets => ({
  calories: data.targetCalories,
  proteinGrams: data.targetProteinGrams,
  carbsGrams: data.targetCarbsGrams,
  fatGrams: data.targetFatGrams,
});

/**
 * Editor inline de alergias y tipos de dieta para el modal de generación del plan
 * de nutrición. Se apoya en un único endpoint (`generation-options`) que ya trae
 * catálogo + selección, así que no cruza listas ni queda expuesto a fallas parciales.
 *
 * Sigue el patrón canónico de `useGenerateRoutineModal`: `getTokenRef` (ref, no
 * dependencia) para no refetchear cuando Clerk refresca la sesión, y `AbortController`
 * para descartar respuestas obsoletas.
 *
 * @param initialDraft Estado conservado de un intento fallido. Si viene, el hook
 * arranca sembrado desde memoria y **no hace ninguna llamada**: los catálogos y los
 * objetivos ya los teníamos, volver a pedirlos sería gastar un request en datos que
 * no cambiaron. `options.selected*Ids` sigue siendo la base del diff, así que el
 * reintento sabe si todavía falta guardar algo.
 */
export function useNutritionInlineEditor(
  initialDraft?: NutritionGenerationDraft | null,
): UseNutritionInlineEditorReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  /**
   * El draft se fija UNA vez: si viniera por dependencia, un objeto literal nuevo en
   * cada render del padre reiniciaría la selección del usuario mientras edita.
   */
  const seeded = useRef(initialDraft ?? null).current;

  const [options, setOptions] = useState<NutritionGenerationOptions | null>(
    seeded?.options ?? null,
  );
  const [allergies, setAllergies] = useState<NutritionCatalogItem[]>(
    seeded?.options.foodAllergies ?? [],
  );
  const [diets, setDiets] = useState<NutritionCatalogItem[]>(
    seeded?.options.typeOfDiets ?? [],
  );
  const [allergyIds, setAllergyIds] = useState<string[]>(seeded?.allergyIds ?? []);
  const [dietIds, setDietIds] = useState<string[]>(seeded?.dietIds ?? []);
  const [targets, setTargets] = useState<NutritionTargets | null>(
    seeded ? toTargets(seeded.options) : null,
  );
  // Sembrado desde memoria ⇒ no hay nada que esperar: sin esto parpadearía un spinner.
  const [isLoading, setIsLoading] = useState(!seeded);
  const [error, setError] = useState<string | null>(null);

  const loadRequestRef = useRef<AbortController | null>(null);

  /**
   * Lo que está guardado en el servidor: base para diffear al persistir.
   * Cuando venimos de un fallo lo aporta el draft, y refleja si el `persist` del
   * intento anterior llegó a impactar o no.
   */
  const initialAllergyIds = useRef<string[]>(seeded?.options.selectedFoodAllergyIds ?? []);
  const initialDietIds = useRef<string[]>(seeded?.options.selectedTypeOfDietIds ?? []);

  const loadOptions = useCallback(async () => {
    abortRequest(loadRequestRef);

    const token = await getTokenRef.current();
    if (!token) {
      setIsLoading(false);
      return;
    }

    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getNutritionGenerationOptions(token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;

      setOptions(data);
      setAllergies(data.foodAllergies);
      setDiets(data.typeOfDiets);
      setAllergyIds(data.selectedFoodAllergyIds);
      setDietIds(data.selectedTypeOfDietIds);
      setTargets(toTargets(data));

      initialAllergyIds.current = data.selectedFoodAllergyIds;
      initialDietIds.current = data.selectedTypeOfDietIds;
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      const message =
        err instanceof Error
          ? err.message
          : 'No pudimos cargar las opciones de generación. Intentá de nuevo.';
      setError(message);
      logger.error('[useNutritionInlineEditor] Error cargando opciones:', err);
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    // Con draft ya tenemos todo en memoria: no se pide de nuevo.
    if (seeded) return;
    loadOptions();
    return () => {
      abortRequest(loadRequestRef);
    };
  }, [loadOptions, seeded]);

  /** Reintento explícito del usuario tras un error de carga: acá sí se vuelve a pedir. */
  const refresh = useCallback(() => {
    loadOptions();
  }, [loadOptions]);

  const persist = useCallback(async () => {
    const allergiesChanged = hasDiff(allergyIds, initialAllergyIds.current);
    const dietsChanged = hasDiff(dietIds, initialDietIds.current);

    // Sin cambios no se toca el backend: generar no debe disparar escrituras inútiles.
    // Al reintentar tras un fallo de generación esto da vacío, porque el `persist`
    // anterior ya había guardado.
    if (!allergiesChanged && !dietsChanged) return;

    const token = await getTokenRef.current();

    if (allergiesChanged) {
      await updateUserFoodAllergies(allergyIds, token);
      initialAllergyIds.current = [...allergyIds];
    }

    if (dietsChanged) {
      await updateUserTypeOfDiets(dietIds, token);
      initialDietIds.current = [...dietIds];
    }
  }, [allergyIds, dietIds]);

  return {
    allergies,
    diets,
    allergyIds,
    setAllergyIds,
    dietIds,
    setDietIds,
    targets,
    isLoading,
    error,
    refresh,
    options,
    persist,
  };
}
