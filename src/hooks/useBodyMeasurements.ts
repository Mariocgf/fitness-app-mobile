import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  getBodyMeasurements,
  postBodyMeasurement,
} from '../services/health.service';
import { BodyMeasurementDto, BodyMeasurementPayload } from '../types/health';

interface UseBodyMeasurementsOptions {
  /** Si es true (por defecto), carga el historial al montar el componente. */
  autoLoad?: boolean;
  /** Cantidad de ítems a cargar. Por defecto 4 (para el dashboard). */
  pageSize?: number;
}

interface UseBodyMeasurementsReturn {
  measurements: BodyMeasurementDto[];
  /** La medición más reciente (primer ítem del orden descendente), o null si no hay ninguna. */
  lastMeasurement: BodyMeasurementDto | null;
  /** Total de mediciones del usuario (incluye páginas no cargadas). */
  totalCount: number;
  isLoading: boolean;
  error: string | null;
  isSubmitting: boolean;
  submitError: string | null;
  /** Recarga el historial desde el backend. */
  refresh: () => void;
  /** Envía una nueva medición al backend. Devuelve el DTO creado o null si hubo error. */
  submit: (payload: BodyMeasurementPayload) => Promise<BodyMeasurementDto | null>;
}

/**
 * Gestiona el historial de mediciones corporales y el envío de nuevas mediciones.
 * Usa autoLoad=false en pantallas que solo necesitan submit (ej: formulario).
 * El endpoint devuelve ítems en orden descendente: items[0] es el más reciente.
 */
export function useBodyMeasurements(
  options: UseBodyMeasurementsOptions = {},
): UseBodyMeasurementsReturn {
  const { autoLoad = true, pageSize = 4 } = options;

  const { getToken } = useAuth();
  // Referencia estable para no incluir getToken como dep de efectos con setState
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [measurements, setMeasurements] = useState<BodyMeasurementDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Carga la primera página de mediciones desde el backend. */
  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getTokenRef.current();
      const paged = await getBodyMeasurements(token, 1, pageSize);
      setMeasurements(paged.items);
      setTotalCount(paged.totalCount);
    } catch {
      setError('No pudimos cargar las mediciones. Revisá tu conexión e intentá de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  // Carga inicial solo si autoLoad está activo
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Envía una nueva medición al backend. */
  const submit = useCallback(
    async (payload: BodyMeasurementPayload): Promise<BodyMeasurementDto | null> => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const token = await getTokenRef.current();
        const result = await postBodyMeasurement(payload, token);
        return result;
      } catch {
        setSubmitError(
          'No pudimos guardar la medición. Revisá tu conexión e intentá de nuevo.',
        );
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [],
  );

  // El endpoint devuelve orden descendente: el primer ítem es el más reciente
  const lastMeasurement = measurements.length > 0 ? measurements[0] : null;

  return {
    measurements,
    lastMeasurement,
    totalCount,
    isLoading,
    error,
    isSubmitting,
    submitError,
    refresh: load,
    submit,
  };
}
