// ── Tipos del backend ──

export interface SubGoal {
  id: string;
  name: string;
  description: string;
}

export interface NutritionItem {
  id: string;
  name: string;
}

// ── Payload del POST ──

export interface NutritionProfilePayload {
  allergyIds: string[];
  dietaryPreferenceIds: string[];
  subGoalId: string;
  activityLevel?: ActivityLevel | null;
}

// ── Draft local ──

export interface NutritionConfigDraft {
  selectedSubGoalId?: string | null;
  allergyIds?: string[];
  dietaryPreferenceIds?: string[];
  activityLevel?: ActivityLevel | null;
}

export type ActivityLevel =
  | 'Sedentary'
  | 'Light'
  | 'Moderate'
  | 'Active'
  | 'VeryActive';

export interface NutritionActivityLevelOption {
  value: ActivityLevel;
  label: string;
  description: string;
}

export const NUTRITION_ACTIVITY_LEVEL_OPTIONS: NutritionActivityLevelOption[] = [
  {
    value: 'Sedentary',
    label: 'Sedentario',
    description: 'Poco movimiento diario.',
  },
  {
    value: 'Light',
    label: 'Ligero',
    description: 'Actividad suave algunos días.',
  },
  {
    value: 'Moderate',
    label: 'Moderado',
    description: 'Actividad regular durante la semana.',
  },
  {
    value: 'Active',
    label: 'Activo',
    description: 'Entrenás o te movés bastante.',
  },
  {
    value: 'VeryActive',
    label: 'Muy activo',
    description: 'Actividad intensa o trabajo físico.',
  },
];

// ── Seguimiento diario de nutrición ──

export type MealType = 'Breakfast' | 'Lunch' | 'AfternoonSnack' | 'Dinner';

export type MealStatus = 'Pending' | 'Completed' | 'Skipped';

export interface NutritionProfileDto {
  userId: string;
  selectedSubGoalId: string | null;
  activityLevel: string;
  activityLevelSource: string;
  calculationLevel: string;
  bmrKcal: number;
  tdeeKcal: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
}

export interface NutritionTargetDto {
  date: string;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  calculationLevel: string;
  hasPlannedTraining: boolean;
}

export interface ConsumedFoodItemDto {
  id: string;
  name: string;
  barcode: string | null;
  gramsConsumed: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
}

export interface NutritionMealDto {
  id: string;
  mealType: MealType;
  status: MealStatus;
  items: ConsumedFoodItemDto[];
}

export interface NutritionDayDto {
  date: string;
  status: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  meals: NutritionMealDto[];
}

export interface FoodCatalogItemDto {
  id: string;
  barcode: string;
  productName: string;
  brand: string | null;
  energyKcal100g: number;
  fat100g: number;
  saturatedFat100g: number | null;
  carbohydrates100g: number;
  sugars100g: number | null;
  fiber100g: number | null;
  proteins100g: number;
  salt100g: number | null;
}

export interface FoodSearchResultDto {
  items: FoodCatalogItemDto[];
  page: number;
  pageSize: number;
  totalCount?: number;
  hasNextPage?: boolean;
}

export interface AddConsumedFoodItemPayload {
  barcode: string;
  name: string;
  brand: string | null;
  gramsConsumed: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  saturatedFatPer100g: number | null;
  sugarPer100g: number | null;
  fiberPer100g: number | null;
  saltPer100g: number | null;
}

export interface ReplaceMealItemsPayload {
  items: Array<{
    barcode: string;
    gramsConsumed: number;
  }>;
}
