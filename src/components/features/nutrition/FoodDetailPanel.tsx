import { QuantityStepper } from '@/src/components/common/QuantityStepper';
import { FoodCatalogItemDto } from '@/src/types/nutrition';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';

interface FoodDetailPanelProps {
  food: FoodCatalogItemDto;
  grams: number;
  onGramsChange: (grams: number) => void;
  isAdding: boolean;
  onAdd: () => void;
  onBack: () => void;
}

/**
 * Tile de dato nutricional del detalle: valor grande + unidad `g` y label debajo.
 * Ocupa media columna (`w-[48%]`) para armar el grid 2×3 de la maqueta.
 */
function NutritionFact({ label, value }: { label: string; value: number | null }) {
  const rounded = value == null ? null : Math.round(value * 10) / 10;
  return (
    <View className="bg-zinc-900 border border-zinc-800 rounded-2xl py-5 px-4 items-center w-[48%]">
      <View className="flex-row items-baseline">
        <Text className="text-white text-3xl font-bold">{rounded ?? '—'}</Text>
        {rounded != null && (
          <Text className="text-zinc-400 text-base font-medium ml-1">g</Text>
        )}
      </View>
      <Text className="text-zinc-400 text-sm mt-1">{label}</Text>
    </View>
  );
}

/**
 * Vista de detalle de un alimento dentro del `FoodSearchSheet`: nombre + marca,
 * selector de cantidad con badge de kcal y grid nutricional 2×3. El CTA inferior
 * agrega el alimento con los gramos elegidos.
 */
export function FoodDetailPanel({
  food,
  grams,
  onGramsChange,
  isAdding,
  onAdd,
  onBack,
}: FoodDetailPanelProps) {
  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-5 pt-4 pb-4"
      >
        {/* Header: back circular + título y marca centrados */}
        <TouchableOpacity
          onPress={onBack}
          className="w-11 h-11 rounded-full bg-zinc-800 items-center justify-center"
        >
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View className="items-center px-4 mt-1 mb-6">
          <Text className="text-white text-3xl font-bold text-center">
            {food.productName}
          </Text>
          {food.brand && (
            <Text className="text-zinc-400 text-base mt-1 text-center" numberOfLines={1}>
              {food.brand}
            </Text>
          )}
        </View>

        {/* Cantidad: stepper actual + badge de kcal (acento amber) */}
        <View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-zinc-400 text-base">Cantidad</Text>
            <View className="border border-amber-400 rounded-xl px-3 py-1.5">
              <Text className="text-amber-400 font-bold">
                {Math.round((food.energyKcal100g * grams) / 100)} kcal
              </Text>
            </View>
          </View>
          <QuantityStepper
            value={grams}
            onChange={onGramsChange}
            min={1}
            max={2000}
            step={5}
          />
        </View>

        {/* Información nutricional: grid 2×3 */}
        <Text className="text-white text-lg font-bold mt-6 mb-3">
          Información nutricional
        </Text>
        <View className="flex-row flex-wrap gap-3">
          <NutritionFact label="Proteína" value={(food.proteins100g * grams) / 100} />
          <NutritionFact label="Carbohidratos" value={(food.carbohydrates100g * grams) / 100} />
          <NutritionFact label="Grasas" value={(food.fat100g * grams) / 100} />
          <NutritionFact label="Grasas sat." value={food.saturatedFat100g == null ? null : (food.saturatedFat100g * grams) / 100} />
          <NutritionFact label="Fibra" value={food.fiber100g == null ? null : (food.fiber100g * grams) / 100} />
          <NutritionFact label="Sal" value={food.salt100g == null ? null : (food.salt100g * grams) / 100} />
        </View>
      </ScrollView>

      <View className="px-5 pt-3">
        <TouchableOpacity
          disabled={isAdding}
          onPress={onAdd}
          activeOpacity={0.85}
          className="bg-amber-400 rounded-full py-4 flex-row items-center justify-center"
        >
          {isAdding ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <>
              <Ionicons name="restaurant" size={20} color="#18181b" />
              <Text className="text-zinc-900 font-bold text-base ml-2">
                Agregar alimento
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
