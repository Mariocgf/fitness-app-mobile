import { RoutineSource } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface EmptyPreviewCardProps {
  source: RoutineSource;
}

/**
 * Card para mostrar cuando no hay rutinas de un tipo específico.
 * Mantiene el diseño consistente con RoutinePreviewCard.
 */
export function EmptyPreviewCard({ source }: EmptyPreviewCardProps) {
  const getMessage = () => {
    if (source === 'AI') {
      return 'No tenés rutinas generadas por IA';
    }
    return 'No tenés rutinas creadas manualmente';
  };

  const getIcon = () => {
    if (source === 'AI') {
      return 'sparkles-outline';
    }
    return 'create-outline';
  };

  const getIconColor = () => {
    if (source === 'AI') {
      return '#8b5cf6'; // violet-500
    }
    return '#64748b'; // slate-500
  };

  return (
    <View className="w-40 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mr-3 border border-dashed border-slate-300 dark:border-slate-700 items-center justify-center">
      <Ionicons name={getIcon()} size={24} color={getIconColor()} />
      <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-2 px-1">
        {getMessage()}
      </Text>
    </View>
  );
}
