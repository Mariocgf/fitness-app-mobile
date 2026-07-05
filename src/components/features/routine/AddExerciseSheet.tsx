import { ExerciseSearchItem } from '@/src/services/exercise.service';
import { capitalize } from '@/src/utils/format.utils';
import { Ionicons } from '@expo/vector-icons';
import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
import { ExerciseDetailView } from '@/src/components/features/routine/ExerciseDetailView';
import { BottomSheetModal } from '@/src/components/common/BottomSheetModal';
import { SelectablePill } from '@/src/components/common/SelectablePill';
import { useExerciseSearch } from '@/src/hooks/useExerciseSearch';
import { RoutineExercise } from '@/src/types/routine';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
/*                          Helpers                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Construye un RoutineExercise mínimo para alimentar la vista de detalle. */
const toDetailExercise = (item: ExerciseSearchItem): RoutineExercise => ({
  id: item.exerciseId,
  exerciseId: item.exerciseId,
  order: '',
  name: item.name,
  gifUrl: item.gifUrl,
  sets: '',
  repType: 'Fixed',
  minRep: null,
  maxRep: null,
  currentRep: null,
  durationSeconds: null,
  rest: '',
  loadType: null,
  plannedWeightKg: null,
  primaryMuscleGroup: null,
});

/* ──────────────────────────────────────────────────────────────────────────── */
/*                         AddExerciseSheet                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

export const AddExerciseSheet: React.FC<AddExerciseSheetProps> = ({
  visible,
  onClose,
  onAdd,
  confirmLabel = 'Agregar seleccionado',
  excludedExerciseIds = [],
}) => {
  const {
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
  } = useExerciseSearch(visible);

  /* ── Ejercicio cuyo detalle se está viendo (overlay) ───────────────────── */
  const [detailExercise, setDetailExercise] = useState<ExerciseSearchItem | null>(null);

  const handleAdd = useCallback(() => {
    if (!selectedExerciseId) return;
    const selected = exercises.find((e) => e.exerciseId === selectedExerciseId);
    if (selected) {
      onAdd(selected);
    }
    reset();
    onClose();
  }, [selectedExerciseId, exercises, onAdd, onClose, reset]);

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <BottomSheetModal visible={visible} onClose={onClose}>
      <View className="flex-1 bg-zinc-950">
        {/* Header */}
        <View className="px-5 pt-5 pb-3">
          <Text className="text-3xl font-bold text-white mb-4">Ejercicios</Text>

          {/* Búsqueda */}
          <View className="flex-row items-center bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5">
            <Ionicons name="search-outline" size={20} color="#a1a1aa" />
            <TextInput
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Buscar ejercicios…"
              placeholderTextColor="#71717a"
              className="flex-1 ml-2 text-base text-white"
              returnKeyType="search"
            />
            {searchTerm.length > 0 && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Ionicons name="close-circle" size={20} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Filtros: Músculo */}
          <View className="mb-4">
            <Text className="text-base font-semibold text-white mb-2 px-5">Músculo</Text>
            {loadingFilters ? (
              <ActivityIndicator size="small" color="#a3e635" className="self-start ml-5" />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {muscles.map((muscle) => (
                  <SelectablePill
                    key={muscle}
                    label={capitalize(muscle)}
                    selected={selectedMuscle === muscle}
                    onPress={() => selectMuscle(muscle)}
                    accent="lime"
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Filtros: Equipamiento */}
          <View className="mb-5">
            <Text className="text-base font-semibold text-white mb-2 px-5">Equipamiento</Text>
            {loadingFilters ? (
              <ActivityIndicator size="small" color="#a3e635" className="self-start ml-5" />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
              >
                {equipments.map((eq) => (
                  <SelectablePill
                    key={eq}
                    label={capitalize(eq)}
                    selected={selectedEquipment === eq}
                    onPress={() => selectEquipment(eq)}
                    accent="lime"
                  />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Resultados */}
          <View className="px-5 pb-4">
            <Text className="text-2xl font-bold text-white mb-3">Resultados</Text>

            {loadingExercises && exercises.length === 0 ? (
              <ActivityIndicator size="large" color="#a3e635" className="py-8" />
            ) : exercises.length === 0 ? (
              <View className="items-center py-10">
                <Ionicons name="barbell-outline" size={40} color="#52525b" />
                <Text className="text-zinc-500 mt-2">No se encontraron ejercicios</Text>
              </View>
            ) : (
              <>
                {exercises.map((exercise) => {
                  const isSelected = selectedExerciseId === exercise.exerciseId;
                  const isExcluded = excludedExerciseIds.includes(exercise.exerciseId);
                  const tags = (exercise.equipments ?? []).slice(0, 2);
                  return (
                    <View
                      key={exercise.exerciseId}
                      className={`flex-row items-center bg-zinc-900 rounded-2xl p-3 border mb-2.5 ${
                        isSelected ? 'border-lime-400' : 'border-zinc-800'
                      }`}
                      style={isExcluded ? { opacity: 0.45 } : undefined}
                    >
                      {/* Zona seleccionable (todo menos el botón info) */}
                      <TouchableOpacity
                        activeOpacity={isExcluded ? 1 : 0.7}
                        onPress={() => !isExcluded && handleSelectExercise(exercise.exerciseId)}
                        className="flex-1 flex-row items-center"
                      >
                        <ExerciseThumbnail
                          uri={exercise.gifUrl}
                          size={56}
                          className="bg-zinc-800 mr-3"
                          iconColor="#71717a"
                        />

                        <View className="flex-1">
                          <Text
                            className="font-semibold text-base text-white"
                            numberOfLines={2}
                          >
                            {exercise.name}
                          </Text>

                          {isExcluded ? (
                            <Text className="text-xs text-zinc-500 mt-1">Ya agregado</Text>
                          ) : tags.length > 0 ? (
                            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
                              {tags.map((tag) => (
                                <View
                                  key={tag}
                                  className="bg-zinc-800 rounded-md px-2 py-0.5"
                                >
                                  <Text className="text-[11px] text-zinc-400">
                                    {capitalize(tag)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          ) : null}
                        </View>

                        {/* Check de selección */}
                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#a3e635"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </TouchableOpacity>

                      {/* Botón info → abre detalle */}
                      <TouchableOpacity
                        onPress={() => setDetailExercise(exercise)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        className="w-10 h-10 rounded-full bg-zinc-800 items-center justify-center ml-2"
                      >
                        <Ionicons name="information-circle-outline" size={22} color="#a1a1aa" />
                      </TouchableOpacity>
                    </View>
                  );
                })}

                {/* Ver más ejercicios */}
                {hasNextPage && (
                  <TouchableOpacity
                    onPress={handleLoadMore}
                    disabled={loadingExercises}
                    activeOpacity={0.7}
                    className="flex-row items-center justify-center bg-zinc-900 border border-zinc-800 rounded-2xl py-4 mt-1.5 gap-2"
                  >
                    {loadingExercises ? (
                      <ActivityIndicator size="small" color="#a3e635" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={20} color="#a3e635" />
                        <Text className="text-zinc-300 font-medium">Ver más ejercicios</Text>
                      </>
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
            activeOpacity={0.85}
            className={`h-[56px] rounded-full flex-row items-center justify-center gap-2 ${
              selectedExerciseId ? 'bg-lime-400' : 'bg-zinc-800'
            }`}
          >
            <Ionicons
              name="add"
              size={22}
              color={selectedExerciseId ? '#000' : '#52525b'}
            />
            <Text
              className={`font-bold text-base ${
                selectedExerciseId ? 'text-black' : 'text-zinc-600'
              }`}
            >
              {confirmLabel}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Overlay de detalle del ejercicio */}
        {detailExercise && (
          <GestureHandlerRootView className="absolute inset-0 z-30">
            <ExerciseDetailView
              exercise={toDetailExercise(detailExercise)}
              onBack={() => setDetailExercise(null)}
              onClose={() => setDetailExercise(null)}
              embedded
            />
          </GestureHandlerRootView>
        )}
      </View>
    </BottomSheetModal>
  );
};
