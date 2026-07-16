import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

import { PlanViewModel } from '@/src/types/subscription';

import { getPlanFeatures } from './plan-features';

interface PlanFeatureListProps {
  plan: PlanViewModel;
}

/**
 * Bloque "Qué incluye" del paywall: los beneficios del plan seleccionado.
 *
 * El contenido lo resuelve `getPlanFeatures` a partir de los `unlockedModules` y el
 * cupo de créditos que devuelve el backend, así que la card se adapta sola al tier
 * elegido sin condicionales acá.
 */
export const PlanFeatureList: React.FC<PlanFeatureListProps> = ({ plan }) => (
  <View className="rounded-3xl bg-zinc-900 p-5">
    <Text className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
      Qué incluye
    </Text>

    <View className="mt-4 gap-3.5">
      {getPlanFeatures(plan).map((feature) => (
        <View key={feature.label} className="flex-row items-center">
          <Ionicons name={feature.icon} size={18} color="#a78bfa" />
          <Text className="ml-3 flex-1 text-sm leading-5 text-zinc-300">{feature.label}</Text>
        </View>
      ))}
    </View>
  </View>
);
