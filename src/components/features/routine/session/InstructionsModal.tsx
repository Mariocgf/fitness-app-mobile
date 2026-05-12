import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Modal as RNModal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-expo';
import { getExerciseInstructions } from '@/src/services/exercise.service';
import { ExerciseInfo } from '@/src/types/exercise';

/** Modal que muestra las instrucciones paso a paso de un ejercicio */

interface InstructionsModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  visible,
  onClose,
  exerciseId,
  exerciseName,
}) => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  // 1. Verificar si la info ya está cacheada por la vista de detalle
  const cachedInfo = queryClient.getQueryData<ExerciseInfo>(['exercise-info', exerciseId]);

  // 2. Obtener instrucciones solo si no están en caché
  const { data: instructionsData, isLoading, isError } = useQuery({
    queryKey: ['exercise-instructions', exerciseId],
    queryFn: async () => {
      const token = await getToken();
      return getExerciseInstructions(exerciseId, token);
    },
    enabled: visible && !cachedInfo?.instructions,
    staleTime: Infinity,
  });

  const instructionsToDisplay = cachedInfo?.instructions || instructionsData?.instructions;

  return (
    <RNModal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        className="flex-1 bg-black/60 justify-center items-center p-4"
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          className="bg-zinc-900 w-full max-w-sm rounded-3xl p-6 border border-zinc-800"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-white font-bold text-lg flex-1 mr-4" numberOfLines={2}>
              {exerciseName}
            </Text>
            <TouchableOpacity onPress={onClose} className="bg-white/10 p-2 rounded-full">
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>

          <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
            {isLoading && !instructionsToDisplay ? (
              <ActivityIndicator size="small" color="#d9f99d" className="my-4" />
            ) : isError ? (
              <Text className="text-red-400 my-4 text-center">Error al cargar instrucciones</Text>
            ) : instructionsToDisplay && instructionsToDisplay.length > 0 ? (
              instructionsToDisplay.map((step, idx) => {
                const cleanStep = step.replace(/^Step\s*:?\s*\d+\s*:?\s*/i, '').trim();
                return (
                  <View key={idx} className="flex-row mb-3 last:mb-0">
                    <Text className="text-lime-300 font-bold mr-2 mt-0.5">
                      Step {idx + 1}:
                    </Text>
                    <Text className="text-zinc-300 flex-1 leading-5">
                      {cleanStep}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text className="text-zinc-400 my-4 text-center">No hay instrucciones disponibles</Text>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </RNModal>
  );
};
