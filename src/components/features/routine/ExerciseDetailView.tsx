import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import { translateBodyPart, translateEquipment, translateMuscle, translateSecondaryMuscle } from '@/src/i18n';
import { getExerciseInfo } from '@/src/services/exercise.service';
import { RoutineExercise } from '@/src/types/routine';
import { cleanStepPrefix } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

/* ── InfoCell ───────────────────────────────────────────────────────────── */

const InfoCell = ({ label, value }: { label: string; value?: string }) => (
  <View className="flex-1">
    <Text className="text-slate-900 dark:text-white font-bold text-sm">{label}</Text>
    <Text className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">{value || '—'}</Text>
  </View>
);

/* ── ExerciseDetailView ─────────────────────────────────────────────────── */

interface ExerciseDetailViewProps {
  exercise: RoutineExercise;
  onBack: () => void;
  onClose: () => void;
}

/** Vista de detalle de ejercicio con DarkSheetLayout, swipe-back y transición SlideInRight */
export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({ exercise, onBack, onClose }) => {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();

  const { data: info, isLoading, isError } = useQuery({
    queryKey: ['exercise-info', exercise.id],
    queryFn: async () => {
      const token = await getToken();
      return getExerciseInfo(exercise.exerciseId, token);
    },
    staleTime: Infinity,
  });

  const pan = Gesture.Pan()
    .activeOffsetX(20)
    .runOnJS(true)
    .onEnd((e) => { if (e.translationX > 50) onBack(); });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        entering={SlideInRight.duration(280)}
        exiting={SlideOutRight.duration(220)}
        className="absolute inset-0 z-20"
      >
        <DarkSheetLayout
          header={
            <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-4">
              <View className="w-full flex-row items-center h-11 mb-4">
                <TouchableOpacity
                  onPress={onBack}
                  className="bg-slate-300 dark:bg-slate-700 flex items-center justify-center w-10 h-10 rounded-full mt-1 "
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={24} className='dark:text-slate-100' />
                </TouchableOpacity>
              <Text className="flex-1 text-center text-lg font-semibold text-slate-900 dark:text-slate-50">
                {exercise.name}
              </Text>
              <View className="w-10" />
              </View>

            </View>
          }
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            <View className="px-4 pt-4 gap-4">
              {/* GIF — mismo ancho que las cards */}
              <View className="aspect-square rounded-2xl overflow-hidden bg-white items-center justify-center">
                {exercise.gifUrl ? (
                  <Image
                    source={{ uri: exercise.gifUrl }}
                    className="w-full h-full"
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="image-outline" size={64} className="text-slate-400" />
                )}
              </View>

              {isLoading ? (
                <View className="py-12 items-center">
                  <ActivityIndicator size="large" color="#a3e635" />
                </View>
              ) : isError ? (
                <Text className="text-red-500 text-center py-8">Error al cargar la información.</Text>
              ) : info ? (
                <>
                  {/* Tarjeta info 2x2 */}
                  <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                    <View className="flex-row gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
                      <InfoCell label="Parte del cuerpo" value={info.bodyPart?.map(translateBodyPart).join(', ')} />
                      <InfoCell label="Músculos a trabajar" value={info.targetMuscles?.map(translateMuscle).join(', ')} />
                    </View>
                    <View className="flex-row gap-4 pt-3">
                      <InfoCell label="Músculos secundarios" value={info.secundaryMuscles?.map(translateSecondaryMuscle).join(', ')} />
                      <InfoCell label="Equipamiento" value={info.equipments?.map(translateEquipment).join(', ')} />
                    </View>
                  </View>

                  {/* Instrucciones */}
                  {info.instructions?.length > 0 && (
                    <View className="mt-4 bg-slate-100 dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                      <Text className="text-slate-900 dark:text-white font-bold text-xl text-center mb-4">
                        Instrucciones
                      </Text>
                      {info.instructions.map((step, i) => {
                        const cleanStep = cleanStepPrefix(step);
                        return (
                          <Text key={i} className="text-slate-700 dark:text-slate-300 text-sm leading-5 mb-3">
                            <Text className="font-bold text-slate-900 dark:text-white">Step:{i + 1} </Text>
                            {cleanStep}
                          </Text>
                        );
                      })}
                    </View>
                  )}
                </>
              ) : null}
            </View>
          </ScrollView>
        </DarkSheetLayout>
      </Animated.View>
    </GestureDetector>
  );
};
