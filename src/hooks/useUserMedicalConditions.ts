import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getUserMedicalConditions,
  setMedicalConditionAiConsent,
} from "../services/health.service";
import { UserMedicalConditionDto } from "../types/health";
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from "../utils/request-cancellation";

interface UseUserMedicalConditionsOptions {
  /** Si es true (por defecto), carga las condiciones al montar. */
  autoLoad?: boolean;
}

interface UseUserMedicalConditionsReturn {
  conditions: UserMedicalConditionDto[];
  isLoading: boolean;
  error: string | null;
  /** Recarga las condiciones del usuario desde el backend. */
  refresh: () => void;
  /**
   * Activa/desactiva el uso por IA de una condición (PUT .../ai-consent).
   * Optimista: actualiza el toggle al toque y revierte si el backend falla.
   */
  toggleAiConsent: (conditionId: string, enabled: boolean) => Promise<void>;
}

/**
 * Gestiona las condiciones médicas del usuario y su consentimiento de IA por condición.
 * Las condiciones arrancan con `allowAiUsage: true` por defecto (default ON del contrato).
 */
export function useUserMedicalConditions(
  options: UseUserMedicalConditionsOptions = {},
): UseUserMedicalConditionsReturn {
  const { autoLoad = true } = options;

  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [conditions, setConditions] = useState<UserMedicalConditionDto[]>([]);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  /** Carga las condiciones del usuario desde el backend. */
  const load = useCallback(async () => {
    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getUserMedicalConditions(token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setConditions(result);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(
        "No pudimos cargar tus condiciones médicas. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
    return () => {
      abortRequest(loadRequestRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Togglea el consentimiento de una condición con actualización optimista. */
  const toggleAiConsent = useCallback(
    async (conditionId: string, enabled: boolean): Promise<void> => {
      // Optimista: el switch responde al toque
      setConditions((prev) =>
        prev.map((c) =>
          c.id === conditionId ? { ...c, allowAiUsage: enabled } : c,
        ),
      );
      try {
        const token = await getTokenRef.current();
        await setMedicalConditionAiConsent(conditionId, enabled, token);
      } catch {
        // Rollback al estado anterior si el backend rechaza
        setConditions((prev) =>
          prev.map((c) =>
            c.id === conditionId ? { ...c, allowAiUsage: !enabled } : c,
          ),
        );
      }
    },
    [],
  );

  return { conditions, isLoading, error, refresh: load, toggleAiConsent };
}
