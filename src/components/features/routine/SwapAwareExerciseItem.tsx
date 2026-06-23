import { ExerciseThumbnail } from '@/src/components/features/routine/ExerciseThumbnail';
import { RoutineExercise, SwapSuggestionItem } from '@/src/types/routine';
import { formatReps } from '@/src/utils/format.utils';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/** Formatea las repeticiones, incluyendo rango min–max cuando aplica */
const getExerciseReps = (exercise: RoutineExercise): string => {
  if (exercise.repType === 'Timed') return formatReps(exercise);
  if (exercise.minRep && exercise.maxRep && exercise.minRep !== exercise.maxRep) {
    return `${exercise.minRep}–${exercise.maxRep}`;
  }
  return exercise.currentRep ?? exercise.minRep ?? '-';
};

/** Columna de stat: label gris arriba, valor blanco en negrita abajo */
const StatCol = ({ label, value }: { label: string; value: string }) => (
  <View className="items-center" style={{ minWidth: 36 }}>
    <Text className="text-zinc-500 text-[10px] mb-0.5">{label}</Text>
    <Text className="text-white font-bold text-sm" numberOfLines={1}>{value}</Text>
  </View>
);

interface SwapAwareExerciseItemProps {
  exercise: RoutineExercise;
  index: number;
  isSwapMode: boolean;
  isSelected: boolean;
  isLoading: boolean;
  suggestion?: SwapSuggestionItem;
  pickExerciseId: string | null | undefined;
  onPress: () => void;
}

/**
 * Card de ejercicio con awareness del modo swap.
 * Vista normal: número | imagen | nombre + stats (Sets/Reps/Rest).
 * Modo swap: checkbox / loading / sugerencia lista / reemplazo elegido.
 * Trae su propia animación de pulso (no depende del core del detalle).
 */
export const SwapAwareExerciseItem: React.FC<SwapAwareExerciseItemProps> = ({
  exercise,
  index,
  isSwapMode,
  isSelected,
  isLoading,
  suggestion,
  pickExerciseId,
  onPress,
}) => {
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (isLoading) {
      pulse.value = 0;
      pulse.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.35, 1]),
  }));

  const isReady = !!suggestion;
  const hasPickedReplacement = isReady && pickExerciseId != null;
  const pickedCandidate = hasPickedReplacement
    ? suggestion!.candidates.find(c => c.exerciseId === pickExerciseId)
    : null;

  const gifUrl = (pickedCandidate?.gifUrl ?? exercise.gifUrl) as string | null;

  const borderClass =
    isLoading || isReady || isSelected ? 'border-lime-400' : 'border-white/10';

  return (
    <View className="relative mb-3">
      {/* Borde pulsante mientras carga */}
      {isLoading && (
        <Animated.View
          pointerEvents="none"
          style={pulseStyle}
          className="absolute inset-0 rounded-2xl border-2 border-lime-400 z-10"
        />
      )}

      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        className={`flex-row bg-zinc-900 rounded-2xl border items-center gap-3 p-3 ${borderClass}`}
      >
        {/* Número de orden */}
        <Text className="text-zinc-600 font-bold text-sm w-5 text-center">
          {index + 1}
        </Text>

        {/* GIF / imagen */}
        <ExerciseThumbnail uri={gifUrl} size={64} />

        {/* Nombre + sub-línea de estado en swap */}
        <View className="flex-1">
          <Text
            className={`font-bold text-sm mb-0.5 ${
              pickedCandidate ? 'text-zinc-500 line-through' : 'text-white'
            }`}
            numberOfLines={2}
          >
            {exercise.name}
          </Text>

          {/* Sub-líneas en modo swap */}
          {isLoading && (
            <View className="flex-row items-center gap-1.5">
              <ActivityIndicator size="small" color="#a3e635" />
              <Text className="text-lime-400 text-xs font-semibold">
                Buscando sugerencia…
              </Text>
            </View>
          )}

          {!isLoading && isReady && pickedCandidate && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="arrow-forward" size={12} className="text-lime-400" />
              <Text className="text-lime-400 text-xs font-semibold" numberOfLines={1}>
                {pickedCandidate.name}
              </Text>
            </View>
          )}

          {!isLoading && isReady && !pickedCandidate && (
            <View className="flex-row items-center gap-1">
              <Ionicons name="sparkles" size={12} className="text-lime-400" />
              <Text className="text-lime-400 text-xs font-semibold">
                Sugerencia lista — tocá para elegir
              </Text>
            </View>
          )}
        </View>

        {/* Lado derecho: stats (modo normal) o indicador swap */}
        {isSwapMode ? (
          isLoading ? null : isReady ? (
            <Ionicons
              name={hasPickedReplacement ? 'checkmark-circle' : 'sparkles'}
              size={22}
              className="text-lime-500"
            />
          ) : (
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isSelected ? 'bg-lime-400 border-lime-400' : 'border-zinc-600'
              }`}
            >
              {isSelected && <Ionicons name="checkmark" size={14} className="text-black" />}
            </View>
          )
        ) : (
          <View className="flex-row gap-4">
            <StatCol label="Sets" value={exercise.sets} />
            <StatCol label="Reps" value={getExerciseReps(exercise)} />
            <StatCol label="Rest" value={exercise.rest} />
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
