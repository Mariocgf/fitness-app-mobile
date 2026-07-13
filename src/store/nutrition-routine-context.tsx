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
import { isInsufficientCreditsError } from '../services/subscription.service';
import { notifyInsufficientCredits } from '../components/features/subscription/notifyInsufficientCredits';
import { getOfflineNutritionRoutine } from '../offline/service';
import { NutritionRoutineDto } from '../types/nutritionRoutine';
import { toast } from '../components/ui/feedback';

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
  /** Genera un nuevo Draft (reemplaza el Draft anterior en el backend automáticamente) */
  generate: () => Promise<void>;
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
  generate: async () => {},
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

  /** Genera un Draft nuevo. El resultado NO se activa automáticamente. */
  const generate = useCallback(async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setError(null);
    setDraft(null);
    try {
      const token = await getTokenRef.current();
      const newDraft = await generateNutritionRoutine(token);
      if (!mountedRef.current) return;
      setDraft(newDraft);
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err?.message ?? 'No pudimos generar tu plan. Intentá de nuevo.');
      }
      if (isInsufficientCreditsError(err)) {
        notifyInsufficientCredits('Te quedaste sin créditos para generar tu plan alimenticio.');
      } else {
        toast.error('No pudimos generar tu plan alimenticio. Intentá de nuevo.', {
          title: 'Algo salió mal',
        });
      }
    } finally {
      if (mountedRef.current) setIsGenerating(false);
    }
  }, [isGenerating]);

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
      generate,
      accept,
      reject,
      refresh,
      clear,
    }),
    [routine, draft, isLoading, isGenerating, isAccepting, isRejecting, error, generate, accept, reject, refresh, clear],
  );

  return (
    <NutritionRoutineContext.Provider value={value}>
      {children}
    </NutritionRoutineContext.Provider>
  );
}

export const useNutritionRoutineContext = () => useContext(NutritionRoutineContext);
