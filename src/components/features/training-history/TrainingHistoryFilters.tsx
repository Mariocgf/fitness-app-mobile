import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface TrainingHistoryFiltersProps {
  dateRange: DateRange;
  isExpanded: boolean;
  onToggle: () => void;
  onDateRangeChange: (range: DateRange) => void;
  onApply: () => void;
  onClear: () => void;
}

/**
 * Barra de filtros desplegables para el historial de entrenamiento.
 * Permite filtrar por rango de fechas con atajos: Hoy, Última semana, Último mes.
 */
export function TrainingHistoryFilters({
  dateRange,
  isExpanded,
  onToggle,
  onDateRangeChange,
  onApply,
  onClear,
}: TrainingHistoryFiltersProps) {
  const hasActiveFilters = !!(dateRange.from || dateRange.to);

  const animatedHeight = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);

  useEffect(() => {
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
    height: animatedHeight.value * 220,
    opacity: animatedOpacity.value,
    overflow: 'hidden',
  }));

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEK_MS = 7 * DAY_MS;
  const MONTH_MS = 30 * DAY_MS;

  const fromMs = dateRange.from?.getTime();
  const isToday = !!fromMs && Math.abs(fromMs - (now - DAY_MS)) < 60_000;
  const isWeek = !!fromMs && Math.abs(fromMs - (now - WEEK_MS)) < 60_000;
  const isMonth = !!fromMs && Math.abs(fromMs - (now - MONTH_MS)) < 60_000;

  return (
    <View className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
      {/* Header con toggle */}
      <TouchableOpacity
        onPress={onToggle}
        className="flex-row items-center justify-between active:opacity-70"
      >
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
            <TouchableOpacity
              onPress={(e) => { e.stopPropagation(); onClear(); }}
              className="flex-row items-center mr-3"
            >
              <Ionicons name="close-circle" size={14} color="#94a3b8" />
              <Text className="text-slate-500 dark:text-slate-400 text-xs ml-1">Limpiar</Text>
            </TouchableOpacity>
          )}
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#64748b"
          />
        </View>
      </TouchableOpacity>

      {/* Contenido desplegable */}
      <Animated.View style={contentStyle}>
        <View className="mt-3">
          <Text className="text-slate-500 dark:text-slate-400 text-xs mb-2">
            Período de entrenamiento
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            <TouchableOpacity
              onPress={() => onDateRangeChange({ from: new Date(now - DAY_MS), to: new Date() })}
              className={`px-3 py-2 rounded-lg border ${
                isToday
                  ? 'bg-lime-400 border-lime-400'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Text className={`text-xs font-medium ${isToday ? 'text-slate-900' : 'text-slate-600 dark:text-slate-400'}`}>
                Hoy
              </Text>
            </TouchableOpacity>
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

          {/* Botón aplicar */}
          <TouchableOpacity
            onPress={onApply}
            className="bg-lime-400 py-3 rounded-xl items-center"
            activeOpacity={0.8}
          >
            <Text className="text-slate-900 font-semibold text-sm">Aplicar filtros</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
