import { HealthDashboard } from '@/src/components/features/health/HealthDashboard';
import { useBodyEvolutionDashboard } from '@/src/hooks/useBodyEvolutionDashboard';
import { useBodyMeasurements } from '@/src/hooks/useBodyMeasurements';
import { BodyMeasurementDto } from '@/src/types/health';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HealthScreen() {
  const router = useRouter();
  const { measurements, lastMeasurement, totalCount, isLoading, error, refresh } =
    useBodyMeasurements();
  const {
    dashboard: evolutionDashboard,
    isLoading: isEvolutionLoading,
    error: evolutionError,
    refresh: refreshEvolution,
  } = useBodyEvolutionDashboard();

  const refreshHealthData = useCallback(() => {
    refresh();
    refreshEvolution();
  }, [refresh, refreshEvolution]);

  // Evita el fetch doble: el hook ya carga en mount; solo refrescar en focuses posteriores
  const didInitialFocusRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!didInitialFocusRef.current) {
        didInitialFocusRef.current = true;
        return;
      }
      refreshHealthData();
    }, [refreshHealthData]),
  );

  const handleRegister = useCallback(() => {
    router.push('/health/measurements' as any);
  }, [router]);

  const handleViewDetail = useCallback(() => {
    if (!lastMeasurement) return;
    router.push({
      pathname: '/health/[id]' as any,
      params: { id: lastMeasurement.id, data: JSON.stringify(lastMeasurement) },
    });
  }, [lastMeasurement, router]);

  const handleViewHistoryItem = useCallback(
    (measurement: BodyMeasurementDto) => {
      router.push({
        pathname: '/health/[id]' as any,
        params: { id: measurement.id, data: JSON.stringify(measurement) },
      });
    },
    [router],
  );

  const handleViewMore = useCallback(() => {
    router.push('/health/history' as any);
  }, [router]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="flex-grow"
      >
        <HealthDashboard
          lastMeasurement={lastMeasurement}
          recentMeasurements={measurements}
          totalCount={totalCount}
          evolutionDashboard={evolutionDashboard}
          isEvolutionLoading={isEvolutionLoading}
          evolutionError={evolutionError}
          isLoading={isLoading}
          error={error}
          onRefresh={refreshHealthData}
          onRefreshEvolution={refreshEvolution}
          onRegister={handleRegister}
          onViewDetail={lastMeasurement ? handleViewDetail : undefined}
          onViewHistoryItem={handleViewHistoryItem}
          onViewMore={handleViewMore}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
