import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { getExerciseInfo } from '@/src/services/exercise.service';
import { RoutineExercise } from '@/src/types/routine';
import { capitalize, cleanStepPrefix } from '@/src/utils/format.utils';
import { useAuth } from '@clerk/clerk-expo';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Acento lime del módulo fitness. */
const LIME = '#a3e635';

/* ── InfoRow ────────────────────────────────────────────────────────────── */
/** Fila de dato: ícono lime + etiqueta a la izquierda, valor a la derecha. */
const InfoRow = ({
  icon,
  label,
  value,
  isLast,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  isLast?: boolean;
}) => (
  <View
    className={`flex-row items-center py-3.5 ${isLast ? '' : 'border-b border-zinc-800'}`}
  >
    <View className="w-9 items-center">{icon}</View>
    <Text className="text-zinc-400 text-base ml-2 flex-1">{label}</Text>
    <Text className="text-white text-base font-semibold text-right" numberOfLines={2}>
      {value || '—'}
    </Text>
  </View>
);

/* ── ExerciseDetailView ─────────────────────────────────────────────────── */

interface ExerciseDetailViewProps {
  exercise: RoutineExercise;
  onBack: () => void;
  onClose: () => void;
  /**
   * `true` cuando se monta como overlay dentro de un bottom-sheet (que ya está
   * debajo de la barra de estado): usa padding superior chico y no agrega el
   * inset inferior del dispositivo. Default `false` = uso a pantalla completa.
   */
  embedded?: boolean;
}

/** Vista de detalle de ejercicio (dark zinc), con swipe-back y transición SlideInRight */
export const ExerciseDetailView: React.FC<ExerciseDetailViewProps> = ({ exercise, onBack, embedded = false }) => {
  const { getToken } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

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
        // En web las animaciones de layout de reanimated + `position:absolute`
        // vía nativewind NO se aplican: la vista cae en el flujo normal (aparece
        // debajo del contenido) y el ScrollView queda sin viewport (no scrollea).
        // Mismo criterio que RoutineDetailView: overlay con `style` inline explícito
        // y sin entering/exiting en web.
        entering={isWeb ? undefined : SlideInRight.duration(280)}
        exiting={isWeb ? undefined : SlideOutRight.duration(220)}
        style={
          isWeb
            ? {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 20,
                backgroundColor: '#09090b',
              }
            : undefined
        }
        className={isWeb ? undefined : 'absolute inset-0 z-20 bg-zinc-950'}
      >
        {/* Header: back + título */}
        <View style={{ paddingTop: embedded ? 12 : insets.top + 12 }} className="px-4 pb-3">
          <View className="flex-row items-center h-11">
            <TouchableOpacity
              onPress={onBack}
              className="bg-zinc-800 w-10 h-10 rounded-full items-center justify-center"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text
              className="flex-1 text-center text-lg font-bold text-white"
              numberOfLines={1}
            >
              {exercise.name}
            </Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: embedded ? 24 : insets.bottom + TAB_BAR_HEIGHT + 24 }}
        >
          <View className="px-4 pt-2 gap-4">
            {/* GIF / imagen hero con badge */}
            <View className="aspect-square rounded-3xl overflow-hidden bg-white items-center justify-center">
              {exercise.gifUrl ? (
                <Image
                  source={{ uri: exercise.gifUrl }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
              ) : (
                <Ionicons name="image-outline" size={64} color="#a1a1aa" />
              )}
              <View className="absolute bottom-3 left-3 flex-row items-center bg-zinc-950/80 rounded-xl px-3 py-1.5 gap-1.5">
                <Ionicons name="scan-outline" size={16} color="#fff" />
                <Text className="text-white text-sm font-semibold">GIF</Text>
              </View>
            </View>

            {isLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color={LIME} />
              </View>
            ) : isError ? (
              <Text className="text-red-400 text-center py-8">Error al cargar la información.</Text>
            ) : info ? (
              <>
                {/* Card de datos */}
                <View className="bg-zinc-900 rounded-3xl px-4 py-1">
                  <InfoRow
                    icon={<Ionicons name="body-outline" size={26} color={LIME} />}
                    label="Parte del cuerpo"
                    value={info.bodyPart?.map(capitalize).join(', ')}
                  />
                  <InfoRow
                    icon={<MaterialCommunityIcons name="arm-flex" size={26} color={LIME} />}
                    label="Músculo principal"
                    value={info.targetMuscles?.map(capitalize).join(', ')}
                  />
                  <InfoRow
                    icon={<MaterialCommunityIcons name="arm-flex-outline" size={26} color={LIME} />}
                    label="Secundarios"
                    value={info.secundaryMuscles?.map(capitalize).join(', ')}
                  />
                  <InfoRow
                    icon={<MaterialCommunityIcons name="dumbbell" size={24} color={LIME} />}
                    label="Equipamiento"
                    value={info.equipments?.map(capitalize).join(', ')}
                    isLast
                  />
                </View>

                {/* Card de instrucciones */}
                {info.instructions?.length > 0 && (
                  <View className="bg-zinc-900 rounded-3xl p-5">
                    <View className="flex-row items-center mb-4 gap-3">
                      <View className="w-11 h-11 rounded-full border border-lime-400/60 items-center justify-center">
                        <Ionicons name="list-outline" size={22} color={LIME} />
                      </View>
                      <Text className="text-white font-bold text-xl">Instrucciones</Text>
                    </View>

                    {info.instructions.map((step, i) => (
                      <View key={i} className="flex-row items-start mb-4">
                        <View className="w-7 h-7 rounded-full border border-lime-400/60 items-center justify-center mr-3 mt-0.5">
                          <Text className="text-lime-400 text-xs font-bold">{i + 1}</Text>
                        </View>
                        <Text className="text-zinc-300 text-base leading-6 flex-1">
                          {cleanStepPrefix(step)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
};
