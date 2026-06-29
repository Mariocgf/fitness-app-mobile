import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getClinicalProfile,
  updateAiConsent,
  updateClinicalProfile,
} from "../services/clinical.service";
import { ClinicalProfileDto, ClinicalProfilePayload } from "../types/clinical";
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from "../utils/request-cancellation";

interface UseClinicalProfileOptions {
  /** Si es true (por defecto), carga el perfil al montar el componente. */
  autoLoad?: boolean;
}

interface UseClinicalProfileReturn {
  profile: ClinicalProfileDto | null;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  /** Recarga el perfil desde el backend. */
  refresh: () => void;
  /** Guarda grupo sanguíneo, Rh y flags (PUT /profile). NO toca allowAiUsage. */
  updateProfile: (
    payload: ClinicalProfilePayload,
  ) => Promise<ClinicalProfileDto | null>;
  /** Activa/desactiva el consentimiento de IA (PUT /ai-consent). */
  setAiConsent: (enabled: boolean) => Promise<ClinicalProfileDto | null>;
}

/**
 * Gestiona el perfil clínico del usuario: carga, actualización de campos y consentimiento de IA.
 * El consentimiento se persiste por separado (PUT /ai-consent) del resto del perfil (PUT /profile).
 */
export function useClinicalProfile(
  options: UseClinicalProfileOptions = {},
): UseClinicalProfileReturn {
  const { autoLoad = true } = options;

  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [profile, setProfile] = useState<ClinicalProfileDto | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const loadRequestRef = useRef<AbortController | null>(null);

  /** Carga el perfil clínico desde el backend. */
  const load = useCallback(async () => {
    const controller = beginAbortableRequest(loadRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getClinicalProfile(token, signal);
      if (!isCurrentRequest(loadRequestRef, controller)) return;
      setProfile(result);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(
        "No pudimos cargar tu perfil clínico. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      if (isCurrentRequest(loadRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(loadRequestRef, controller);
    }
  }, []);

  // Carga inicial solo si autoLoad está activo
  useEffect(() => {
    if (autoLoad) {
      load();
    }
    return () => {
      abortRequest(loadRequestRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Guarda los campos del perfil (grupo sanguíneo, Rh, flags). */
  const updateProfile = useCallback(
    async (
      payload: ClinicalProfilePayload,
    ): Promise<ClinicalProfileDto | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const result = await updateClinicalProfile(payload, token);
        setProfile(result);
        return result;
      } catch {
        setSubmitError(
          "No pudimos guardar tu perfil clínico. Revisá tu conexión e intentá de nuevo.",
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  /** Actualiza el consentimiento de IA. Refleja en `profile` la respuesta del backend. */
  const setAiConsent = useCallback(
    async (enabled: boolean): Promise<ClinicalProfileDto | null> => {
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const result = await updateAiConsent(enabled, token);
        setProfile(result);
        return result;
      } catch {
        setSubmitError(
          "No pudimos actualizar el consentimiento de IA. Intentá de nuevo.",
        );
        return null;
      }
    },
    [],
  );

  return {
    profile,
    isLoading,
    error,
    isSubmitting,
    submitError,
    refresh: load,
    updateProfile,
    setAiConsent,
  };
}
