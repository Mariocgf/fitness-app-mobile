import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { BodyMeasurementDto } from '@/src/types/health';

const MONTHS = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${day} de ${MONTHS[month - 1]}. ${year}`;
};

interface MeasurementHistoryCardProps {
  measurement: BodyMeasurementDto;
  onPress: () => void;
}

/** Card compacta para el listado del historial de mediciones corporales. */
export function MeasurementHistoryCard({ measurement, onPress }: MeasurementHistoryCardProps) {
  const perimeterCount = [
    measurement.waistCm, measurement.neckCm, measurement.hipCm, measurement.chestCm,
    measurement.armCm, measurement.forearmCm, measurement.thighCm, measurement.calfCm,
  ].filter(v => v != null).length;

  const metrics: string[] = [];
  if (measurement.weightKg != null) metrics.push(`${measurement.weightKg} kg`);
  if (measurement.bodyFatPercentage != null) {
    metrics.push(`${measurement.bodyFatPercentage.toFixed(1)}% grasa`);
  }

  const subtitle = [
    metrics.length > 0 ? metrics.join(' · ') : null,
    perimeterCount > 0
      ? `${perimeterCount} medida${perimeterCount !== 1 ? 's' : ''} perim.`
      : null,
  ]
    .filter(Boolean)
    .join('  ·  ');

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4"
    >
      <View className="flex-row items-center gap-3">
        <View className="w-1 self-stretch bg-rose-400 rounded-full" />

        <View className="flex-1">
          <Text className="text-white font-semibold text-base">
            {formatDate(measurement.date)}
          </Text>
          <Text className="text-zinc-400 text-sm mt-0.5">
            {subtitle || 'Sin datos registrados'}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={16}
          className="text-zinc-500"
        />
      </View>
    </TouchableOpacity>
  );
}
