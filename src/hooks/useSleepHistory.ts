import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import { getSleepLogs, postSleepLog } from "../services/wellness.service";
import { bumpWellnessData } from "../store/wellness-sync";
import { AddSleepLogDto, SleepLogDto } from "../types/wellness";

interface UseSleepHistoryOptions {
  /** Si es true (por defecto), carga la primera página al montar. */
  autoLoad?: boolean;
  /** Cantidad de ítems por página. Por defecto 10. */
  pageSize?: number;
}

interface UseSleepHistoryReturn {
  logs: SleepLogDto[];
  /** El registro más reciente (primer ítem del orden descendente), o null si no hay ninguno. */
  lastLog: SleepLogDto | null;
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
  /** Registra un nuevo sueño. Devuelve el DTO creado o null si hubo error. */
  submit: (payload: AddSleepLogDto) => Promise<SleepLogDto | null>;
}

/**
 * Gestiona el historial paginado de registros de sueño (GET /api/sleep).
 * Sigue el patrón estable del proyecto (getTokenRef, carga en mount, sin loops).
 * El endpoint devuelve orden descendente: logs[0] es el más reciente.
 * El registro de nuevos sueños (POST) llega en una fase futura de formularios.
 */
export function useSleepHistory(
  options: UseSleepHistoryOptions = {},
): UseSleepHistoryReturn {
  const { autoLoad = true, pageSize = 10 } = options;

  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState.
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [logs, setLogs] = useState<SleepLogDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Carga la primera página de registros desde el backend. */
  const loadFirstPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const result = await getSleepLogs(token, 1, pageSize);
      setLogs(result.items);
      setTotalCount(result.totalCount);
      setCurrentPage(1);
    } catch {
      setError(
        "No pudimos cargar tu historial de sueño. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Carga inicial al montar (solo si autoLoad está activo).
  useEffect(() => {
    if (autoLoad) {
      loadFirstPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Carga la siguiente página y la concatena al historial. */
  const loadMore = useCallback(async () => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const result = await getSleepLogs(token, currentPage + 1, pageSize);
      setLogs((prev) => [...prev, ...result.items]);
      setTotalCount(result.totalCount);
      setCurrentPage((prev) => prev + 1);
    } catch {
      setError("No pudimos cargar más registros. Tocar para reintentar.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, currentPage, pageSize]);

  /** Registra un nuevo sueño en el backend. */
  const submit = useCallback(
    async (payload: AddSleepLogDto): Promise<SleepLogDto | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const created = await postSleepLog(payload, token);
        // Mutación: avanza la versión para que Bienestar/Sueño refresquen al volver.
        bumpWellnessData();
        return created;
      } catch {
        setSubmitError(
          "No pudimos guardar tu sueño. Revisá tu conexión e intentá de nuevo.",
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
