import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { GradientText } from '@/src/components/common/GradientText';
import { IconTile } from '@/src/components/common/IconTile';
import { PlanViewModel } from '@/src/types/subscription';

/** Acento premium puntual (violeta → índigo), igual que la SubscriptionStatusCard. */
const PREMIUM_GRADIENT = ['#a78bfa', '#818cf8'] as const;

/** Etiqueta ES legible de un módulo desbloqueado. */
const moduleLabel = (moduleName: string): string => {
  switch (moduleName) {
    case 'fitness':
      return 'Fitness';
    case 'nutrition':
      return 'Nutrición';
    default:
      return moduleName;
  }
};

interface PlanCardProps {
  plan: PlanViewModel;
  isSelected: boolean;
  onPress: () => void;
}

/**
 * Card de plan del paywall. Componente propio (no `CheckableCard`) para dar lugar
 * al precio prominente, créditos y features. Mantiene el lenguaje visual de
 * `SubscriptionStatusCard`: fondo `zinc-900`, acento premium en tiers pagos y
 * borde de selección tipo radio.
 */
export const PlanCard: React.FC<PlanCardProps> = ({ plan, isSelected, onPress }) => {
  const isPremium = plan.tier !== 'Free';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`rounded-3xl border bg-zinc-900 p-5 ${
        isSelected ? 'border-zinc-100' : 'border-zinc-800'
      }`}
    >
      {/* Encabezado: icono + nombre/precio + indicador de selección */}
      <View className="flex-row items-center">
        <IconTile name="diamond-outline" color={isPremium ? '#a78bfa' : '#a1a1aa'} />
        <View className="ml-4 flex-1">
          {isPremium ? (
            <GradientText className="text-lg font-bold" colors={PREMIUM_GRADIENT}>
              {plan.name}
            </GradientText>
          ) : (
            <Text className="text-lg font-bold text-zinc-100">{plan.name}</Text>
          )}
          <Text className="mt-0.5 text-2xl font-bold text-zinc-50">{plan.localizedPrice}</Text>
        </View>
        <Ionicons
          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isSelected ? '#f4f4f5' : '#52525b'}
        />
      </View>

      {/* Créditos + módulos desbloqueados */}
      <View className="mt-4 border-t border-zinc-800 pt-4">
        <View className="flex-row items-center">
          <Ionicons name="sparkles-outline" size={16} color="#a1a1aa" />
          <Text className="ml-2 text-sm text-zinc-300">
            {plan.monthlyCredits} créditos mensuales
          </Text>
        </View>
        {plan.unlockedModules.map((moduleName) => (
          <View key={moduleName} className="mt-2 flex-row items-center">
            <Ionicons name="checkmark" size={16} color="#a1a1aa" />
            <Text className="ml-2 text-sm text-zinc-300">{moduleLabel(moduleName)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
};
