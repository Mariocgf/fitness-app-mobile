import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { ClinicalProfileDto } from '@/src/types/clinical';
import { BodyEvolutionDashboardDto, BodyMeasurementDto } from '@/src/types/health';

import { BodyEvolutionDashboardSection } from './BodyEvolutionDashboardSection';
import { ClinicalProfileCard } from './clinical/ClinicalProfileCard';
import { ClinicalReadingsEntryCard } from './clinical/ClinicalReadingsEntryCard';
import { RegisterReadingCard } from './clinical/RegisterReadingCard';
import { LastMeasurementCard } from './LastMeasurementCard';
import { MeasurementHistorySection } from './MeasurementHistorySection';
import { WellnessEntryCard } from './wellness/WellnessEntryCard';

interface HealthDashboardProps {
  lastMeasurement: BodyMeasurementDto | null;
  recentMeasurements: BodyMeasurementDto[];
  totalCount: number;
  evolutionDashboard: BodyEvolutionDashboardDto | null;
  isEvolutionLoading: boolean;
  evolutionError: string | null;
  evolutionPlanWarning: string | null;
  isLoading: boolean;
  error: string | null;
  clinicalProfile: ClinicalProfileDto | null;
  isClinicalLoading: boolean;
  clinicalReadingsCount: number;
  onRefresh: () => void;
  onRefreshEvolution: () => void;
  onRegister: () => void;
  onConfigureClinical: () => void;
  onRegisterReading: () => void;
  onViewClinicalReadings: () => void;
  onOpenWellness: () => void;
  onViewDetail?: () => void;
  onViewHistoryItem: (measurement: BodyMeasurementDto) => void;
  onViewMore: () => void;
  onViewEvolution: () => void;
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
  evolutionPlanWarning,
  isLoading,
  error,
  clinicalProfile,
  isClinicalLoading,
  clinicalReadingsCount,
  onRefresh,
  onRefreshEvolution,
  onRegister,
  onConfigureClinical,
  onRegisterReading,
  onViewClinicalReadings,
  onOpenWellness,
  onViewDetail,
  onViewHistoryItem,
  onViewMore,
  onViewEvolution,
}: HealthDashboardProps) {
  // ── Estado de carga ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#fb7185" />
        <Text className="text-zinc-400 mt-4">
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
          className="text-rose-400"
        />
        <Text className="text-white text-xl font-bold mt-3">
          Algo falló
        </Text>
        <Text className="text-zinc-400 text-center mt-2">
          {error}
        </Text>
        <TouchableOpacity
          onPress={onRefresh}
          activeOpacity={0.85}
          className="bg-rose-400 rounded-full px-6 py-3 mt-5"
        >
          <Text className="text-zinc-900 font-bold">
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
        <Text className="text-white text-4xl font-bold">
          Salud
        </Text>
      </View>

      {/* ── Acceso a Bienestar (sueño, hidratación, ánimo, meditación) ──────── */}
      <View className="px-4">
        <WellnessEntryCard onPress={onOpenWellness} />
      </View>

      {/* ── Bloque clínico ─────────────────────────────────────────────────── */}
      <View className="px-4">
        <ClinicalProfileCard
          profile={clinicalProfile}
          isLoading={isClinicalLoading}
          onPress={onConfigureClinical}
        />
      </View>

      <View className="px-4">
        <RegisterReadingCard onPress={onRegisterReading} />
      </View>

      <View className="px-4">
        <ClinicalReadingsEntryCard
          totalCount={clinicalReadingsCount}
          onPress={onViewClinicalReadings}
        />
      </View>

      {/* Divisor: separa el bloque clínico del bloque de medidas corporales */}
      <View className="px-4">
        <View className="h-px bg-zinc-800" />
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
        planWarning={evolutionPlanWarning}
        onRefresh={onRefreshEvolution}
        onViewMore={onViewEvolution}
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
