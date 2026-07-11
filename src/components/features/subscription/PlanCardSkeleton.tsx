import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Shimmer skeleton de una `PlanCard` mientras se cargan planes + precios.
 * Copia el patrón de opacidad pulsante de `TrainingHistoryCardSkeleton`
 * (Reanimated, sin `StyleSheet.create`).
 */
export const PlanCardSkeleton: React.FC = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={animStyle}
      className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5"
    >
      {/* Encabezado: tile + nombre + precio */}
      <View className="flex-row items-center">
        <View className="w-11 h-11 rounded-2xl bg-zinc-800" />
        <View className="ml-4 flex-1">
          <View className="w-1/2 h-4 bg-zinc-800 rounded mb-2" />
          <View className="w-1/3 h-6 bg-zinc-800 rounded" />
        </View>
      </View>
      {/* Detalle: créditos + features */}
      <View className="mt-4 border-t border-zinc-800 pt-4">
        <View className="w-2/3 h-3 bg-zinc-800 rounded mb-2" />
        <View className="w-1/2 h-3 bg-zinc-800 rounded" />
      </View>
    </Animated.View>
  );
};
