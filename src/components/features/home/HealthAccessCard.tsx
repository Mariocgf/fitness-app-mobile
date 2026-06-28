import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';

/** Acento del módulo Salud (colors.md → rose-400). */
const ROSE = '#fb7185';

interface HealthAccessCardProps {
  /** Abre el módulo de Salud. */
  onPress: () => void;
}

/**
 * Acceso al módulo de Salud desde el Home (dark-only zinc, acento rose-400).
 * Lleva a mediciones, datos clínicos y bienestar. No muestra datos derivados
 * (grasa/masa magra los calcula el backend), solo es la puerta de entrada.
 */
export function HealthAccessCard({ onPress }: HealthAccessCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex-row items-center gap-4"
    >
      <IconTile name="heart" color={ROSE} size={56} />
      <View className="flex-1">
        <Text className="text-white text-lg font-bold">Salud</Text>
        <Text className="text-zinc-400 text-sm mt-0.5">
          Mediciones, datos clínicos y bienestar.
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#71717a" />
    </TouchableOpacity>
  );
}
