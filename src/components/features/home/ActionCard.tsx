import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming } from 'react-native-reanimated';
import { Routine } from '@/src/types/routine';

export type CardState = 'initial' | 'loading' | 'success';

interface ActionCardProps {
  cardState: CardState;
  onGenerate: () => void;
  onViewPlan: () => void;
  routine?: Routine | null;
  isLoadingInitial?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ cardState, onGenerate, onViewPlan, routine, isLoadingInitial = false }) => {
  const sparkleOpacity = useSharedValue(0.5);
  const sparkleScale = useSharedValue(0.9);

  useEffect(() => {
    if (cardState === 'loading') {
      sparkleOpacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
      sparkleScale.value = withRepeat(withTiming(1.1, { duration: 800 }), -1, true);
    } else {
      sparkleOpacity.value = 1;
      sparkleScale.value = 1;
    }
  }, [cardState]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  return (
    <View className="bg-[#18181b] rounded-3xl p-6 mx-4 mt-2 overflow-hidden relative">
      {/* Background styling to simulate the dark glassmorphism / gradient from the image */}
      <View className="absolute inset-0 bg-white/5" />
      
      {isLoadingInitial ? (
        <View className="items-center justify-center py-6">
          <ActivityIndicator size="large" color="white" className="mb-4" />
          <Text className="text-white text-lg font-bold mb-2 text-center">Buscando información...</Text>
          <Text className="text-gray-400 text-center">Sincronizando con el servidor</Text>
        </View>
      ) : (
        <>
          {cardState === 'initial' && (
            <View>
              <View className="mb-4">
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">Comienza hoy</Text>
              <Text className="text-gray-300 mb-6">
                No tienes planes activos.{'\n'}Obtén tu rutina personalizada ahora.
              </Text>
              <TouchableOpacity 
                onPress={onGenerate}
                className="bg-zinc-100 py-3 rounded-2xl items-center"
              >
                <Text className="text-black font-bold text-base">Crear mi plan</Text>
              </TouchableOpacity>
            </View>
          )}

          {cardState === 'loading' && (
            <View className="items-center justify-center py-6">
              <Animated.View style={animatedStyle} className="mb-4">
                <Ionicons name="sparkles" size={48} color="white" />
              </Animated.View>
              <Text className="text-white text-lg font-bold mb-2 text-center">Generando tu rutina...</Text>
              <Text className="text-gray-400 text-center">Analizando tus preferencias con IA</Text>
            </View>
          )}

          {cardState === 'success' && routine && (
            <View>
              <View className="mb-4">
                <Ionicons name="sparkles" size={32} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold mb-2">{routine.name}</Text>
              <Text className="text-gray-300 mb-6">
                {routine.days.length} días/semana{'\n'}45 min por sesión.
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity 
                  onPress={onViewPlan}
                  className="bg-zinc-100 flex-1 py-3 rounded-2xl items-center"
                >
                  <Text className="text-black font-bold text-base">Ver mi plan</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="bg-lime-300 p-3 rounded-2xl items-center justify-center"
                >
                  <Ionicons name="play" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};
