import { logger } from '@/src/utils/logger';
import { useMyRoutines } from '@/src/hooks/useMyRoutines';
import { activateRoutine, deleteRoutine, getRoutineById } from '@/src/services/routine.service';
import { useRoutineDetailContext } from '@/src/store/routine-detail-context';
import { Routine, RoutineSummary } from '@/src/types/routine';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '@/src/utils/request-cancellation';
import { useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
export type DatePreset = 'all' | 'week' | 'month';

/**
 * Estado y handlers de la pantalla "Mis rutinas" (`app/(tabs)/fitness/routines.tsx`):
 * listado paginado (vía `useMyRoutines`), filtros de source/fecha, apertura del
 * detalle de una rutina y acciones (activar / eliminar / actualizar). La pantalla
 * solo consume estos valores para renderizar la lista y el detalle.
 */
export function useRoutinesScreen() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  React.useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const {
    routines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    dateRange,
    sourceFilter,
    setDateRange,
    setSourceFilter,
    loadMore,
    applyFilters,
    refresh,
  } = useMyRoutines(token);

  const [refreshing, setRefreshing] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  /* ── Contexto para comunicar estado al tab bar ─────────────────────────── */
  const { setDetailVisible, activeRoutine, setViewingActiveRoutine } = useRoutineDetailContext();

  /* ── Estado para detalle de rutina ────────────────────────────────────── */
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedRoutineSummary, setSelectedRoutineSummary] = useState<RoutineSummary | null>(null);
  const [isLoadingRoutine, setIsLoadingRoutine] = useState(false);
  const detailRequestRef = React.useRef<AbortController | null>(null);

  /* ── Rutina activa primero, luego el resto ────────────────────────────── */
  const sortedRoutines = useMemo(
    () => [...routines].sort((a, b) => Number(b.isActive) - Number(a.isActive)),
    [routines],
  );

  /* ── Filtro de fecha (preset derivado del rango) ──────────────────────── */
  const activeDatePreset: DatePreset = useMemo(() => {
    const fromMs = dateRange.from?.getTime();
    if (!fromMs) return 'all';
    const now = Date.now();
    if (Math.abs(fromMs - (now - WEEK_MS)) < 60_000) return 'week';
    if (Math.abs(fromMs - (now - MONTH_MS)) < 60_000) return 'month';
    return 'all';
  }, [dateRange]);

  const hasDateFilter = activeDatePreset !== 'all';

  const setDatePreset = useCallback((preset: DatePreset) => {
    const now = Date.now();
    if (preset === 'week') setDateRange({ from: new Date(now - WEEK_MS), to: new Date() });
    else if (preset === 'month') setDateRange({ from: new Date(now - MONTH_MS), to: new Date() });
    else setDateRange({ from: null, to: null });
  }, [setDateRange]);

  const handleBack = useCallback(() => {
    router.push('/fitness');
  }, [router]);

  const handleCreate = useCallback(() => {
    // El overlay de creación vive en fitness/index.tsx → navegamos con param
    router.push({ pathname: '/fitness', params: { openCreate: '1' } });
  }, [router]);

  const handleCloseDetail = useCallback(() => {
    abortRequest(detailRequestRef);
    setSelectedRoutine(null);
    setSelectedRoutineSummary(null);
    setDetailVisible(false);
    setViewingActiveRoutine(false);
  }, [setDetailVisible, setViewingActiveRoutine]);

  const handleDeleteRoutine = useCallback(async () => {
    if (!selectedRoutine) return;

    Alert.alert(
      'Eliminar rutina',
      '¿Eliminar esta rutina? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              if (!token) {
                Alert.alert('Error', 'Usuario no autenticado');
                return;
              }
              await deleteRoutine(selectedRoutine.id, token);
              handleCloseDetail();
              Alert.alert('Éxito', 'La rutina fue eliminada correctamente');
              refresh();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'No se pudo eliminar la rutina');
            }
          },
        },
      ],
    );
  }, [selectedRoutine, getToken, handleCloseDetail, refresh]);

  const handleActivateRoutine = useCallback(async (r: Routine) => {
    try {
      const token = await getToken();
      const activated = await activateRoutine(r.id, token);
      setSelectedRoutine(activated);
      await refresh();
    } catch {
      Alert.alert('Error', 'No se pudo activar la rutina. Intentá de nuevo.');
    }
  }, [getToken, refresh]);

  const handleRegenerate = useCallback(async () => {
    // TODO: Implementar regeneración si es necesario
  }, []);

  const handleRoutineUpdated = useCallback(async (updated: Routine) => {
    setSelectedRoutine(updated);
    await refresh();
  }, [refresh]);

  const handleRoutinePress = useCallback(async (routineSummary: RoutineSummary) => {
    abortRequest(detailRequestRef);
    setSelectedRoutineSummary(routineSummary);
    setDetailVisible(true);

    const isActiveRoutine = routineSummary.id === activeRoutine?.id;
    if (isActiveRoutine && activeRoutine) {
      setViewingActiveRoutine(true);
      setSelectedRoutine(activeRoutine);
      setIsLoadingRoutine(false);
      return;
    }

    const controller = beginAbortableRequest(detailRequestRef);
    const { signal } = controller;

    setIsLoadingRoutine(true);
    try {
      const token = await getToken();
      if (signal.aborted) return;
      const fullRoutine = await getRoutineById(routineSummary.id, token, signal);
      if (!isCurrentRequest(detailRequestRef, controller)) return;
      setSelectedRoutine(fullRoutine);
    } catch (error) {
      if (signal.aborted || isRequestCanceled(error)) return;
      logger.error('[RoutinesScreen] Error fetching routine:', error);
      Alert.alert('Error', 'No se pudo cargar la rutina. Intentá de nuevo.');
    } finally {
      if (isCurrentRequest(detailRequestRef, controller)) {
        setIsLoadingRoutine(false);
      }
      endAbortableRequest(detailRequestRef, controller);
    }
  }, [getToken, activeRoutine, setDetailVisible, setViewingActiveRoutine]);

  React.useEffect(() => () => {
    abortRequest(detailRequestRef);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }, [refresh]);

  const handleClearFilters = useCallback(() => {
    setDateRange({ from: null, to: null });
    setSourceFilter('all');
    applyFilters();
  }, [setDateRange, setSourceFilter, applyFilters]);

  return {
    // listado / filtros
    routines,
    sortedRoutines,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    sourceFilter,
    setSourceFilter,
    loadMore,
    refresh,
    refreshing,
    showDateFilter,
    setShowDateFilter,
    activeDatePreset,
    hasDateFilter,
    setDatePreset,
    // detalle
    selectedRoutine,
    selectedRoutineSummary,
    isLoadingRoutine,
    // handlers
    handleBack,
    handleCreate,
    handleCloseDetail,
    handleDeleteRoutine,
    handleActivateRoutine,
    handleRegenerate,
    handleRoutineUpdated,
    handleRoutinePress,
    handleRefresh,
    handleClearFilters,
  };
}
