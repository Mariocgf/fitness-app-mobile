import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import { SessionExerciseCard } from '@/src/components/features/training-history/SessionExerciseCard';
import { TrainingHistoryCardSkeleton } from '@/src/components/features/training-history/TrainingHistoryCardSkeleton';
import { useTrainingSessionDetail } from '@/src/hooks/useTrainingSessionDetail';
import { formatDurationLong, formatSessionDateTime } from '@/src/utils/training-history.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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

  const handleBack = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push('/fitness/training-history' as any);
  };

  const header = (
    <View style={{ paddingTop: insets.top }} className="px-4 pb-4">
      <View className="flex-row items-center justify-between py-3">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 -ml-2 rounded-full"
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={28} color="#64748b" />
        </TouchableOpacity>
        <Text
          className="flex-1 text-center text-base font-semibold text-slate-900 dark:text-slate-50"
          numberOfLines={1}
        >
          {session ? session.routineName : 'Detalle de sesión'}
        </Text>
        <View className="w-10" />
      </View>

      {/* Sub-header con fecha, duración y cant. ejercicios */}
      {session && (
        <View className="items-center gap-1 mt-1">
          <Text className="text-slate-500 dark:text-slate-400 text-sm">
            {formatSessionDateTime(session.trainedAt)}
          </Text>
          <View className="flex-row items-center gap-4 mt-1">
            <View className="flex-row items-center">
              <Ionicons name="time-outline" size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm ml-1">
                {formatDurationLong(session.totalSeconds)}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="barbell-outline" size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-sm ml-1">
                {session.exercises.length} {session.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <SwipeBackWrapper onSwipeBack={handleBack}>
      <DarkSheetLayout header={header}>
        {/* Estado de carga */}
        {isLoading && (
          <View className="px-4 pt-4">
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
            <Text className="text-slate-900 dark:text-slate-50 text-base font-medium mt-4 text-center">
              {error}
            </Text>
            <TouchableOpacity
              onPress={refresh}
              className="mt-4 bg-lime-400 px-6 py-3 rounded-xl"
              activeOpacity={0.8}
            >
              <Text className="text-slate-900 font-semibold">Reintentar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Contenido principal */}
        {!isLoading && !error && session && (
          <ScrollView
            contentContainerClassName="px-4 pt-4 pb-32"
            showsVerticalScrollIndicator={false}
          >
            <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wide mb-3">
              Ejercicios realizados
            </Text>
            {session.exercises.map((exercise, index) => (
              <SessionExerciseCard
                key={exercise.exerciseId + index}
                exercise={exercise}
                index={index}
              />
            ))}
          </ScrollView>
        )}
      </DarkSheetLayout>
    </SwipeBackWrapper>
  );
}
