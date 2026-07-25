import React from 'react';
import { Text, View } from 'react-native';

interface InfoChipsProps {
  items: string[];
}

/**
 * Chips informativos de solo lectura (equipamiento, lesiones, alergias, dietas).
 * Neutro a propósito (`zinc`, sin acento de módulo): lo usan los modales de generación
 * de Fitness y de Nutrición, que tienen acentos distintos.
 */
export default function InfoChips({ items }: InfoChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2 mb-3">
      {items.map((label) => (
        <View key={label} className="px-3 py-1.5 rounded-full bg-zinc-800 border border-zinc-700">
          <Text className="text-zinc-200 text-sm">{label}</Text>
        </View>
      ))}
    </View>
  );
}
