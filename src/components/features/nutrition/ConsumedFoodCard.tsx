import React from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import RulerPicker from '@/src/components/common/RulerPicker';
import { ConsumedFoodItemDto } from '@/src/types/nutrition';
import { formatMacro } from '@/src/utils/nutrition.utils';

interface MacroChipProps {
  label: string;
  value: number;
}

function MacroChip({ label, value }: MacroChipProps) {
  return (
    <View className="bg-white dark:bg-slate-900 rounded-full px-4 py-2">
      <Text className="text-slate-900 dark:text-slate-50 font-semibold">
        {label}. {formatMacro(value)}
      </Text>
    </View>
  );
}

interface ConsumedFoodCardProps {
  item: ConsumedFoodItemDto;
  isGramsPickerVisible: boolean;
  onOpenGramsPicker: () => void;
  onGramsChange: (grams: number) => void;
}

/**
 * Card de alimento registrado. La marca no se muestra porque el DTO no la expone.
 */
export function ConsumedFoodCard({
  item,
  isGramsPickerVisible,
  onOpenGramsPicker,
  onGramsChange,
}: ConsumedFoodCardProps) {
  const { width } = useWindowDimensions();
  const rulerWidth = Math.min(width - 80, 320);

  return (
    <View className="bg-slate-100 dark:bg-slate-900 rounded-2xl p-4">
      <View className="flex-row items-start">
        <View className="flex-1 pr-3">
          <Text className="text-slate-900 dark:text-slate-50 text-base font-semibold">
            {item.name}
          </Text>
        </View>
        <View className="bg-black rounded-full px-4 py-2">
          <Text className="text-white font-bold">{Math.round(item.calories)} kcal</Text>
        </View>
      </View>

      {isGramsPickerVisible ? (
        <View
          onTouchStart={(event) => event.stopPropagation()}
          className="bg-white dark:bg-slate-800 mt-3 items-center rounded-2xl px-2 pt-3 pb-1"
        >
          <Text className="text-slate-900 dark:text-slate-50 text-xl font-semibold">
            {Math.round(item.gramsConsumed)} g
          </Text>
          <RulerPicker
            label="Gramos"
            min={1}
            max={500}
            initial={Math.round(item.gramsConsumed)}
            unit="g"
            showLabel={false}
            showValue={false}
            containerWidth={rulerWidth}
            onValueChange={onGramsChange}
          />
        </View>
      ) : (
        <Pressable
          onTouchStart={(event) => event.stopPropagation()}
          onPress={(event) => {
            event.stopPropagation();
            onOpenGramsPicker();
          }}
          className="bg-white dark:bg-slate-800 mt-3 items-center rounded-full py-3"
        >
          <Text className="text-slate-900 dark:text-slate-50 text-xl font-semibold">
            {Math.round(item.gramsConsumed)} g
          </Text>
        </Pressable>
      )}

      <View className="flex-row flex-wrap gap-3 mt-3">
        <MacroChip label="Pro" value={item.proteinGrams} />
        <MacroChip label="Ch" value={item.carbsGrams} />
        <MacroChip label="Gr" value={item.fatGrams} />
      </View>
    </View>
  );
}
