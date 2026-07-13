import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { PlanViewModel } from '@/src/types/subscription';

interface BillingOptionRowProps {
  plan: PlanViewModel;
  isSelected: boolean;
  /** Ahorro real del ciclo anual. `null` → sin badge (ver `computeAnnualSavingsPercent`). */
  savingsPercent?: number | null;
  onPress: () => void;
}

/** Etiqueta y aclaración del ciclo de cobro. */
const INTERVAL_COPY = {
  Annual: { label: 'Anual', caption: 'Se cobra una vez al año' },
  Monthly: { label: 'Mensual', caption: 'Se cobra todos los meses' },
} as const;

/**
 * Fila de ciclo de cobro dentro del plan elegido (radio + precio del store).
 *
 * Reusa el patrón de selección del repo (`border-{acento} bg-{acento}/10`), acá con
 * el violeta premium. El precio se muestra tal cual lo devuelve el store: NO se
 * deriva ni se reformatea (regla Apple/Google + evita romper monedas no-USD).
 */
export const BillingOptionRow: React.FC<BillingOptionRowProps> = ({
  plan,
  isSelected,
  savingsPercent,
  onPress,
}) => {
  const { label, caption } = INTERVAL_COPY[plan.billingInterval];

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className={`flex-row items-center rounded-2xl border p-4 ${
        isSelected ? 'border-violet-400 bg-violet-400/10' : 'border-zinc-800 bg-zinc-900'
      }`}
    >
      <Ionicons
        name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
        size={22}
        color={isSelected ? '#a78bfa' : '#52525b'}
      />

      <View className="ml-3 flex-1">
        <View className="flex-row items-center">
          <Text className="text-base font-semibold text-zinc-100">{label}</Text>
          {savingsPercent !== null && savingsPercent !== undefined ? (
            <View className="ml-2 rounded-full bg-violet-400/20 px-2 py-0.5">
              <Text className="text-xs font-semibold text-violet-300">
                Ahorrás {savingsPercent}%
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 text-xs text-zinc-500">{caption}</Text>
      </View>

      <Text className="ml-3 text-base font-bold text-zinc-50">{plan.localizedPrice}</Text>
    </TouchableOpacity>
  );
};
