import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';

/** Acento del módulo Salud (colors.md → rose-400). */
const ROSE = '#fb7185';

/** Atajos de cantidad de agua (ml) para sumar de un toque. */
const QUICK_AMOUNTS = [250, 500];

interface HydrationQuickAddCardProps {
  /** Suma de ml registrados hoy. */
  todayMl: number;
  /** Suma agua de la cantidad indicada (siempre bebida = Agua). */
  onAdd: (amountMl: number) => void;
  /** Deshabilita los atajos mientras se persiste. */
  isSubmitting: boolean;
}

/**
 * Registro rápido de hidratación del Home (dark-only zinc, acento rose-400).
 * Acumulativo: siempre visible, muestra los ml de hoy y permite sumar +250/+500
 * de un toque (bebida = Agua). Para otros tipos de bebida se usa el form del
 * módulo Salud.
 */
export function HydrationQuickAddCard({
  todayMl,
  onAdd,
  isSubmitting,
}: HydrationQuickAddCardProps) {
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 gap-4">
      <View className="flex-row items-center gap-4">
        <IconTile name="water" color={ROSE} size={56} />
        <View className="flex-1">
          <Text className="text-white text-lg font-bold">Hidratación</Text>
          <Text className="text-zinc-400 text-sm mt-0.5">
            <Text className="text-rose-400 font-semibold">{todayMl}</Text> ml hoy
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        {QUICK_AMOUNTS.map((amount) => (
          <TouchableOpacity
            key={amount}
            onPress={() => onAdd(amount)}
            disabled={isSubmitting}
            activeOpacity={0.8}
            className={`flex-1 flex-row items-center justify-center gap-1 py-3 rounded-2xl border border-rose-400/50 ${
              isSubmitting ? 'opacity-50' : ''
            }`}
          >
            <Text className="text-rose-400 font-bold text-base">
              +{amount} ml
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
