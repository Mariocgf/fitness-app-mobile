import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { BodyEvolutionDashboardDto, BodyMetricTrend } from '@/src/types/health';

import { BodyMetricTrendCard } from './BodyMetricTrendCard';

interface BodyEvolutionDashboardSectionProps {
  dashboard: BodyEvolutionDashboardDto | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  /** Navega a la pantalla con todas las métricas de evolución física. */
  onViewMore: () => void;
}

/** Ordena peso primero y luego perímetros sin hardcodear textos visibles. */
const sortMetrics = (metrics: BodyMetricTrend[]): BodyMetricTrend[] => {
  const weight = metrics.filter((metric) => metric.metric === 'weightKg');
  const perimeters = metrics.filter((metric) => metric.metric !== 'weightKg');
  return [...weight, ...perimeters];
};

/**
 * Sección de evolución física en el dashboard de Salud.
 * Muestra solo la métrica principal (peso); el resto vive en la pantalla "ver más".
 */
export function BodyEvolutionDashboardSection({
  dashboard,
  isLoading,
  error,
  onRefresh,
  onViewMore,
}: BodyEvolutionDashboardSectionProps) {
  const metrics = sortMetrics(dashboard?.metrics ?? []);
  // En el dashboard solo se pinta la primera métrica (peso primero por sortMetrics)
  const primaryMetric = metrics[0];
  const hasMore = metrics.length > 1;

  return (
    <View className="gap-3">
      <View className="px-4">
        <Text className="text-white text-xl font-bold">
          Evolución física
        </Text>
      </View>

      <View className="px-4 gap-3">
        {isLoading && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 items-center justify-center h-36">
            <ActivityIndicator size="small" color="#fb7185" />
            <Text className="text-zinc-400 text-sm mt-3">
              Cargando evolución...
            </Text>
          </View>
        )}

        {!isLoading && error != null && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="warning-outline"
                size={22}
                className="text-rose-400"
              />
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  No pudimos cargar las tendencias
                </Text>
                <Text className="text-zinc-400 text-sm mt-1">
                  {error}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onRefresh}
              activeOpacity={0.85}
              className="mt-4 py-3 rounded-2xl items-center bg-rose-400"
            >
              <Text className="text-zinc-900 font-bold">
                Reintentar evolución
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!isLoading && error == null && metrics.length === 0 && (
          <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5">
            <View className="flex-row items-start gap-3">
              <Ionicons
                name="body-outline"
                size={24}
                className="text-zinc-400"
              />
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  Sin evolución para mostrar
                </Text>
                <Text className="text-zinc-400 text-sm mt-1">
                  Registrá mediciones corporales para ver cómo cambian tus métricas.
                </Text>
              </View>
            </View>
          </View>
        )}

        {!isLoading && error == null && primaryMetric != null && (
          <BodyMetricTrendCard key={primaryMetric.metric} trend={primaryMetric} />
        )}

        {!isLoading && error == null && hasMore && (
          <TouchableOpacity
            onPress={onViewMore}
            activeOpacity={0.8}
            className="bg-rose-400 rounded-2xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-zinc-900 font-semibold text-base">
              Ver más métricas
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              className="text-zinc-900"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
