import {
  ConsumedFoodItemDto,
  MealType,
  NutritionDayDto,
  NutritionMealDto,
  NutritionProfileDto,
  NutritionTargetDto,
} from '../types/nutrition';

export const MEAL_ORDER: MealType[] = ['Breakfast', 'Lunch', 'AfternoonSnack', 'Dinner'];

export const MEAL_LABELS: Record<MealType, string> = {
  Breakfast: 'Desayuno',
  Lunch: 'Almuerzo',
  AfternoonSnack: 'Merienda',
  Dinner: 'Cena',
};

export const MEAL_ICONS: Record<MealType, string> = {
  Breakfast: 'cafe-outline',
  Lunch: 'restaurant-outline',
  AfternoonSnack: 'fast-food-outline',
  Dinner: 'moon-outline',
};

export const getTodayDateKey = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getMeal = (
  day: NutritionDayDto | null,
  mealType: MealType,
): NutritionMealDto | null =>
  day?.meals.find((meal) => meal.mealType === mealType) ?? null;

export const getMealItems = (
  day: NutritionDayDto | null,
  mealType: MealType,
): ConsumedFoodItemDto[] => getMeal(day, mealType)?.items ?? [];

export const getMealCalories = (
  day: NutritionDayDto | null,
  mealType: MealType,
): number =>
  getMealItems(day, mealType).reduce((total, item) => total + item.calories, 0);

export const formatMacro = (value: number | null | undefined): string => {
  if (value == null) return '0g';
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded}g`;
};

export const formatKcal = (value: number | null | undefined): string =>
  `${Math.round(value ?? 0)} kcal`;

export const normalizeMealType = (
  value: string | string[] | undefined,
): MealType => {
  const raw = Array.isArray(value) ? value[0] : value;
  return MEAL_ORDER.includes(raw as MealType) ? (raw as MealType) : 'AfternoonSnack';
};

export const createEmptyNutritionDay = (date: string): NutritionDayDto => ({
  date,
  status: 'Pending',
  totalCalories: 0,
  totalProteinGrams: 0,
  totalCarbsGrams: 0,
  totalFatGrams: 0,
  meals: MEAL_ORDER.map((mealType) => ({
    id: `${date}-${mealType}`,
    mealType,
    status: 'Pending',
    items: [],
  })),
});

export const createTargetFromProfile = (
  date: string,
  profile: NutritionProfileDto,
): NutritionTargetDto => ({
  date,
  calories: profile.targetCalories,
  proteinGrams: profile.targetProteinGrams,
  carbsGrams: profile.targetCarbsGrams,
  fatGrams: profile.targetFatGrams,
  calculationLevel: profile.calculationLevel,
  hasPlannedTraining: false,
});
