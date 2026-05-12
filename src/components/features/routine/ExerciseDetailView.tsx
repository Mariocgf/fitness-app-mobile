import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { cssInterop } from 'nativewind';
import { getExerciseInfo } from '@/src/services/exercise.service';
import { RoutineExercise } from '@/src/types/routine';

cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
    },
  },
});

/* ────────────────────────── InfoRow ────────────────────────── */

/** Fila informativa genérica: label + lista de valores */
const InfoRow = ({ label, value }: { label: string; value: string[] }) => {
  if (!value || value.length === 0) return null;
  return (
    <View className="flex-row justify-between py-3 border-b border-zinc-200/50 dark:border-white/5 last:border-0">
      <Text className="text-zinc-600 dark:text-lime-300 font-medium">{label}</Text>
      <Text className="text-zinc-900 dark:text-white flex-1 text-right ml-4 font-medium capitalize">
        {value.join(', ')}
      </Text>
    </View>
  );
};

/* ────────────────────────── ExerciseDetailView ────────────────────────── */

interface ExerciseDetailViewProps {
  exercise: RoutineExercise;
  onBack: () => void;
  onClose: () => void;
}

/** Vista de detalle completa de un ejercicio con fetching de info anatómica y swipe-back */
export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({
  exercise,
  onBack,
  onClose,
}) => {
  const { getToken } = useAuth();

  const { data: info, isLoading, isError } = useQuery({
    queryKey: ['exercise-info', exercise.id],
    queryFn: async () => {
      const token = await getToken();
      return getExerciseInfo(exercise.id, token);
    },
    staleTime: Infinity,
  });

  /** Gesto de arrastre horizontal para volver atrás */
  const pan = Gesture.Pan()
    .activeOffsetX(20)
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX > 50) {
        onBack();
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInRight.duration(300)}
        exiting={SlideOutRight.duration(200)}
        className="absolute top-0 left-0 w-full h-full bg-white dark:bg-zinc-950 z-20"
      >
        {/* Header */}
        <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950">
          <View className="flex-row items-center gap-3 flex-1">
            <TouchableOpacity onPress={onBack} className="p-2 -ml-2">
              <Ionicons name="arrow-back" size={24} className="text-zinc-900 dark:text-white" />
            </TouchableOpacity>
            <Text className="flex-1 text-zinc-900 dark:text-white text-lg font-bold" numberOfLines={1}>
              {exercise.exercise}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            className="bg-zinc-100 dark:bg-white/10 p-2 rounded-full ml-2"
          >
            <Ionicons name="close" size={20} className="text-zinc-700 dark:text-white" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* GIF del ejercicio */}
          <View className="w-full bg-zinc-100 dark:bg-white aspect-square items-center justify-center m-4 rounded-3xl overflow-hidden self-center" style={{ width: '92%' }}>
            {exercise.gifUrl ? (
              <Image source={{ uri: exercise.gifUrl }} className="w-full h-full" resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={64} className="text-zinc-400" />
            )}
          </View>

          {/* Sección de información e instrucciones */}
          <View className="px-4 pb-12">
            {isLoading ? (
              <View className="py-10">
                <ActivityIndicator size="large" className="text-lime-500" />
              </View>
            ) : isError ? (
              <Text className="text-red-500 dark:text-red-400 text-center py-8">
                Error al cargar la información.
              </Text>
            ) : info ? (
              <>
                <View className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 mb-6 border border-zinc-200 dark:border-white/10">
                  <InfoRow label="Body part" value={info.bodyPart} />
                  <InfoRow label="Target Muscles" value={info.targetMuscles} />
                  <InfoRow label="Secondary Muscles" value={info.secundaryMuscles} />
                  <InfoRow label="Equipments" value={info.equipments} />
                </View>

                <View className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-5 border border-zinc-200 dark:border-white/10 mb-8">
                  <Text className="text-zinc-900 dark:text-white font-bold text-xl mb-4 text-center">Instrucciones</Text>
                  {info.instructions?.length > 0 ? (
                    info.instructions.map((step, index) => {
                      const cleanStep = step.replace(/^Step\s*:?\s*\d+\s*:?\s*/i, '').trim();
                      return (
                        <View key={index} className="flex-row mb-4 last:mb-0">
                          <Text className="text-zinc-900 dark:text-white font-bold mr-2">
                            Step {index + 1}:
                          </Text>
                          <Text className="flex-1 text-zinc-700 dark:text-zinc-300 leading-5">
                            {cleanStep}
                          </Text>
                        </View>
                      );
                    })
                  ) : (
                    <Text className="text-zinc-500 dark:text-zinc-400 text-center">
                      No hay instrucciones disponibles.
                    </Text>
                  )}
                </View>
              </>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
};
