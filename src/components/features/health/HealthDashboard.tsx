import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { BodyEvolutionDashboardDto, BodyMeasurementDto } from '@/src/types/health';

import { BodyEvolutionDashboardSection } from './BodyEvolutionDashboardSection';
import { LastMeasurementCard } from './LastMeasurementCard';
import { MeasurementHistorySection } from './MeasurementHistorySection';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

interface HealthDashboardProps {
  lastMeasurement: BodyMeasurementDto | null;
  recentMeasurements: BodyMeasurementDto[];
  totalCount: number;
  evolutionDashboard: BodyEvolutionDashboardDto | null;
  isEvolutionLoading: boolean;
  evolutionError: string | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onRefreshEvolution: () => void;
  onRegister: () => void;
  onViewDetail?: () => void;
  onViewHistoryItem: (measurement: BodyMeasurementDto) => void;
  onViewMore: () => void;
}

/**
 * Vista principal de la pantalla de Salud.
 * Orquesta los estados de carga, error y contenido del dashboard.
 */
export function HealthDashboard({
  lastMeasurement,
  recentMeasurements,
  totalCount,
  evolutionDashboard,
  isEvolutionLoading,
  evolutionError,
  isLoading,
  error,
  onRefresh,
  onRefreshEvolution,
  onRegister,
  onViewDetail,
  onViewHistoryItem,
  onViewMore,
}: HealthDashboardProps) {
  // ── Estado de carga ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#e11d48" />
        <Text className="text-slate-500 dark:text-slate-400 mt-4">
          Cargando mediciones...
        </Text>
      </View>
    );
  }

  // ── Estado de error ───────────────────────────────────────────────────────
  if (error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons
          name="alert-circle-outline"
          size={44}
          className="text-rose-600 dark:text-rose-400"
        />
        <Text className="text-slate-900 dark:text-slate-50 text-xl font-bold mt-3">
          Algo falló
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-center mt-2">
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.8}
          className="bg-rose-600 dark:bg-rose-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-white dark:text-slate-900 font-bold">
            Reintentar
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <View className="pt-8 pb-32 gap-6">
      <View className="px-4">
        <Text className="text-slate-900 dark:text-slate-50 text-4xl font-bold">
          Salud
        </Text>
      </View>

      <View className="px-4">
        <LastMeasurementCard
          measurement={lastMeasurement}
          onRegister={onRegister}
          onViewDetail={onViewDetail}
        />
      </View>

      <BodyEvolutionDashboardSection
        dashboard={evolutionDashboard}
        isLoading={isEvolutionLoading}
        error={evolutionError}
        onRefresh={onRefreshEvolution}
      />

      <MeasurementHistorySection
        measurements={recentMeasurements}
        totalCount={totalCount}
        onPressItem={onViewHistoryItem}
        onViewMore={onViewMore}
      />
    </View>
  );
}
