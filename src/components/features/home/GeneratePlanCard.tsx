import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface GeneratePlanCardProps {
  /** Eyebrow en mayúsculas (ej: "Rutina", "Nutrición"). */
  eyebrow: string;
  /** Título principal de la card. */
  title: string;
  /** Descripción breve del estado vacío. */
  subtitle: string;
  /** Ícono del tile de acento. */
  icon: IoniconName;
  /** Color de acento del módulo (lime para fitness, amber para nutrición). */
  accentColor: string;
  /** Texto del botón en estado idle. */
  ctaLabel: string;
  /** Texto del botón mientras genera. */
  generatingLabel: string;
  /** Dispara la generación del plan. */
  onGenerate: () => void;
  /** true mientras la generación está en curso. */
  isGenerating: boolean;
}

/**
 * Card de estado vacío del Home (dark-only zinc) que invita a generar un plan
 * con IA cuando el usuario todavía no tiene rutina de ejercicio o de nutrición.
 * Es agnóstica al módulo: el color de acento y los textos se pasan por props
 * para reutilizarla tanto en Fitness (lime) como en Nutrición (amber).
 */
export function GeneratePlanCard({
  eyebrow,
  title,
  subtitle,
  icon,
  accentColor,
  ctaLabel,
  generatingLabel,
  onGenerate,
  isGenerating,
}: GeneratePlanCardProps) {
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <View className="flex-row items-center gap-4">
        <IconTile name={icon} color={accentColor} size={56} iconSize={28} />
        <View className="flex-1">
          <Text className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">
            {eyebrow}
          </Text>
          <Text className="text-white text-lg font-bold mt-0.5">{title}</Text>
          <Text className="text-zinc-400 text-sm mt-0.5 leading-5">{subtitle}</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onGenerate}
        disabled={isGenerating}
        activeOpacity={0.85}
        style={{ backgroundColor: accentColor }}
        className={`flex-row items-center justify-center gap-2 py-3 rounded-2xl ${
          isGenerating ? 'opacity-60' : ''
        }`}
      >
        {isGenerating ? (
          <ActivityIndicator size="small" color="#18181b" />
        ) : (
          <Ionicons name="sparkles" size={18} color="#18181b" />
        )}
        <Text className="text-zinc-900 font-bold text-base">
          {isGenerating ? generatingLabel : ctaLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
