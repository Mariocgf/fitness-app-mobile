import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { BodyMeasurementDto } from '@/src/types/health';

import { MeasurementHistoryCard } from './MeasurementHistoryCard';

const MAX_VISIBLE = 4;

interface MeasurementHistorySectionProps {
  measurements: BodyMeasurementDto[];
  totalCount: number;
  onPressItem: (measurement: BodyMeasurementDto) => void;
  onViewMore: () => void;
}

/**
 * Sección del dashboard de Salud que muestra hasta 4 mediciones recientes.
 * Si hay más de 4 en el historial, renderiza una card de "Ver historial completo".
 */
export function MeasurementHistorySection({
  measurements,
  totalCount,
  onPressItem,
  onViewMore,
}: MeasurementHistorySectionProps) {
  if (measurements.length === 0) return null;

  const visible = measurements.slice(0, MAX_VISIBLE);
  const hasMore = totalCount > MAX_VISIBLE;

  return (
    <View className="gap-3">
      <Text className="text-white text-xl font-bold px-4">
        Historial
      </Text>

      <View className="px-4 gap-3">
        {visible.map(item => (
          <MeasurementHistoryCard
            key={item.id}
            measurement={item}
            onPress={() => onPressItem(item)}
          />
        ))}

        {hasMore && (
          <TouchableOpacity
            onPress={onViewMore}
            activeOpacity={0.8}
            className="bg-rose-400 rounded-2xl p-4 flex-row items-center justify-between"
          >
            <Text className="text-zinc-900 font-semibold text-base">
              Ver historial completo
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-zinc-900 text-sm opacity-80">
                {totalCount} registros
              </Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                className="text-zinc-900"
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
