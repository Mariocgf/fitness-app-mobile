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
      className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800"
    >
      {/* Nombre + chip */}
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1 mr-2">
          <View className="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
          <View className="w-1/2 h-4 bg-slate-200 dark:bg-slate-800 rounded" />
        </View>
        <View className="w-16 h-6 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </View>
      {/* Chips de metadata */}
      <View className="flex-row gap-2 mb-3">
        <View className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <View className="w-16 h-5 bg-slate-200 dark:bg-slate-800 rounded-full" />
      </View>
      {/* Fecha / duración */}
      <View className="flex-row justify-between">
        <View className="w-28 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
        <View className="w-20 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
      </View>
    </Animated.View>
  );
}
