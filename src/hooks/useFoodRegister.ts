import { logger } from '@/src/utils/logger';
import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { replaceMealItems } from '../services/nutrition.service';
import {
  ConsumedFoodItemDto,
  FoodCatalogItemDto,
  MealType,
  NutritionDayDto,
} from '../types/nutrition';
import {
  createEmptyNutritionDay,
  getMealItems,
} from '../utils/nutrition.utils';

interface UseFoodRegisterParams {
  date: string;
  day: NutritionDayDto | null;
  initialMealType: MealType;
  onDayUpdated: (day: NutritionDayDto) => void;
}

interface UseFoodRegisterReturn {
  selectedMealType: MealType;
  selectedMealCalories: number;
  selectedMealItems: ConsumedFoodItemDto[];
  isAdding: boolean;
  isSaving: boolean;
  canSave: boolean;
  error: string | null;
  selectMealType: (mealType: MealType) => void;
  addFood: (food: FoodCatalogItemDto, gramsConsumed: number) => Promise<boolean>;
  updateFoodGrams: (itemId: string, gramsConsumed: number) => void;
  saveFoods: () => Promise<boolean>;
}

const buildDayWithMealItems = (
  date: string,
  day: NutritionDayDto | null,
  mealType: MealType,
  items: ConsumedFoodItemDto[],
): NutritionDayDto => {
  const baseDay = day ?? createEmptyNutritionDay(date);
  const meals = baseDay.meals.map((meal) =>
    meal.mealType === mealType
      ? {
          ...meal,
          status: items.length > 0 ? 'Completed' : meal.status,
          items,
        }
      : meal,
  );

  const allItems = meals.flatMap((meal) => meal.items);

  return {
    ...baseDay,
    status: allItems.length > 0 ? 'InProgress' : baseDay.status,
    meals,
    totalCalories: allItems.reduce((total, item) => total + item.calories, 0),
    totalProteinGrams: allItems.reduce((total, item) => total + item.proteinGrams, 0),
    totalCarbsGrams: allItems.reduce((total, item) => total + item.carbsGrams, 0),
    totalFatGrams: allItems.reduce((total, item) => total + item.fatGrams, 0),
  };
};

/**
 * Orquesta el registro de alimentos para una comida concreta.
 */
export function useFoodRegister({
  date,
  day,
  initialMealType,
  onDayUpdated,
}: UseFoodRegisterParams): UseFoodRegisterReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const onDayUpdatedRef = useRef(onDayUpdated);

  getTokenRef.current = getToken;
  onDayUpdatedRef.current = onDayUpdated;

  const [selectedMealType, setSelectedMealType] = useState<MealType>(initialMealType);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftItems, setDraftItems] = useState<ConsumedFoodItemDto[]>([]);

  const persistedMealItems = useMemo(
    () => getMealItems(day, selectedMealType),
    [day, selectedMealType],
  );

  useEffect(() => {
    setDraftItems(persistedMealItems);
  }, [persistedMealItems]);

  const selectedMealCalories = useMemo(
    () => draftItems.reduce((total, item) => total + item.calories, 0),
    [draftItems],
  );

  const addFood = useCallback(async (
    food: FoodCatalogItemDto,
    gramsConsumed: number,
  ): Promise<boolean> => {
    setIsAdding(true);
    setError(null);

    try {
      setDraftItems((currentItems) => [
        ...currentItems,
        {
          id: `${food.barcode}-${Date.now()}`,
          name: food.productName,
          barcode: food.barcode,
          gramsConsumed,
          calories: (food.energyKcal100g * gramsConsumed) / 100,
          proteinGrams: (food.proteins100g * gramsConsumed) / 100,
          carbsGrams: (food.carbohydrates100g * gramsConsumed) / 100,
          fatGrams: (food.fat100g * gramsConsumed) / 100,
        },
      ]);
      return true;
    } catch (err) {
      logger.error('[useFoodRegister] Error:', err);
      setError('No pudimos agregar el alimento. Intentá de nuevo.');
      return false;
    } finally {
      setIsAdding(false);
    }
  }, []);

  const updateFoodGrams = useCallback((itemId: string, gramsConsumed: number) => {
    setDraftItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== itemId) return item;

        const previousGrams = item.gramsConsumed > 0 ? item.gramsConsumed : 1;
        const ratio = gramsConsumed / previousGrams;

        return {
          ...item,
          gramsConsumed,
          calories: item.calories * ratio,
          proteinGrams: item.proteinGrams * ratio,
          carbsGrams: item.carbsGrams * ratio,
          fatGrams: item.fatGrams * ratio,
        };
      }),
    );
  }, []);

  const saveFoods = useCallback(async (): Promise<boolean> => {
    setIsSaving(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      const optimisticDay = buildDayWithMealItems(date, day, selectedMealType, draftItems);
      const backendDay = await replaceMealItems(
        date,
        selectedMealType,
        {
          items: draftItems
            .filter((item) => item.barcode != null && item.barcode.length > 0)
            .map((item) => ({
              barcode: item.barcode as string,
              gramsConsumed: item.gramsConsumed,
            })),
        },
        token,
      );

      const updatedDay = backendDay?.meals != null
        ? buildDayWithMealItems(date, backendDay, selectedMealType, getMealItems(backendDay, selectedMealType))
        : optimisticDay;

      onDayUpdatedRef.current(updatedDay);
      return true;
    } catch (err) {
      logger.error('[useFoodRegister] Error saving foods:', err);
      setError('No pudimos guardar los alimentos. Intentá de nuevo.');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [date, day, draftItems, selectedMealType]);

  return {
    selectedMealType,
    selectedMealCalories,
    selectedMealItems: draftItems,
    isAdding,
    isSaving,
    canSave: draftItems.length > 0 && !isSaving,
    error,
    selectMealType: setSelectedMealType,
    addFood,
    updateFoodGrams,
    saveFoods,
  };
}
