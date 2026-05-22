import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { forwardRef, useEffect } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Routine } from '@/src/types/routine';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

export type CardState = 'initial' | 'loading' | 'success';

interface ActionCardProps {
  cardState: CardState;
  onGenerate: () => void;
  onViewPlan: () => void;
  routine?: Routine | null;
  isLoadingInitial?: boolean;
}

export const ActionCard = forwardRef<View, ActionCardProps>(({ cardState, onGenerate, onViewPlan, routine, isLoadingInitial = false }, ref) => {

  const sparkleOpacity = useSharedValue(1);
  const sparkleScale = useSharedValue(1);

  useEffect(() => {
    if (cardState === 'loading') {
      sparkleOpacity.value = withRepeat(withTiming(0.3, { duration: 700 }), -1, true);
      sparkleScale.value = withRepeat(withTiming(1.2, { duration: 700 }), -1, true);
    } else {
      sparkleOpacity.value = withTiming(1, { duration: 300 });
      sparkleScale.value = withTiming(1, { duration: 300 });
    }
  }, [cardState]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
    transform: [{ scale: sparkleScale.value }],
  }));

  return (
    <View
      ref={ref}
      collapsable={false}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 mx-4 mt-3"
    >
      {isLoadingInitial ? (
        <View className="flex-row items-center py-3">
          <ActivityIndicator size="small" color="#a3e635" />
          <Text className="text-slate-500 dark:text-slate-400 ml-3">Sincronizando...</Text>
        </View>
      ) : (
        <>
          {/* Sin rutina activa */}
          {cardState === 'initial' && (
            <>
              <View className="flex-row items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
                    Genera tu rutina
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 leading-5">
                    No tienes planes activos.{'\n'}Obtén tu primera rutina personalizada ahora.
                  </Text>
                </View>
                <Ionicons name="sparkles" size={40} className="text-slate-900 dark:text-slate-50" />
              </View>
              <TouchableOpacity
                onPress={onGenerate}
                activeOpacity={0.8}
                className="py-4 rounded-xl items-center bg-lime-400"
              >
                <Text className="text-slate-900 font-bold text-base">Generar rutina</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Generando rutina con IA */}
          {cardState === 'loading' && (
            <>
              <View className="flex-row items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
                    Genera tu rutina
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 leading-5">
                    Analizando tus preferencias con IA...
                  </Text>
                </View>
                <Animated.View style={animatedStyle}>
                  <Ionicons name="sparkles" size={40} className="text-slate-900 dark:text-slate-50" />
                </Animated.View>
              </View>
              <View className="py-4 rounded-xl items-center bg-lime-400 opacity-50">
                <ActivityIndicator size="small" color="#1e293b" />
              </View>
            </>
          )}

          {/* Rutina activa */}
          {cardState === 'success' && routine && (
            <>
              <View className="flex-row items-start mb-4">
                <View className="flex-1 pr-4">
                  <Text className="text-slate-900 dark:text-slate-50 text-2xl font-bold mb-2">
                    {routine.name}
                  </Text>
                  <Text className="text-slate-500 dark:text-slate-400 leading-5">
                    {routine.days.length} días/semana{'\n'}45 min por sesión.
                  </Text>
                </View>
                <Ionicons
                  name={routine.source === 'Manual' ? 'barbell-outline' : 'sparkles'}
                  size={40}
                  className="text-slate-900 dark:text-slate-50"
                />
              </View>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={onViewPlan}
                  activeOpacity={0.8}
                  className="flex-1 py-4 rounded-xl items-center bg-lime-400"
                >
                  <Text className="text-slate-900 font-bold text-base">Ver rutina</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onViewPlan}
                  activeOpacity={0.8}
                  className="px-4 rounded-xl items-center justify-center bg-slate-950 dark:bg-slate-50"
                >
                  <Ionicons name="play" size={22} className="text-lime-400" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
});
