import { createPost, isContentBlockedError } from '@/src/services/forum.service';
import { CreatePostResult } from '@/src/types/forum';
import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useMemo, useRef, useState } from 'react';

/** Rutina propia elegida para adjuntar: el `versionId` es el que viaja al backend. */
export interface AttachedRoutineSelection {
  versionId: string;
  name: string;
}

interface UseCreatePostResult {
  title: string;
  setTitle: (value: string) => void;
  body: string;
  setBody: (value: string) => void;
  attachedRoutine: AttachedRoutineSelection | null;
  setAttachedRoutine: (routine: AttachedRoutineSelection | null) => void;
  isSubmitting: boolean;
  error: string | null;
  /** Términos marcados por el filtro (422). Se resaltan en el input para corregir. */
  flaggedTerms: string[];
  canSubmit: boolean;
  submit: () => Promise<CreatePostResult | null>;
}

/**
 * Estado del formulario de crear post. Centraliza el submit y el manejo del 422:
 * al recibir `ContentBlockedError`, expone `flaggedTerms` para que la pantalla los
 * resalte. Editar el cuerpo limpia el aviso (ya no aplica al texto nuevo).
 */
export function useCreatePost(): UseCreatePostResult {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [title, setTitleState] = useState('');
  const [body, setBodyState] = useState('');
  const [attachedRoutine, setAttachedRoutine] = useState<AttachedRoutineSelection | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flaggedTerms, setFlaggedTerms] = useState<string[]>([]);

  const setBody = useCallback((value: string) => {
    setBodyState(value);
    // El aviso de términos marcados deja de aplicar en cuanto el usuario edita el cuerpo.
    setFlaggedTerms((prev) => (prev.length ? [] : prev));
    setError(null);
  }, []);

  const setTitle = useCallback((value: string) => {
    setTitleState(value);
    setError(null);
  }, []);

  const canSubmit = useMemo(
    () => title.trim().length > 0 && body.trim().length > 0 && !isSubmitting,
    [title, body, isSubmitting],
  );

  const submit = useCallback(async (): Promise<CreatePostResult | null> => {
    if (title.trim().length === 0 || body.trim().length === 0) {
      setError('Completá el título y el cuerpo para publicar.');
      return null;
    }
    setIsSubmitting(true);
    setError(null);
    setFlaggedTerms([]);
    try {
      const token = await getTokenRef.current();
      return await createPost(
        {
          title: title.trim(),
          body: body.trim(),
          attachedRoutineVersionId: attachedRoutine?.versionId ?? null,
        },
        token,
      );
    } catch (err) {
      if (isContentBlockedError(err)) {
        setFlaggedTerms(err.flaggedTerms);
        setError(err.message);
      } else {
        logger.error('[useCreatePost] Error publicando:', err);
        setError(err instanceof Error ? err.message : 'No pudimos publicar. Intentá de nuevo.');
      }
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [title, body, attachedRoutine]);

  return {
    title, setTitle,
    body, setBody,
    attachedRoutine, setAttachedRoutine,
    isSubmitting, error, flaggedTerms, canSubmit, submit,
  };
}
