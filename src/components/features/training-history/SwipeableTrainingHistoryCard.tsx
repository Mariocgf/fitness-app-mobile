import { TrainingHistorySession } from '@/src/types/training-history';
import { formatDurationLong, formatSessionDate } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface SwipeableTrainingHistoryCardProps {
  session: TrainingHistorySession;
  onPress: (session: TrainingHistorySession) => void;
  onDelete: (session: TrainingHistorySession) => void;
}

/**
 * Card con swipe-to-delete para el historial de entrenamiento.
 * Al deslizar hacia la izquierda aparece la opción de eliminar.
 */
export function SwipeableTrainingHistoryCard({
  session,
  onPress,
  onDelete,
}: SwipeableTrainingHistoryCardProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleDelete = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(session);
  }, [onDelete, session]);

  const renderRightActions = useCallback(
    (progress: unknown, dragX: unknown) => (
      <TouchableOpacity
        onPress={handleDelete}
        className="bg-red-500 justify-center items-center px-6 rounded-xl ml-3"
        activeOpacity={0.8}
      >
        <View className="items-center">
          <Ionicons name="trash-outline" size={22} color="white" />
          <Text className="text-white text-xs font-medium mt-1">Eliminar</Text>
        </View>
      </TouchableOpacity>
    ),
    [handleDelete],
  );

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <Animated.View entering={FadeIn} exiting={FadeOut}>
        <TouchableOpacity
          onPress={() => onPress(session)}
          activeOpacity={0.8}
          className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
        >
          {/* Nombre + flecha */}
          <View className="flex-row items-start justify-between mb-2">
            <Text
              className="text-slate-900 dark:text-slate-50 font-semibold text-base flex-1 mr-2"
              numberOfLines={2}
            >
              {session.routineName}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>

          {/* Chips de metadata */}
          <View className="flex-row items-center flex-wrap gap-2 mb-3">
            <View className="bg-lime-400/20 px-2 py-1 rounded-full flex-row items-center">
              <Ionicons name="barbell-outline" size={11} color="#65a30d" />
              <Text className="text-lime-700 dark:text-lime-400 text-xs font-medium ml-1">
                {session.exercises.length} {session.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
              </Text>
            </View>
            <View className="flex-row items-center px-2 py-1">
              <Ionicons name="time-outline" size={11} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
                {formatDurationLong(session.totalSeconds)}
              </Text>
            </View>
          </View>

          {/* Fecha */}
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={11} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
              {formatSessionDate(session.trainedAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
}
