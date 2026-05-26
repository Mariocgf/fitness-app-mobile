import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface EmptyTrainingHistoryProps {
  variant: 'preview' | 'list';
  hasFilters?: boolean;
  onClearFilters?: () => void;
}

/**
 * Estado vacío para las vistas de historial de entrenamiento.
 * En 'preview' muestra un mensaje compacto; en 'list' muestra un estado centrado con opción de limpiar filtros.
 */
export function EmptyTrainingHistory({
  variant,
  hasFilters = false,
  onClearFilters,
}: EmptyTrainingHistoryProps) {
  if (variant === 'preview') {
    return (
      <View className="w-40 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 items-center justify-center">
        <Ionicons name="barbell-outline" size={28} color="#94a3b8" />
        <Text className="text-slate-500 dark:text-slate-400 text-xs text-center mt-2 leading-4">
          Sin sesiones registradas
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <Ionicons name="barbell-outline" size={48} color="#94a3b8" />
      <Text className="text-slate-900 dark:text-slate-50 text-base font-medium mt-4 text-center">
        {hasFilters ? 'No hay sesiones con esos filtros' : 'Todavía no hay sesiones registradas'}
      </Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
        {hasFilters
          ? 'Probá ajustando el rango de fechas.'
          : 'Completá un entrenamiento para ver tu historial acá.'}
      </Text>
      {hasFilters && onClearFilters && (
        <TouchableOpacity
          onPress={onClearFilters}
          className="mt-4 bg-slate-200 dark:bg-slate-800 px-6 py-3 rounded-xl"
          activeOpacity={0.8}
        >
          <Text className="text-slate-900 dark:text-slate-50 font-semibold">
            Limpiar filtros
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
