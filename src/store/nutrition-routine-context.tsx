import { useAuth } from '@clerk/clerk-expo';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  acceptNutritionRoutine,
  generateNutritionRoutine,
  getActiveNutritionRoutine,
  rejectNutritionRoutine,
} from '../services/nutritionRoutine.service';
import {
  getSubscriptionErrorMessage,
  isInsufficientCreditsError,
  isSubscriptionModuleError,
} from '../services/subscription.service';
import { notifyInsufficientCredits } from '../components/features/subscription/notifyInsufficientCredits';
import { notifySubscriptionRequired } from '../components/features/subscription/notifySubscriptionRequired';
import { getOfflineNutritionRoutine } from '../offline/service';
import { NutritionRoutineDto, NutritionGenerationDraft } from '../types/nutritionRoutine';
import { toast } from '../components/ui/feedback';
import { GenerateNutritionPlanModal } from '../components/features/nutrition/GenerateNutritionPlanModal';

interface NutritionRoutineContextValue {
  /** Rutina activa confirmada por el usuario */
  routine: NutritionRoutineDto | null;
  /** Draft recién generado, pendiente de confirmación — solo en memoria */
  draft: NutritionRoutineDto | null;
  isLoading: boolean;
  isGenerating: boolean;
  isAccepting: boolean;
  isRejecting: boolean;
  error: string | null;
  /**
   * ÚNICO punto de entrada de "Generar plan" en toda la app: abre el modal donde el
   * usuario revisa alergias y tipos de dieta, persiste los cambios y recién ahí genera.
   *
   * El `generate` crudo NO se expone a propósito. El POST de generación no lleva body:
   * el backend lee alergias y dietas del perfil, así que generar sin pasar por el modal
   * usaría los datos viejos. Dejarlo público sería invitar a saltearse ese paso.
   *
   * El modal vive en el provider y no en cada pantalla para que sea uno solo, sin
   * duplicarse entre el Home, "Mis planes" y el tab Plan.
   *
   * @param onGenerationStarted Se ejecuta cuando la generación ARRANCA (no cuando
   * termina), y solo si se pudieron guardar los cambios. Sirve para navegar a la vista
   * que muestra el estado "generando": generar es una llamada a IA que tarda, así que
   * el usuario tiene que ver el progreso en el destino, no esperar en la pantalla del botón.
   */
  requestGenerate: (onGenerationStarted?: () => void) => void;
  /** Acepta el Draft actual y lo convierte en la rutina activa */
  accept: () => Promise<void>;
  /** Descarta el Draft actual sin tocar la rutina activa */
  reject: () => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => Promise<void>;
}

const NutritionRoutineContext = createContext<NutritionRoutineContextValue>({
  routine: null,
  draft: null,
  isLoading: false,
  isGenerating: false,
  isAccepting: false,
  isRejecting: false,
  error: null,
  requestGenerate: () => {},
  accept: async () => {},
  reject: async () => {},
  refresh: async () => {},
  clear: async () => {},
});

