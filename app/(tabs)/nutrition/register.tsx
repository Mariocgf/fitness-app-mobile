import { FoodRegisterView } from '@/src/components/features/nutrition/FoodRegisterView';
import { useFoodRegister } from '@/src/hooks/useFoodRegister';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { toast } from '@/src/components/ui/feedback';
import { normalizeMealType } from '@/src/utils/nutrition.utils';

export default function FoodRegisterScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialMealType = normalizeMealType(params.mealType);
  const {
    date,
    day,
    isLoading,
    error,
    refresh,
    replaceDay,
  } = useNutritionDay();

  const {
    selectedMealType,
    selectedMealCalories,
    selectedMealItems,
    isAdding,
    isSaving,
    canSave,
    error: addError,
    selectMealType,
    addFood,
    updateFoodGrams,
    saveFoods,
  } = useFoodRegister({
    date,
    day,
    initialMealType,
    onDayUpdated: replaceDay,
  });

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleSaveFoods = useCallback(async () => {
    const saved = await saveFoods();
    if (!saved) return;

    toast.success('Los alimentos se guardaron correctamente.');
  }, [saveFoods]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <FoodRegisterView
        selectedMealType={selectedMealType}
        selectedMealCalories={selectedMealCalories}
        selectedMealItems={selectedMealItems}
        isLoading={isLoading}
        error={error}
        addError={addError}
        isAdding={isAdding}
        isSaving={isSaving}
        canSave={canSave}
        onBack={handleBack}
        onMealChange={selectMealType}
        onRefresh={refresh}
        onAddFood={addFood}
        onFoodGramsChange={updateFoodGrams}
        onSave={handleSaveFoods}
      />
    </SafeAreaView>
  );
}
