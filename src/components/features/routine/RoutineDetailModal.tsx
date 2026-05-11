import { Routine, RoutineExercise } from '@/src/types/routine';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getExerciseInfo } from '@/src/services/exercise.service';
import Animated, { SlideInRight, SlideOutRight } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
    },
  },
});

cssInterop(MaterialCommunityIcons, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
    },
  },
});

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              ExerciseDetailView                              */
/* ──────────────────────────────────────────────────────────────────────────── */

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

const ExerciseDetailView = ({
  exercise,
  onBack,
  onClose,
}: {
  exercise: RoutineExercise;
  onBack: () => void;
  onClose: () => void;
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
          {/* GIF */}
          <View className="w-full bg-zinc-100 dark:bg-white aspect-square items-center justify-center m-4 rounded-3xl overflow-hidden self-center" style={{ width: '92%' }}>
            {exercise.gifUrl ? (
              <Image source={{ uri: exercise.gifUrl }} className="w-full h-full" resizeMode="contain" />
            ) : (
              <Ionicons name="image-outline" size={64} className="text-zinc-400" />
            )}
          </View>

          {/* Info & Instructions Section */}
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*                              RoutineDetailModal                              */
/* ──────────────────────────────────────────────────────────────────────────── */

const formatReps = (exercise: RoutineExercise) => {
  if (exercise.repType === 'Timed') {
    const totalSecs = parseInt(exercise.durationSeconds || '0', 10);
    if (totalSecs >= 60) {
      const m = Math.floor(totalSecs / 60);
      const s = totalSecs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
    }
    return `${totalSecs}s`;
  }
  return exercise.currentRep || '-';
};

interface RoutineDetailModalProps {
  visible: boolean;
  onClose: () => void;
  routine: Routine | null;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({ visible, onClose, routine }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<RoutineExercise | null>(null);
  const router = useRouter();

  if (!routine) return null;

  const activeDay = routine.days[activeDayIndex];

  const handleClose = () => {
    setSelectedExercise(null);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 justify-end">
          {/* Backdrop */}
          <TouchableOpacity
            className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
            activeOpacity={1}
            onPress={handleClose}
          />

          {/* Bottom Sheet */}
          <View className="bg-white dark:bg-zinc-950 w-full h-[90%] rounded-t-3xl overflow-hidden relative">
            
            {/* Header Main */}
            <View className="flex-row justify-between items-center px-6 py-4 border-b border-zinc-200 dark:border-white/10">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="bg-lime-500/10 dark:bg-lime-500/15 p-2 rounded-lg">
                  <Ionicons name="barbell" size={24} className="text-zinc-900 dark:text-lime-300" />
                </View>
                <View className="flex-1">
                  <Text className="text-zinc-900 dark:text-white text-xl font-bold" numberOfLines={1}>
                    {routine.name}
                  </Text>
                  <Text className="text-zinc-500 dark:text-zinc-400 text-xs">
                    Rutina de {routine.days.length} días • Semana 1
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                className="bg-zinc-100 dark:bg-white/10 p-2 rounded-full"
              >
                <Ionicons name="close" size={20} className="text-zinc-700 dark:text-white" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Days Tabs */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="px-4 py-4"
                contentContainerStyle={{ gap: 12 }}
              >
                {routine.days.map((day, index) => {
                  const isActive = activeDayIndex === index;
                  return (
                    <TouchableOpacity
                      key={day.id}
                      onPress={() => {
                        setActiveDayIndex(index);
                        setSelectedExercise(null);
                      }}
                      className={`px-6 py-2 rounded-full border ${
                        isActive 
                          ? 'bg-lime-300 border-lime-300' 
                          : 'bg-transparent border-zinc-300 dark:border-white/20'
                      }`}
                    >
                      <Text className={`font-bold ${
                        isActive ? 'text-black' : 'text-zinc-700 dark:text-white'
                      }`}>
                        Día {index + 1}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Active Day Summary */}
              <View className="mx-4 bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-200 dark:border-white/10">
                <View className="flex-row items-center gap-4">
                  <View className="bg-lime-500/10 dark:bg-lime-500/15 p-3 rounded-xl">
                    <Ionicons name="body-outline" size={32} className="text-zinc-900 dark:text-lime-300" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-zinc-900 dark:text-white font-bold text-lg">
                      {activeDay.day}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Ionicons name="barbell-outline" size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1 mr-3">
                        {activeDay.exercises.length} ejercicios
                      </Text>
                      <Ionicons name="time-outline" size={14} className="text-zinc-500 dark:text-zinc-400" />
                      <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">
                        {activeDay.approxTimeSession}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Exercises List */}
              <View className="px-4 pb-[100px]">
                {activeDay.exercises.map((exercise, idx) => (
                  <TouchableOpacity 
                    key={exercise.id} 
                    activeOpacity={0.7}
                    onPress={() => setSelectedExercise(exercise)}
                    className="flex-row bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-3 border border-zinc-200 dark:border-white/10 items-center"
                  >
                    {exercise.gifUrl ? (
                      <Image
                        source={{ uri: exercise.gifUrl }}
                        className="w-20 h-20 bg-white rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl items-center justify-center">
                        <Ionicons name="image-outline" size={24} className="text-zinc-400" />
                      </View>
                    )}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className="w-6 h-6 rounded-full bg-lime-500/10 dark:bg-lime-500/15 items-center justify-center">
                          <Text className="text-zinc-900 dark:text-lime-300 text-xs font-bold">{idx + 1}</Text>
                        </View>
                        <Text className="text-zinc-900 dark:text-white font-bold text-base flex-1" numberOfLines={1}>
                          {exercise.exercise}
                        </Text>
                      </View>
                      <View className="flex-row items-center flex-wrap gap-3">
                        <View className="flex-row items-center">
                          <Ionicons name="layers-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.sets}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="repeat-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{formatReps(exercise)}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.rest}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons name="weight" size={12} className="text-zinc-900 dark:text-lime-300" />
                          <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.weight}</Text>
                        </View>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} className="text-zinc-400 dark:text-zinc-500" />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Fixed Bottom Button */}
            <View className={`absolute bottom-0 w-full p-4 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/10 z-10`}>
              <TouchableOpacity 
                className="bg-lime-300 rounded-2xl p-4 flex-row justify-center items-center gap-2"
                onPress={() => {
                  handleClose();
                  router.push({
                    pathname: '/session',
                    params: { 
                      routineId: routine.id,
                      dayData: JSON.stringify(activeDay)
                    }
                  });
                }}
              >
                <Ionicons name="play-circle" size={24} className="text-black" />
                <View className="items-center">
                  <Text className="text-black font-bold text-base">
                    Comenzar Día {activeDayIndex + 1}
                  </Text>
                  <Text className="text-black/60 text-xs">
                    {activeDay.exercises.length} ejercicios • {activeDay.approxTimeSession}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Internal Stack Overlay */}
            {selectedExercise && (
              <ExerciseDetailView
                exercise={selectedExercise}
                onBack={() => setSelectedExercise(null)}
                onClose={handleClose}
              />
            )}

          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};
