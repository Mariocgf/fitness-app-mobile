import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { BodyEvolutionDashboardDto, BodyMetricTrend } from '@/src/types/health';

import { BodyMetricTrendCard } from './BodyMetricTrendCard';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface BodyEvolutionDashboardSectionProps {
  dashboard: BodyEvolutionDashboardDto | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

/** Ordena peso primero y luego perímetros sin hardcodear textos visibles. */
const sortMetrics = (metrics: BodyMetricTrend[]): BodyMetricTrend[] => {
  const weight = metrics.filter((metric) => metric.metric === 'weightKg');
  const perimeters = metrics.filter((metric) => metric.metric !== 'weightKg');
  return [...weight, ...perimeters];
};

/** Sección de evolución física con gráficas de tendencia por métrica corporal. */
export function BodyEvolutionDashboardSection({
  dashboard,
  isLoading,
  error,
  onRefresh,
}: BodyEvolutionDashboardSectionProps) {
  const metrics = sortMetrics(dashboard?.metrics ?? []);

  return (
    <View className="gap-3">
      <View className="px-4 flex-row items-start justify-between gap-4">
        <View className="flex-1">
          <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold">
            Evolución física
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Tendencias de peso y perímetros registradas por vos.
          </Text>
        </View>
      </View>

      <View className="px-4 gap-3">
        {isLoading && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 items-center justify-center h-36">
            <ActivityIndicator size="small" color="#e11d48" />
            <Text className="text-slate-500 dark:text-slate-400 text-sm mt-3">
              Cargando evolución...
            </Text>
          </View>
        )}

        {!isLoading && error != null && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="warning-outline"
                size={22}
                className="text-rose-600 dark:text-rose-400"
              />
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-slate-50 font-bold text-base">
                  No pudimos cargar las tendencias
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  {error}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              activeOpacity={0.8}
              className="mt-4 py-3 rounded-xl items-center bg-rose-600 dark:bg-rose-400"
            >
              <Text className="text-white dark:text-slate-900 font-bold">
                Reintentar evolución
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && error == null && metrics.length === 0 && (
          <View className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="body-outline"
                size={24}
                className="text-slate-500 dark:text-slate-400"
              />
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-slate-50 font-bold text-base">
                  Sin evolución para mostrar
                </Text>
                <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Registrá mediciones corporales para ver cómo cambian tus métricas.
                </Text>
              </View>
            </View>
          </View>
        )}

        {!isLoading && error == null && metrics.map((trend) => (
          <BodyMetricTrendCard key={trend.metric} trend={trend} />
        ))}
      </View>
    </View>
  );
}
