import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_HEIGHT } from '@/src/components/features/routine/routine-detail-shared';
import { BodyEvolutionDashboardDto, BodyMetricTrend } from '@/src/types/health';

import { BodyMetricTrendCard } from './BodyMetricTrendCard';

/** Acento del módulo Salud (colors.md → rose-400 dark). */
const ROSE = '#fb7185';

interface BodyEvolutionViewProps {
  dashboard: BodyEvolutionDashboardDto | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
}

/** Ordena peso primero y luego perímetros sin hardcodear textos visibles. */
const sortMetrics = (metrics: BodyMetricTrend[]): BodyMetricTrend[] => {
  const weight = metrics.filter((metric) => metric.metric === 'weightKg');
  const perimeters = metrics.filter((metric) => metric.metric !== 'weightKg');
  return [...weight, ...perimeters];
};

/**
 * Vista "Evolución física" (`/health/evolution`). Header + todas las tendencias
 * por métrica corporal. Dark-only zinc, acento rose-400.
 */
export function BodyEvolutionView({
  dashboard,
  isLoading,
  error,
  onBack,
  onRefresh,
}: BodyEvolutionViewProps) {
  const insets = useSafeAreaInsets();
  const bottomOffset = insets.bottom + TAB_BAR_HEIGHT + 16;
  const metrics = sortMetrics(dashboard?.metrics ?? []);

  return (
    <View className="flex-1">
      {/* Header: back circular + título grande + subtítulo */}
      <View className="px-4 pt-4 pb-2">
        <TouchableOpacity
          onPress={onBack}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center mb-4"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-white text-4xl font-bold">Evolución física</Text>
        <Text className="text-zinc-400 mt-1">
          Mirá cómo cambian tus métricas corporales en el tiempo.
        </Text>
      </View>

      {isLoading && metrics.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ROSE} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: bottomOffset,
            gap: 12,
          }}
        >
          {error != null && (
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
                  <Text className="text-zinc-400 text-sm mt-1">{error}</Text>
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

          {error == null && metrics.length === 0 && (
            <View className="items-center justify-center py-16 gap-3">
              <Ionicons name="body-outline" size={44} color="#52525b" />
              <Text className="text-zinc-400 text-center">
                Registrá mediciones corporales para ver cómo cambian tus métricas.
              </Text>
            </View>
          )}

          {error == null &&
            metrics.map((trend) => (
              <BodyMetricTrendCard key={trend.metric} trend={trend} />
            ))}
        </ScrollView>
      )}
    </View>
  );
}
