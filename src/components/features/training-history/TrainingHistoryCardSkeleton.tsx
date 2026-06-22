import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface TrainingHistoryCardSkeletonProps {
  /** 'preview' → card horizontal compacta; 'list' → card vertical de lista */
  variant: 'preview' | 'list';
}

/**
 * Shimmer skeleton para las cards de historial de entrenamiento.
 * Usa opacidad pulsante con Reanimated (sin StyleSheet.create).
 */
export function TrainingHistoryCardSkeleton({ variant }: TrainingHistoryCardSkeletonProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.4, { duration: 900 }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (variant === 'preview') {
    return (
      <Animated.View
        style={animStyle}
        className="w-40 bg-white dark:bg-slate-900 rounded-xl p-3 mr-3 border border-slate-200 dark:border-slate-800"
      >
        {/* Chip superior */}
        <View className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded-full mb-3" />
        {/* Nombre rutina línea 1 */}
        <View className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
        {/* Nombre rutina línea 2 */}
        <View className="w-3/4 h-3 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
        {/* Fecha */}
        <View className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
        {/* Duración */}
        <View className="w-2/3 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={animStyle}
      className="flex-row items-center bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
    >
      {/* Icon-tile */}
      <View className="w-12 h-12 rounded-2xl bg-zinc-800 mr-3" />
      {/* Nombre + meta */}
      <View className="flex-1">
        <View className="w-3/4 h-4 bg-zinc-800 rounded mb-2" />
        <View className="w-1/2 h-3 bg-zinc-800 rounded" />
      </View>
    </Animated.View>
  );
}
