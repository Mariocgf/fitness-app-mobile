import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import { getMoodLogs, postMoodLog } from "../services/wellness.service";
import { bumpWellnessData } from "../store/wellness-sync";
import { AddMoodLogDto, MoodLogDto } from "../types/wellness";
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from "../utils/request-cancellation";

interface UseMoodHistoryOptions {
  /** Si es true (por defecto), carga la primera página al montar. */
  autoLoad?: boolean;
  /** Cantidad de ítems por página. Por defecto 10. */
  pageSize?: number;
}

interface UseMoodHistoryReturn {
  logs: MoodLogDto[];
  /** El registro más reciente (primer ítem del orden descendente), o null si no hay ninguno. */
  lastLog: MoodLogDto | null;
  /** Total de registros del usuario (incluye páginas no cargadas). */
  totalCount: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  /** Carga la siguiente página y la agrega al historial. */
  loadMore: () => void;
  /** Recarga la primera página desde el backend. */
  refresh: () => void;
  /** Registra un nuevo ánimo. Devuelve el DTO creado o null si hubo error. */
  submit: (payload: AddMoodLogDto) => Promise<MoodLogDto | null>;
}

/**
 * Gestiona el historial paginado de registros de ánimo (GET /api/mood).
 * Sigue el patrón estable del proyecto (getTokenRef, carga en mount, sin loops),
 * idéntico a `useSleepHistory`. El endpoint devuelve orden descendente: logs[0]
 * es el más reciente.
 */
export function useMoodHistory(
  options: UseMoodHistoryOptions = {},
): UseMoodHistoryReturn {
  const { autoLoad = true, pageSize = 10 } = options;

  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [logs, setLogs] = useState<MoodLogDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  /** Carga la primera página de registros desde el backend. */
  const loadFirstPage = useCallback(async () => {
    abortRequest(loadMoreRequestRef);
    const controller = beginAbortableRequest(firstPageRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getMoodLogs(token, 1, pageSize, signal);
      if (!isCurrentRequest(firstPageRequestRef, controller)) return;
      setLogs(result.items);
      setTotalCount(result.totalCount);
      setCurrentPage(1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(
        "No pudimos cargar tu historial de ánimo. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      if (isCurrentRequest(firstPageRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(firstPageRequestRef, controller);
    }
  }, [pageSize]);

  // Carga inicial al montar (solo si autoLoad está activo).
  useEffect(() => {
    if (autoLoad) {
      loadFirstPage();
    }
    return () => {
      abortRequest(firstPageRequestRef);
      abortRequest(loadMoreRequestRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Carga la siguiente página y la concatena al historial. */
  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    const controller = beginAbortableRequest(loadMoreRequestRef);
    const { signal } = controller;

    setIsLoadingMore(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getMoodLogs(token, currentPage + 1, pageSize, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setLogs((prev) => [...prev, ...result.items]);
      setTotalCount(result.totalCount);
      setCurrentPage((prev) => prev + 1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError("No pudimos cargar más registros. Tocar para reintentar.");
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [isLoadingMore, currentPage, pageSize]);

  /** Registra un nuevo ánimo en el backend. */
  const submit = useCallback(
    async (payload: AddMoodLogDto): Promise<MoodLogDto | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const created = await postMoodLog(payload, token);
        // Mutación: avanza la versión para que Bienestar/Ánimo refresquen al volver.
        bumpWellnessData();
        return created;
      } catch {
        setSubmitError(
          "No pudimos guardar tu ánimo. Revisá tu conexión e intentá de nuevo.",
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  // El endpoint devuelve orden descendente: el primer ítem es el más reciente.
  const lastLog = logs.length > 0 ? logs[0] : null;

  return {
    logs,
    lastLog,
    totalCount,
    hasMore: logs.length < totalCount,
    isLoading,
    isLoadingMore,
    error,
    isSubmitting,
    submitError,
    loadMore,
    refresh: loadFirstPage,
    submit,
  };
}
