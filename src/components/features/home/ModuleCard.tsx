import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

interface ModuleCardProps {
  title: string;
  subtitle?: string;
  meta?: string;
  description?: string;
  actionLabel: string;
  onAction: () => void;
  isLoading?: boolean;
}

/** Card de módulo para el dashboard home: título, info contextual, divisor y acción de navegación */
export const ModuleCard: React.FC<ModuleCardProps> = ({
  title,
  subtitle,
  meta,
  description,
  actionLabel,
  onAction,
  isLoading = false,
}) => (
  <View className="bg-zinc-900 border border-zinc-800 rounded-2xl mx-4 mb-4 overflow-hidden">
    <View className="px-5 pt-5 pb-4">
      <Text className="text-white text-2xl font-bold mb-1">{title}</Text>

      {isLoading ? (
        <View className="flex-row items-center gap-2 mt-1">
          <ActivityIndicator size="small" color="#71717a" />
          <Text className="text-zinc-500 text-sm">Cargando...</Text>
        </View>
      ) : (
        <>
          {subtitle && <Text className="text-zinc-400 text-sm mb-0.5">{subtitle}</Text>}
          {meta && <Text className="text-zinc-400 text-sm">{meta}</Text>}
          {description && <Text className="text-zinc-400 text-sm leading-5">{description}</Text>}
        </>
      )}
    </View>

    <View className="h-px bg-zinc-800 mx-5" />

    <Pressable
      onPress={onAction}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      className="flex-row items-center justify-between px-5 py-4"
    >
      <Text className="text-white text-base font-medium">{actionLabel}</Text>
      <Ionicons name="arrow-forward" size={18} className="text-white" />
    </Pressable>
  </View>
);
