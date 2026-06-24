import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { SessionComparePicker } from '@/src/components/features/training-history/SessionComparePicker';
import { SessionComparisonSheet } from '@/src/components/features/training-history/SessionComparisonSheet';
import { SessionExerciseCard } from '@/src/components/features/training-history/SessionExerciseCard';
import { SessionStatsCard } from '@/src/components/features/training-history/SessionStatsCard';
import { TrainingHistoryCardSkeleton } from '@/src/components/features/training-history/TrainingHistoryCardSkeleton';
import { useTrainingSessionComparison } from '@/src/hooks/useTrainingSessionComparison';
import { useTrainingSessionDetail } from '@/src/hooks/useTrainingSessionDetail';
import {
  computeSessionStats,
  formatDurationLong,
  formatSessionDateTimeDot,
} from '@/src/utils/training-history.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Pantalla de detalle de una sesión de entrenamiento.
 * Lee el id de los params de navegación y consume useTrainingSessionDetail.
 */
export default function TrainingSessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken);
  }, [getToken]);

  const { session, isLoading, error, refresh } = useTrainingSessionDetail(id ?? '', token);

  const [pickerVisible, setPickerVisible] = useState(false);
  const { comparison, isLoadingTarget, targetError, selectTarget, reset } =
    useTrainingSessionComparison(session);

  const comparisonSheetVisible = isLoadingTarget || comparison != null || targetError != null;

  const handleBack = () => {
    router.push('/fitness/training-history' as any);
  };

  const handlePressCompare = useCallback(() => setPickerVisible(true), []);
  const handlePickerClose = useCallback(() => setPickerVisible(false), []);
  const handlePickerSelect = useCallback(
    (targetId: string) => {
      setPickerVisible(false);
      selectTarget(targetId);
    },
    [selectTarget],
  );

  const bottomPadding = TAB_BAR_HEIGHT + insets.bottom + 24;

  return (
    <>
      <SwipeBackWrapper onSwipeBack={handleBack}>
        <View className="flex-1 bg-zinc-950">
          {/* Botón back (fijo arriba) */}
          <View style={{ paddingTop: insets.top }} className="px-5 pt-3">
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center"
            >
              <Ionicons name="chevron-back" size={22} color="#a3e635" />
            </TouchableOpacity>
          </View>

          {/* Estado de carga */}
          {isLoading && (
            <View className="px-5 pt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <View key={i} className="mb-3">
                  <TrainingHistoryCardSkeleton variant="list" />
                </View>
              ))}
            </View>
          )}

          {/* Estado de error */}
          {!isLoading && error && (
            <View className="flex-1 items-center justify-center py-20 px-6">
              <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
              <Text className="text-white text-base font-medium mt-4 text-center">{error}</Text>
              <TouchableOpacity
                onPress={refresh}
                className="mt-4 bg-lime-400 px-6 py-3 rounded-xl"
                activeOpacity={0.8}
              >
                <Text className="text-zinc-900 font-semibold">Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Contenido principal */}
          {!isLoading && !error && session && (
            <ScrollView
              contentContainerStyle={{ paddingBottom: bottomPadding }}
              contentContainerClassName="px-5 pt-4"
              showsVerticalScrollIndicator={false}
            >
              {/* Título + meta */}
              <Text className="text-white text-4xl font-bold" numberOfLines={2}>
                {session.routineName}
              </Text>
              <Text className="text-zinc-400 text-base mt-2">
                {formatSessionDateTimeDot(session.trainedAt)}
                {session.routineVersionNumber != null
                  ? `  ·  Versión ${session.routineVersionNumber}`
                  : ''}
              </Text>

              <View className="flex-row items-center justify-between mt-2 mb-6">
                <Text className="text-zinc-400 text-base">
                  {formatDurationLong(session.totalSeconds)}
                  {'  •  '}
                  {session.exercises.length}{' '}
                  {session.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                </Text>
                <TouchableOpacity
                  onPress={handlePressCompare}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1.5"
                >
                  <Ionicons name="stats-chart" size={18} color="#a3e635" />
                  <Text className="text-lime-400 text-base font-semibold">Comparar</Text>
                </TouchableOpacity>
              </View>

              {/* Resumen de la sesión */}
              <SessionStatsCard stats={computeSessionStats(session)} />

              {/* Ejercicios */}
              <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-wide mt-8 mb-4">
                Ejercicios realizados
              </Text>
              {session.exercises.map((exercise, index) => (
                <SessionExerciseCard
                  key={exercise.exerciseId + index}
                  exercise={exercise}
                  index={index}
                  defaultExpanded={index === 0}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </SwipeBackWrapper>

      {/* Picker: montado condicionalmente para no ejecutar hooks pesados cuando está cerrado */}
      {pickerVisible && session && (
        <SessionComparePicker
          excludeId={session.id}
          onSelect={handlePickerSelect}
          onClose={handlePickerClose}
        />
      )}

      {/* Sheet de resultado: montado solo cuando hay actividad de comparación */}
      {comparisonSheetVisible && (
        <SessionComparisonSheet
          comparison={comparison}
          isLoading={isLoadingTarget}
          error={targetError}
          onClose={reset}
        />
      )}
    </>
  );
}
