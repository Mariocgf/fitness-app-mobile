import { RoutineSource } from '@/src/types/routine';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface RoutineFiltersProps {
  dateRange: DateRange;
  sourceFilter: 'all' | RoutineSource;
  isExpanded: boolean;
  onToggle: () => void;
  onDateRangeChange: (range: DateRange) => void;
  onSourceFilterChange: (filter: 'all' | RoutineSource) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

/**
 * Barra de filtros para la vista paginada de rutinas.
 * Permite filtrar por rango de fechas y por source (AI/Manual/Todas).
 */
export function RoutineFilters({
  dateRange,
  sourceFilter,
  isExpanded,
  onToggle,
  onDateRangeChange,
  onSourceFilterChange,
  onApplyFilters,
  onClearFilters,
}: RoutineFiltersProps) {
  const hasActiveFilters = sourceFilter !== 'all' || dateRange.from || dateRange.to;

  // Valor animado para la altura del contenido (0 = colapsado, 1 = expandido)
  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);

  React.useEffect(() => {
    const easing = Easing.inOut(Easing.ease);
    if (isExpanded) {
      animatedHeight.value = withTiming(1, { duration: 250, easing });
      animatedOpacity.value = withTiming(1, { duration: 200, easing });
    } else {
      animatedHeight.value = withTiming(0, { duration: 200, easing });
      animatedOpacity.value = withTiming(0, { duration: 150, easing });
    }
  }, [isExpanded, animatedHeight, animatedOpacity]);

  const contentStyle = useAnimatedStyle(() => ({
    height: animatedHeight.value * 200, // Altura máxima aproximada
    opacity: animatedOpacity.value,
    overflow: 'hidden',
  }));

  const getSourceLabel = (filter: 'all' | RoutineSource) => {
    switch (filter) {
      case 'AI':
        return 'Generadas por IA';
      case 'Manual':
        return 'Creadas manual';
      default:
        return 'Todas las rutinas';
    }
  };

  return (
    <View className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
      {/* Header - Tappable to expand/collapse */}
      <TouchableOpacity onPress={onToggle} className="flex-row items-center justify-between active:opacity-70">
        <View className="flex-row items-center">
          <Ionicons name="options-outline" size={16} color="#64748b" />
          <Text className="text-slate-900 dark:text-slate-50 font-semibold text-sm ml-2">
            Filtros
          </Text>
          {hasActiveFilters && (
            <View className="ml-2 px-2 py-0.5 bg-lime-400 rounded-full">
              <Text className="text-slate-900 text-xs font-medium">Activo</Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          {hasActiveFilters && (
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onClearFilters(); }} className="flex-row items-center mr-3">
              <Ionicons name="close-circle" size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">
                Limpiar
              </Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748b"
          />
        </View>
      </TouchableOpacity>

      {/* Expandable content con animación de altura */}
      <Animated.View style={contentStyle}>
        <View className="mt-3">
      {/* Filtro de Source */}
      <View className="mb-3">
        <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">
          Tipo de rutina
        </Text>
        <View className="flex-row gap-2">
          {(['all', 'AI', 'Manual'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => onSourceFilterChange(filter)}
              className={`px-3 py-2 rounded-lg border ${
                sourceFilter === filter
                  ? 'bg-lime-400 border-lime-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-medium ${
                  sourceFilter === filter
                    ? 'text-slate-900'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {filter === 'all' ? 'Todas' : filter === 'AI' ? 'IA' : 'Manual'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Filtro de Fecha */}
      <View className="mb-3">
        <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">
          Fecha de creación
        </Text>
        {(() => {
          const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
          const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
          const fromMs = dateRange.from?.getTime();
          const now = Date.now();
          const isWeek = !!fromMs && Math.abs(fromMs - (now - WEEK_MS)) < 60_000;
          const isMonth = !!fromMs && Math.abs(fromMs - (now - MONTH_MS)) < 60_000;
          return (
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onDateRangeChange({ from: new Date(now - WEEK_MS), to: new Date() })}
                className={`px-3 py-2 rounded-lg border ${
                  isWeek
                    ? 'bg-lime-400 border-lime-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text className={`text-xs font-medium ${isWeek ? 'text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}>
                  Última semana
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDateRangeChange({ from: new Date(now - MONTH_MS), to: new Date() })}
                className={`px-3 py-2 rounded-lg border ${
                  isMonth
                    ? 'bg-lime-400 border-lime-400'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Text className={`text-xs font-medium ${isMonth ? 'text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}>
                  Último mes
                </Text>
              </TouchableOpacity>
            </View>
          );
        })()}
      </View>

        {/* Nota sobre filtros de fecha */}
        <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
          <View className="flex-row items-start">
            <Ionicons name="information-circle-outline" size={14} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-xs ml-2 flex-1">
              Los filtros de fecha se aplican sobre la fecha de creación de las rutinas.
            </Text>
          </View>
        </View>
        </View>
      </Animated.View>
    </View>
  );
}
