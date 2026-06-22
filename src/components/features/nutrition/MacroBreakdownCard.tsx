import React from 'react';
import { Text, View } from 'react-native';

import { FillBar } from '@/src/components/common/FillBar';
import { computeMacroPercent } from '@/src/utils/nutritionRoutine.utils';

interface MacroColumnProps {
  grams: number;
  label: string;
  /** Relleno de la barra (0-1): aporte calórico del macro sobre el total */
  share: number;
}

/** Columna de un macro: gramos grandes + label + barra de aporte */
function MacroColumn({ grams, label, share }: MacroColumnProps) {
  return (
    <View className="flex-1 items-center px-2">
      <View className="flex-row items-baseline">
        <Text className="text-white text-2xl font-bold">{grams}</Text>
        <Text className="text-zinc-400 text-sm ml-0.5">g</Text>
      </View>
      <Text className="text-zinc-400 text-xs mt-0.5 mb-2">{label}</Text>
      <FillBar progress={share} className="w-full" heightClassName="h-1.5" />
    </View>
  );
}

interface MacroBreakdownCardProps {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

/**
 * Card de macros del detalle de comida: calorías totales arriba (número grande)
 * y tres columnas (proteína/carbohidratos/grasas) con su barra de aporte.
 *
 * La barra representa el porcentaje de calorías que aporta cada macro al plato
 * (no un objetivo: el detalle de comida no trae un target por macro).
 */
export function MacroBreakdownCard({ calories, proteins, carbs, fats }: MacroBreakdownCardProps) {
  const proteinKcal = proteins * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fats * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal || calories;

  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-2xl mx-4 mb-4 p-5">
      {/* Calorías totales */}
      <View className="flex-row items-baseline justify-center mb-5">
        <Text className="text-white text-5xl font-bold">{Math.round(calories)}</Text>
        <Text className="text-zinc-400 text-lg ml-1">kcal</Text>
      </View>

      {/* Columnas de macros con divisores */}
      <View className="flex-row">
        <MacroColumn
          grams={Math.round(proteins)}
          label="proteína"
          share={computeMacroPercent(proteinKcal, totalKcal) / 100}
        />
        <View className="w-px bg-zinc-800" />
        <MacroColumn
          grams={Math.round(carbs)}
          label="carbohidratos"
          share={computeMacroPercent(carbsKcal, totalKcal) / 100}
        />
        <View className="w-px bg-zinc-800" />
        <MacroColumn
          grams={Math.round(fats)}
          label="grasas"
          share={computeMacroPercent(fatKcal, totalKcal) / 100}
        />
      </View>
    </View>
  );
}