export function NutritionRoutineProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const mountedRef = useRef(true);

  getTokenRef.current = getToken;

  const [routine, setRoutine] = useState<NutritionRoutineDto | null>(null);
  const [draft, setDraft] = useState<NutritionRoutineDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Carga la rutina activa desde el backend. Si falla, conserva el snapshot descargado para offline. */
  const refresh = useCallback(async () => {
    setError(null);
    try {
      const token = await getTokenRef.current();
      const active = await getActiveNutritionRoutine(token);
      if (!mountedRef.current) return;
      setRoutine(active);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos cargar tu plan. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  /** Hidratación al montar: muestra snapshot offline si existe y luego sincroniza con backend. */
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);

    getOfflineNutritionRoutine()
      .then((stored) => {
        if (stored && mountedRef.current) setRoutine(stored);
      })
      .catch(() => {})
      .finally(() => {
        refresh();
      });

    return () => {
      mountedRef.current = false;
    };
  }, [refresh]);

  /**
   * Genera un Draft nuevo. El resultado NO se activa automáticamente.
   * Interno del provider: los disparadores usan `requestGenerate`, que además
   * persiste los cambios del modal antes de llegar acá.
   *
   * Maneja sus propios errores (toast / paywall) y expone el estado por `isGenerating`
   * y `error`, que es lo que consume la vista de destino mientras corre.
   *
   * Devuelve `true` solo si salió bien: como los errores no se relanzan, sin esto el
   * llamador no puede saber si corresponde reabrir el modal para reintentar.
   */
  const generate = useCallback(async (): Promise<boolean> => {
    if (isGenerating) return false;
    setIsGenerating(true);
    setError(null);
    setDraft(null);
    try {
      const token = await getTokenRef.current();
      const newDraft = await generateNutritionRoutine(token);
      if (!mountedRef.current) return false;
      setDraft(newDraft);
      return true;
    } catch (err: any) {
      if (isInsufficientCreditsError(err)) {
        if (mountedRef.current) setError(err?.message ?? 'No pudimos generar tu plan. Intentá de nuevo.');
        notifyInsufficientCredits('Te quedaste sin créditos para generar tu plan alimenticio.');
      } else if (isSubscriptionModuleError(err)) {
        // 403: el plan actual (ej. Fitness) no incluye el módulo Nutrición. No es un fallo:
        // avisamos al usuario con salida al paywall en vez del error genérico.
        const message =
          getSubscriptionErrorMessage(err) ??
          'Tu plan actual no incluye el módulo Nutrición. Actualizá tu plan para generar tu dieta.';
        if (mountedRef.current) setError(message);
        notifySubscriptionRequired(getSubscriptionErrorMessage(err) ?? undefined);
      } else {
        if (mountedRef.current) setError(err?.message ?? 'No pudimos generar tu plan. Intentá de nuevo.');
        toast.error('No pudimos generar tu plan alimenticio. Intentá de nuevo.', {
          title: 'Algo salió mal',
        });
      }
      return false;
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [isGenerating]);

  /* ── Modal de generación (uno solo para toda la app) ───────────────────── */

  const [isGenerateModalOpen, setGenerateModalOpen] = useState(false);
  /** Selección de la última tanda: se conserva si falla, para reabrir con los datos puestos. */
  const [generateDraft, setGenerateDraft] = useState<NutritionGenerationDraft | null>(null);
  /** Callback del disparador actual, para navegar al arrancar. En ref: no re-renderiza el provider. */
  const onGenerationStartedRef = useRef<(() => void) | null>(null);

  const requestGenerate = useCallback((onGenerationStarted?: () => void) => {
    onGenerationStartedRef.current = onGenerationStarted ?? null;
    setGenerateModalOpen(true);
  }, []);

  /** Cerrar a mano descarta el draft: el usuario abandonó, no está reintentando. */
  const closeGenerateModal = useCallback(() => {
    onGenerationStartedRef.current = null;
    setGenerateDraft(null);
    setGenerateModalOpen(false);
  }, []);

  /**
   * Cierra el modal, persiste los cambios de alergias/dietas y recién ahí genera.
   * El orden importa: el POST de generación no lleva body, el backend lee del perfil.
   * Si persistir falla NO se genera, porque la IA usaría los datos viejos.
   *
   * La navegación va ANTES del `await generate()`, no después: generar es una llamada a
   * IA que tarda, y `isGenerating` ya viaja por el contexto. Así el usuario aterriza en
   * la vista que muestra el esqueleto de "generando" y ve el progreso ahí, en vez de
   * quedarse esperando en la pantalla donde tocó el botón.
   */
  const handleGenerateSubmit = useCallback(
    async (draft: NutritionGenerationDraft, persist: () => Promise<void>) => {
      const onGenerationStarted = onGenerationStartedRef.current;
      setGenerateModalOpen(false);

      try {
        await persist();
      } catch {
        // Falló guardar: no generamos ni navegamos. El draft conserva el snapshot con
        // la base del diff SIN tocar (el servidor sigue con los valores viejos), así
        // que al reintentar el PUT se vuelve a disparar.
        setGenerateDraft(draft);
        toast.error('No pudimos guardar tus cambios. Intentá de nuevo.', {
          title: 'Error al guardar',
        });
        setGenerateModalOpen(true);
        return;
      }

      // Guardar salió bien ⇒ el servidor YA tiene esta selección. Adelantamos la base
      // del diff para que un reintento no repita un PUT que no cambia nada.
      const persistedDraft: NutritionGenerationDraft = {
        ...draft,
        options: {
          ...draft.options,
          selectedFoodAllergyIds: draft.allergyIds,
          selectedTypeOfDietIds: draft.dietIds,
        },
      };

      onGenerationStarted?.();
      onGenerationStartedRef.current = null;

      const succeeded = await generate();
      if (!mountedRef.current) return;

      if (succeeded) {
        setGenerateDraft(null); // éxito → se descarta, la próxima carga desde el backend
        return;
      }
      // Falló generar: `generate` ya avisó por toast/paywall. Reabrimos el modal sobre
      // la vista de destino, sembrado desde memoria y sin repetir ninguna llamada.
      setGenerateDraft(persistedDraft);
      setGenerateModalOpen(true);
    },
    [generate],
  );

  /** Acepta el Draft actual y lo convierte en la rutina activa. */
  const accept = useCallback(async () => {
    if (!draft || isAccepting) return;
    setIsAccepting(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const active = await acceptNutritionRoutine(draft.id, token);
      if (!mountedRef.current) return;
      setRoutine(active);
      setDraft(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos activar tu plan. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsAccepting(false);
    }
  }, [draft, isAccepting]);

  /** Descarta el Draft sin afectar la rutina activa. */
  const reject = useCallback(async () => {
    if (!draft || isRejecting) return;
    setIsRejecting(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      await rejectNutritionRoutine(draft.id, token);
      if (!mountedRef.current) return;
      setDraft(null);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos descartar el plan. Intentá de nuevo.');
      }
    } finally {
      if (mountedRef.current) setIsRejecting(false);
    }
  }, [draft, isRejecting]);

  const clear = useCallback(async () => {
    setRoutine(null);
    setDraft(null);
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      routine,
      draft,
      isLoading,
      isGenerating,
      isAccepting,
      isRejecting,
      error,
      requestGenerate,
      accept,
      reject,
      refresh,
      clear,
    }),
    [routine, draft, isLoading, isGenerating, isAccepting, isRejecting, error, requestGenerate, accept, reject, refresh, clear],
  );

  return (
    <NutritionRoutineContext.Provider value={value}>
      {children}
      {/* Único modal de generación de la app. Se monta solo cuando está abierto:
          montar overlays pesados cerrados dispara efectos y renders innecesarios
          (lección de `FoodSearchSheet`). */}
      {isGenerateModalOpen && (
        <GenerateNutritionPlanModal
          initialDraft={generateDraft}
          onClose={closeGenerateModal}
          onSubmit={handleGenerateSubmit}
        />
      )}
    </NutritionRoutineContext.Provider>
  );
}

export const useNutritionRoutineContext = () => useContext(NutritionRoutineContext);
