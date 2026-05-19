import { DarkSheetLayout } from '@/src/components/common/DarkSheetLayout';
import { getExerciseInfo } from '@/src/services/exercise.service';
import { RoutineExercise } from '@/src/types/routine';
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
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 20 }}
      >
        <DarkSheetLayout
          header={
            <View style={{ paddingTop: insets.top + 12 }} className="px-4 pb-4">
              <View className="flex-row items-start gap-3">
                <TouchableOpacity
                  onPress={onBack}
                  className="bg-white/10 p-2 rounded-full"
                  style={{ marginTop: 3 }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="chevron-back" size={20} style={{ color: '#f8fafc' }} />
                </TouchableOpacity>
                <Text className="flex-1 text-white text-2xl font-bold" style={{ lineHeight: 30 }}>
                  {exercise.name}
                </Text>
              </View>
            </View>
          }
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
          >
            <View className="px-4" style={{ paddingTop: 16, gap: 12 }}>
              {/* GIF — mismo ancho que las cards */}
              <View
                style={{
                  aspectRatio: 1,
                  borderRadius: 16,
                  overflow: 'hidden',
                  backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {exercise.gifUrl ? (
                  <Image
                    source={{ uri: exercise.gifUrl }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons name="image-outline" size={64} style={{ color: '#94a3b8' }} />
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
                  <View className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                    <View className="flex-row gap-4 pb-3 border-b border-slate-200 dark:border-white/10">
                      <InfoCell label="Parte del cuerpo"    value={info.bodyPart?.join(', ')} />
                      <InfoCell label="Músculos a trabajar" value={info.targetMuscles?.join(', ')} />
                    </View>
                    <View className="flex-row gap-4 pt-3">
                      <InfoCell label="Músculos secundarios" value={info.secundaryMuscles?.join(', ')} />
                      <InfoCell label="Equipamiento"         value={info.equipments?.join(', ')} />
                    </View>
                  </View>

                  {/* Instrucciones */}
                  {info.instructions?.length > 0 && (
                    <View className="mt-4 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-white/10">
                      <Text className="text-slate-900 dark:text-white font-bold text-xl text-center mb-4">
                        Instrucciones
                      </Text>
                      {info.instructions.map((step, i) => {
                        const cleanStep = step.replace(/^Step\s*:?\s*\d+\s*:?\s*/i, '').trim();
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
