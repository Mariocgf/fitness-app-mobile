import { IconTile } from '@/src/components/common/IconTile';
import { TrainingHistorySession } from '@/src/types/training-history';
import { formatDurationLong, formatRelativeDay } from '@/src/utils/training-history.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const LIME = '#a3e635';

interface SwipeableTrainingHistoryCardProps {
  session: TrainingHistorySession;
  onPress: (session: TrainingHistorySession) => void;
  onDelete: (session: TrainingHistorySession) => void;
}

/**
 * Card del listado de historial (dark-only `zinc`/`lime`, rediseñada desde la
 * maqueta de "Mis rutinas"): fila compacta con `IconTile` + nombre de la rutina +
 * meta `N ejercicios • duración • fecha relativa` + chevron. Conserva el
 * swipe-to-delete (desliza a la izquierda → "Eliminar").
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
    () => (
      <TouchableOpacity
        onPress={handleDelete}
        className="bg-red-500 justify-center items-center px-6 rounded-2xl ml-3"
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

  const exerciseCount = session.exercises.length;
  const meta = [
    `${exerciseCount} ${exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}`,
    formatDurationLong(session.totalSeconds),
    formatRelativeDay(session.trainedAt),
    ...(session.routineVersionNumber != null ? [`v${session.routineVersionNumber}`] : []),
  ].join('  •  ');

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
          className="flex-row items-center rounded-2xl bg-zinc-900 border border-zinc-800 p-4"
        >
          <IconTile name="barbell" color={LIME} size={48} iconSize={24} />
          <View className="flex-1 ml-3 pr-2">
            <Text className="text-white font-semibold text-base" numberOfLines={2}>
              {session.routineName}
            </Text>
            <Text className="text-zinc-500 text-sm mt-0.5" numberOfLines={1}>
              {meta}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#52525b" />
        </TouchableOpacity>
      </Animated.View>
    </Swipeable>
  );
}
