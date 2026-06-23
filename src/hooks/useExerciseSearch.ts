import { logger } from '@/src/utils/logger';
import {
  ExerciseSearchItem,
  getExerciseEquipments,
  getTargetMuscles,
  searchExercises,
} from '@/src/services/exercise.service';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 10;

/**
 * Lógica de búsqueda de ejercicios para `AddExerciseSheet`: término con debounce,
 * filtros de músculo/equipamiento (carga + selección), búsqueda paginada y
 * selección de un ejercicio. Los efectos se activan solo cuando `visible` es true.
 *
 * El componente consume el estado y los handlers; toda la mecánica de fetch,
 * debounce y deduplicación de búsquedas vive acá.
 */
export function useExerciseSearch(visible: boolean) {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  /* ── Estado de filtros y búsqueda ──────────────────────────────────────── */
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<string | null>(null);

  /* ── Estado de filtros disponibles ─────────────────────────────────────── */
  const [muscles, setMuscles] = useState<string[]>([]);
  const [equipments, setEquipments] = useState<string[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(false);

  /* ── Estado de ejercicios ──────────────────────────────────────────────── */
  const [exercises, setExercises] = useState<ExerciseSearchItem[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  /* ── Ref para evitar búsquedas duplicadas ──────────────────────────────── */
  const lastSearchRef = useRef({
    search: '',
    muscle: null as string | null,
    equipment: null as string | null,
  });

  /* ── Debounce para búsqueda ────────────────────────────────────────────── */
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 400);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  /* ── Cargar filtros al abrir ───────────────────────────────────────────── */
  useEffect(() => {
    if (!visible) return;

    let cancelled = false;

    const loadFilters = async () => {
      setLoadingFilters(true);
      try {
        const token = await getTokenRef.current();
        const [musclesRes, equipmentsRes] = await Promise.all([
          getTargetMuscles(token),
          getExerciseEquipments(token),
        ]);
        if (!cancelled) {
          setMuscles(musclesRes.map((m) => m.name));
          setEquipments(equipmentsRes.map((e) => e.name));
        }
      } catch (error) {
        logger.error('[AddExerciseSheet] Error cargando filtros:', error);
      } finally {
        if (!cancelled) setLoadingFilters(false);
      }
    };

    loadFilters();
    return () => { cancelled = true; };
  }, [visible]);

  /* ── Buscar ejercicios cuando cambian filtros/búsqueda ─────────────────── */
  useEffect(() => {
    if (!visible) return;

    // Evitar búsquedas duplicadas
    const currentSearch = debouncedSearch;
    const currentMuscle = selectedMuscle;
    const currentEquipment = selectedEquipment;

    if (
      lastSearchRef.current.search === currentSearch &&
      lastSearchRef.current.muscle === currentMuscle &&
      lastSearchRef.current.equipment === currentEquipment
    ) {
      return;
    }

    lastSearchRef.current = {
      search: currentSearch,
      muscle: currentMuscle,
      equipment: currentEquipment,
    };

    let cancelled = false;

    const doSearch = async () => {
      setLoadingExercises(true);
      setExercises([]);
      setPage(1);
      setHasNextPage(false);
      setSelectedExerciseId(null);

      try {
        const token = await getTokenRef.current();
        const res = await searchExercises(
          {
            searchTerm: currentSearch || undefined,
            targetMuscles: selectedMuscle ? [selectedMuscle] : undefined,
            equipments: selectedEquipment ? [selectedEquipment] : undefined,
            page: 1,
            pageSize: PAGE_SIZE,
          },
          token,
        );
        if (!cancelled) {
          setExercises(res.items);
          setHasNextPage(res.hasNextPage);
        }
      } catch (error) {
        logger.error('[AddExerciseSheet] Error buscando ejercicios:', error);
      } finally {
        if (!cancelled) setLoadingExercises(false);
      }
    };

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedSearch, selectedMuscle, selectedEquipment, visible]);

  /* ── Cargar más ejercicios (paginación) ────────────────────────────────── */
  const handleLoadMore = useCallback(async () => {
    if (loadingExercises || !hasNextPage) return;

    setLoadingExercises(true);
    try {
      const token = await getTokenRef.current();
      const res = await searchExercises(
        {
          searchTerm: debouncedSearch || undefined,
          targetMuscles: selectedMuscle ? [selectedMuscle] : undefined,
          equipments: selectedEquipment ? [selectedEquipment] : undefined,
          page: page + 1,
          pageSize: PAGE_SIZE,
        },
        token,
      );
      setExercises((prev) => [...prev, ...res.items]);
      setHasNextPage(res.hasNextPage);
      setPage((p) => p + 1);
    } catch (error) {
      logger.error('[AddExerciseSheet] Error cargando más ejercicios:', error);
    } finally {
      setLoadingExercises(false);
    }
  }, [debouncedSearch, selectedMuscle, selectedEquipment, loadingExercises, hasNextPage, page]);

  /* ── Handlers de filtros y selección ───────────────────────────────────── */
  const selectMuscle = useCallback((name: string) => {
    setSelectedMuscle((prev) => (prev === name ? null : name));
  }, []);

  const selectEquipment = useCallback((name: string) => {
    setSelectedEquipment((prev) => (prev === name ? null : name));
  }, []);

  const handleSelectExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  }, []);

  /* ── Reset de toda la búsqueda (para próxima apertura) ─────────────────── */
  const reset = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedMuscle(null);
    setSelectedEquipment(null);
    setExercises([]);
    setSelectedExerciseId(null);
    setPage(1);
    setHasNextPage(false);
    lastSearchRef.current = { search: '', muscle: null, equipment: null };
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    selectedMuscle,
    selectedEquipment,
    selectMuscle,
    selectEquipment,
    muscles,
    equipments,
    loadingFilters,
    exercises,
    loadingExercises,
    hasNextPage,
    handleLoadMore,
    selectedExerciseId,
    handleSelectExercise,
    reset,
  };
}
