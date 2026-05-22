import { translateEquipment, translateMuscle } from '@/src/i18n';
import {
  ExerciseSearchItem,
  getExerciseEquipments,
  getTargetMuscles,
  searchExercises,
} from '@/src/services/exercise.service';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              Props                                          */
/* ──────────────────────────────────────────────────────────────────────────── */

interface AddExerciseSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (exercise: ExerciseSearchItem) => void;
  confirmLabel?: string;
  excludedExerciseIds?: string[];
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*                         AddExerciseSheet                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

export const AddExerciseSheet: React.FC<AddExerciseSheetProps> = ({
  visible,
  onClose,
  onAdd,
  confirmLabel = 'Agregar',
  excludedExerciseIds = [],
}) => {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  /* ── Refs para valores inestables que no deben causar re-renders ─────── */

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

  /* ── Estado de ejercicios ────────────────────────────────────────────── */

  const [exercises, setExercises] = useState<ExerciseSearchItem[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  /* ── Refs para controlar triggers y evitar loops ────────────────────────── */

  const lastSearchRef = useRef({
    search: '',
    muscle: null as string | null,
    equipment: null as string | null,
  });

  /* ── Debounce para búsqueda ───────────────────────────────────────────── */

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
        console.error('[AddExerciseSheet] Error cargando filtros:', error);
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
            pageSize: 10,
          },
          token,
        );
        if (!cancelled) {
          setExercises(res.items);
          setHasNextPage(res.hasNextPage);
        }
      } catch (error) {
        console.error('[AddExerciseSheet] Error buscando ejercicios:', error);
      } finally {
        if (!cancelled) setLoadingExercises(false);
      }
    };

    doSearch();
    return () => { cancelled = true; };
  }, [debouncedSearch, selectedMuscle, selectedEquipment, visible]);

  /* ── Cargar más ejercicios (paginación) ───────────────────────────────── */

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
          pageSize: 10,
        },
        token,
      );
      setExercises((prev) => [...prev, ...res.items]);
      setHasNextPage(res.hasNextPage);
      setPage((p) => p + 1);
    } catch (error) {
      console.error('[AddExerciseSheet] Error cargando más ejercicios:', error);
    } finally {
      setLoadingExercises(false);
    }
  }, [debouncedSearch, selectedMuscle, selectedEquipment, loadingExercises, hasNextPage, page]);

  /* ── Handlers de filtros ────────────────────────────────────────────────── */

  const selectMuscle = useCallback((name: string) => {
    setSelectedMuscle((prev) => (prev === name ? null : name));
  }, []);

  const selectEquipment = useCallback((name: string) => {
    setSelectedEquipment((prev) => (prev === name ? null : name));
  }, []);

  /* ── Handlers de selección ─────────────────────────────────────────────── */

  const handleSelectExercise = useCallback((exerciseId: string) => {
    setSelectedExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  }, []);

  const handleAdd = useCallback(() => {
    if (!selectedExerciseId) return;
    const selected = exercises.find((e) => e.exerciseId === selectedExerciseId);
    if (selected) {
      onAdd(selected);
    }
    // Reset state para próxima apertura
    setSearchTerm('');
    setDebouncedSearch('');
    setSelectedMuscle(null);
    setSelectedEquipment(null);
    setExercises([]);
    setSelectedExerciseId(null);
    setPage(1);
    setHasNextPage(false);
    lastSearchRef.current = { search: '', muscle: null, equipment: null };
    onClose();
  }, [selectedExerciseId, exercises, onAdd, onClose]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  const selectedExercise = useMemo(
    () => exercises.find((e) => e.exerciseId === selectedExerciseId),
    [exercises, selectedExerciseId],
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50">
        {/* Overlay opaco para cerrar */}
        <Pressable className="flex-1" onPress={onClose} />

        {/* Sheet - altura fija para evitar recálculos de layout */}
        <View
          className="bg-white dark:bg-slate-900 rounded-t-3xl overflow-hidden"
          style={{ height: '85%', paddingBottom: insets.bottom + 20 }}
        >
          {/* Header */}
          <View className="px-5 pt-5 pb-3">
            <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
              Ejercicios
            </Text>

            {/* Búsqueda */}
            <View className="flex-row items-center bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-3">
              <Ionicons name="search-outline" size={18} color="#94a3b8" />
              <TextInput
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Buscar ejercicio…"
                placeholderTextColor="#94a3b8"
                className="flex-1 ml-2 text-base text-slate-900 dark:text-white"
                returnKeyType="search"
              />
              {searchTerm.length > 0 && (
                <TouchableOpacity onPress={() => setSearchTerm('')}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Músculos */}
            <View className="px-5 mb-4">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Músculo
              </Text>
              {loadingFilters ? (
                <ActivityIndicator size="small" color="#a3e635" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {muscles.map((muscle) => {
                      const isSelected = selectedMuscle === muscle;
                      return (
                        <TouchableOpacity
                          key={muscle}
                          onPress={() => selectMuscle(muscle)}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              isSelected ? 'text-white dark:text-zinc-950' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {translateMuscle(muscle)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Equipamiento */}
            <View className="px-5 mb-4">
              <Text className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Equipamiento
              </Text>
              {loadingFilters ? (
                <ActivityIndicator size="small" color="#a3e635" />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {equipments.map((eq) => {
                      const isSelected = selectedEquipment === eq;
                      return (
                        <TouchableOpacity
                          key={eq}
                          onPress={() => selectEquipment(eq)}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-zinc-950 dark:bg-zinc-50 border-zinc-950 dark:border-zinc-50'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <Text
                            className={`text-sm font-medium ${
                              isSelected ? 'text-white dark:text-zinc-950' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {translateEquipment(eq)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}
            </View>

            {/* Lista de ejercicios */}
            <View className="px-5 pb-4">
              {loadingExercises && exercises.length === 0 ? (
                <ActivityIndicator size="large" color="#a3e635" className="py-8" />
              ) : exercises.length === 0 ? (
                <View className="items-center py-8">
                  <Ionicons name="barbell-outline" size={40} color="#94a3b8" />
                  <Text className="text-slate-400 dark:text-slate-500 mt-2">
                    No se encontraron ejercicios
                  </Text>
                </View>
              ) : (
                <>
                  {exercises.map((exercise) => {
                    const isSelected = selectedExerciseId === exercise.exerciseId;
                    const isExcluded = excludedExerciseIds.includes(exercise.exerciseId);
                    return (
                      <TouchableOpacity
                        key={exercise.exerciseId}
                        activeOpacity={isExcluded ? 1 : 0.7}
                        onPress={() => !isExcluded && handleSelectExercise(exercise.exerciseId)}
                        className={`flex-row items-center bg-slate-50 dark:bg-slate-800 rounded-2xl p-3 border mb-2 ${
                          isSelected ? 'border-lime-400' : 'border-slate-200 dark:border-slate-700'
                        }`}
                        style={isExcluded ? { opacity: 0.45 } : undefined}
                      >
                        {/* GIF o placeholder */}
                        {exercise.gifUrl ? (
                          <Image
                            source={{ uri: exercise.gifUrl }}
                            className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 mr-3"
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-14 h-14 bg-slate-100 dark:bg-slate-700 rounded-xl items-center justify-center mr-3">
                            <Ionicons name="image-outline" size={20} color="#94a3b8" />
                          </View>
                        )}

                        {/* Nombre */}
                        <View className="flex-1">
                          <Text
                            className="font-semibold text-sm text-slate-900 dark:text-slate-50"
                            numberOfLines={2}
                          >
                            {exercise.name}
                          </Text>
                          {isExcluded && (
                            <Text className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                              Ya agregado
                            </Text>
                          )}
                        </View>

                        {/* Check, Chevron o icono blocked */}
                        <Ionicons
                          name={isExcluded ? 'checkmark-done' : isSelected ? 'checkmark-circle' : 'chevron-forward'}
                          size={20}
                          color={isExcluded ? '#64748b' : isSelected ? '#a3e635' : '#94a3b8'}
                        />
                      </TouchableOpacity>
                    );
                  })}

                  {/* Botón Más ejercicio */}
                  {hasNextPage && (
                    <TouchableOpacity
                      onPress={handleLoadMore}
                      disabled={loadingExercises}
                      className="bg-slate-100 dark:bg-slate-800 rounded-xl py-3 items-center mt-2"
                    >
                      {loadingExercises ? (
                        <ActivityIndicator size="small" color="#a3e635" />
                      ) : (
                        <Text className="text-slate-600 dark:text-slate-300 font-medium">
                          Más ejercicios
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </ScrollView>

          {/* Botón Agregar (fixed bottom) */}
          <View className="px-5 pt-3">
            <TouchableOpacity
              onPress={handleAdd}
              disabled={!selectedExerciseId}
              className={`h-[56px] rounded-full items-center justify-center ${
                selectedExerciseId
                  ? 'bg-slate-900 dark:bg-slate-950'
                  : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <Text className="text-white font-semibold text-base">
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
