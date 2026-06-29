import { useAuth } from "@clerk/clerk-expo";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  getClinicalReadings,
  postClinicalReading,
} from "../services/clinical.service";
import { ClinicalReadingDto, ClinicalReadingPayload } from "../types/clinical";
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from "../utils/request-cancellation";

interface UseClinicalReadingsOptions {
  /** Si es true (por defecto), carga la primera página al montar. */
  autoLoad?: boolean;
  /** Cantidad de ítems por página. Por defecto 10. */
  pageSize?: number;
}

interface UseClinicalReadingsReturn {
  readings: ClinicalReadingDto[];
  /** La lectura más reciente (primer ítem del orden descendente), o null si no hay ninguna. */
  lastReading: ClinicalReadingDto | null;
  /** Total de lecturas del usuario (incluye páginas no cargadas). */
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
  /** Registra una nueva lectura. Devuelve el DTO creado o null si hubo error. */
  submit: (
    payload: ClinicalReadingPayload,
  ) => Promise<ClinicalReadingDto | null>;
}

/**
 * Gestiona el historial paginado de lecturas clínicas y el registro de nuevas lecturas.
 * Sirve al dashboard (autoLoad, lastReading/totalCount), al historial (loadMore)
 * y al formulario (autoLoad=false, solo submit).
 * El endpoint devuelve orden descendente: readings[0] es la más reciente.
 */
export function useClinicalReadings(
  options: UseClinicalReadingsOptions = {},
): UseClinicalReadingsReturn {
  const { autoLoad = true, pageSize = 10 } = options;

  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [readings, setReadings] = useState<ClinicalReadingDto[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstPageRequestRef = useRef<AbortController | null>(null);
  const loadMoreRequestRef = useRef<AbortController | null>(null);

  /** Carga la primera página de lecturas desde el backend. */
  const loadFirstPage = useCallback(async () => {
    abortRequest(loadMoreRequestRef);
    const controller = beginAbortableRequest(firstPageRequestRef);
    const { signal } = controller;

    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      if (signal.aborted) return;
      const result = await getClinicalReadings(token, 1, pageSize, signal);
      if (!isCurrentRequest(firstPageRequestRef, controller)) return;
      setReadings(result.items);
      setTotalCount(result.totalCount);
      setCurrentPage(1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError(
        "No pudimos cargar tus lecturas clínicas. Revisá tu conexión e intentá de nuevo.",
      );
    } finally {
      if (isCurrentRequest(firstPageRequestRef, controller)) {
        setIsLoading(false);
      }
      endAbortableRequest(firstPageRequestRef, controller);
    }
  }, [pageSize]);

  // Carga inicial solo si autoLoad está activo
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
      const result = await getClinicalReadings(token, currentPage + 1, pageSize, signal);
      if (!isCurrentRequest(loadMoreRequestRef, controller)) return;
      setReadings((prev) => [...prev, ...result.items]);
      setTotalCount(result.totalCount);
      setCurrentPage((prev) => prev + 1);
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return;
      setError("No pudimos cargar más lecturas. Tocar para reintentar.");
    } finally {
      if (isCurrentRequest(loadMoreRequestRef, controller)) {
        setIsLoadingMore(false);
      }
      endAbortableRequest(loadMoreRequestRef, controller);
    }
  }, [isLoadingMore, currentPage, pageSize]);

  /** Registra una nueva lectura clínica. */
  const submit = useCallback(
    async (
      payload: ClinicalReadingPayload,
    ): Promise<ClinicalReadingDto | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const result = await postClinicalReading(payload, token);
        return result;
      } catch {
        setSubmitError(
          "No pudimos guardar la lectura. Revisá tu conexión e intentá de nuevo.",
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  // El endpoint devuelve orden descendente: el primer ítem es el más reciente
  const lastReading = readings.length > 0 ? readings[0] : null;

  return {
    readings,
    lastReading,
    totalCount,
    hasMore: readings.length < totalCount,
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
