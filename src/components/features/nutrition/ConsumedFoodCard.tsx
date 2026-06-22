import React from 'react';
import { Text, View } from 'react-native';

import { IconTile } from '@/src/components/common/IconTile';
import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { ConsumedFoodItemDto } from '@/src/types/nutrition';

import { MacroPills } from './MacroPills';

interface ConsumedFoodCardProps {
  item: ConsumedFoodItemDto;
  onGramsChange: (grams: number) => void;
}

/**
 * Card de alimento registrado (dark `zinc`/`amber`). Estructura de la maqueta:
 * icon-tile + nombre + kcal, stepper de gramos y pills de macros.
 *
 * No muestra marca ni un ícono por categoría: `ConsumedFoodItemDto` no expone
 * `brand` ni tipo de alimento (ver `agent-implementation-lessons.md`). Se degrada
 * a un `IconTile` genérico de nutrición.
 */
export function ConsumedFoodCard({ item, onGramsChange }: ConsumedFoodCardProps) {
  return (
    <View className="bg-zinc-900 rounded-2xl p-4">
      <View className="flex-row items-center">
        <IconTile name="nutrition-outline" size={48} />
        <View className="flex-1 px-3">
          <Text
            className="text-white text-base font-semibold"
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>
        <View className="flex-row items-baseline">
          <Text className="text-white text-lg font-bold">
            {Math.round(item.calories)}
          </Text>
          <Text className="text-zinc-400 text-xs font-medium ml-1">kcal</Text>
        </View>
      </View>

      <View className="mt-3">
        <QuantityStepper
          value={item.gramsConsumed}
          onChange={onGramsChange}
          min={1}
          max={2000}
          step={5}
        />
      </View>

      <View className="mt-3">
        <MacroPills
          protein={item.proteinGrams}
          carbs={item.carbsGrams}
          fat={item.fatGrams}
        />
      </View>
    </View>
  );
}
