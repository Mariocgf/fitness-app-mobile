import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

/**
 * Shimmer del paywall mientras se cargan planes + precios. Calca la estructura real
 * (selector de plan → beneficios → ciclos de cobro → CTA) para que no salte el layout
 * al llegar los datos. Mismo patrón de opacidad pulsante que el resto del repo.
 */
export const PaywallSkeleton: React.FC = () => {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={animStyle} className="gap-5">
      {/* Selector de plan */}
      <View className="h-12 rounded-xl bg-zinc-900" />

      {/* Beneficios */}
      <View className="rounded-3xl bg-zinc-900 p-5">
        <View className="h-3 w-1/3 rounded bg-zinc-800" />
        <View className="mt-5 gap-3.5">
          <View className="h-3.5 w-5/6 rounded bg-zinc-800" />
          <View className="h-3.5 w-4/6 rounded bg-zinc-800" />
          <View className="h-3.5 w-3/4 rounded bg-zinc-800" />
        </View>
      </View>

      {/* Ciclos de cobro */}
      <View className="gap-3">
        <View className="h-20 rounded-2xl border border-zinc-800 bg-zinc-900" />
        <View className="h-20 rounded-2xl border border-zinc-800 bg-zinc-900" />
      </View>

      {/* CTA */}
      <View className="h-14 rounded-2xl bg-zinc-800" />
    </Animated.View>
  );
};
