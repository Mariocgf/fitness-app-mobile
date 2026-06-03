import { FoodRegisterView } from '@/src/components/features/nutrition/FoodRegisterView';
import { useFoodRegister } from '@/src/hooks/useFoodRegister';
import { useNutritionDay } from '@/src/hooks/useNutritionDay';
import { NutritionRegisterState } from '@/src/store/nutrition-register-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

    Alert.alert(
      'Registro guardado',
      'Los alimentos se guardaron correctamente.',
    );
  }, [saveFoods]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      <NutritionRegisterState
        canSave={canSave}
        isSaving={isSaving}
        onSave={handleSaveFoods}
      />
      <FoodRegisterView
        selectedMealType={selectedMealType}
        selectedMealCalories={selectedMealCalories}
        selectedMealItems={selectedMealItems}
        isLoading={isLoading}
        error={error}
        addError={addError}
        isAdding={isAdding}
        onBack={handleBack}
        onMealChange={selectMealType}
        onRefresh={refresh}
        onAddFood={addFood}
        onFoodGramsChange={updateFoodGrams}
      />
    </SafeAreaView>
  );
}
