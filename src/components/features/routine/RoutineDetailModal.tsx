import { Routine } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, Modal, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { cssInterop } from 'nativewind';

cssInterop(Ionicons, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      color: true,
    },
  },
});

interface RoutineDetailModalProps {
  visible: boolean;
  onClose: () => void;
  routine: Routine | null;
}

export const RoutineDetailModal: React.FC<RoutineDetailModalProps> = ({ visible, onClose, routine }) => {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const router = useRouter();

  if (!routine) return null;

  const activeDay = routine.days[activeDayIndex];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        {/* Backdrop */}
        <TouchableOpacity
          className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Bottom Sheet */}
        <View className="bg-white dark:bg-zinc-950 w-full h-[90%] rounded-t-3xl overflow-hidden">
          {/* Header */}
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
              onPress={onClose}
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
                    onPress={() => setActiveDayIndex(index)}
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
                <View key={exercise.id} className="flex-row bg-zinc-100 dark:bg-zinc-900 rounded-2xl p-3 mb-3 border border-zinc-200 dark:border-white/10 items-center">
                  <Image
                    source={{ uri: exercise.gifUrl }}
                    className="w-20 h-20 bg-zinc-200 dark:bg-zinc-800 rounded-xl"
                    resizeMode="cover"
                  />
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
                        <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.reps}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={12} className="text-zinc-900 dark:text-lime-300" />
                        <Text className="text-zinc-500 dark:text-zinc-400 text-xs ml-1">{exercise.rest}</Text>
                      </View>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} className="text-zinc-400 dark:text-zinc-500" />
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Fixed Bottom Button */}
          <View className={`absolute bottom-0 w-full p-4 ${Platform.OS === 'ios' ? 'pb-8' : 'pb-4'} bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-white/10`}>
            <TouchableOpacity 
              className="bg-lime-300 rounded-2xl p-4 flex-row justify-center items-center gap-2"
              onPress={() => {
                onClose();
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
        </View>
      </View>
    </Modal>
  );
};
