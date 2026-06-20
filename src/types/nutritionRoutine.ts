import { MealType } from './nutrition';

export type RoutineDayName =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday';

export type RoutineStatus = 'Draft' | 'Active' | 'Saved';

export interface RoutineMealSummaryDto {
  id: string;
  type: MealType;
  name: string;
  description: string;
}

export interface RoutineDayDto {
  id: string;
  day: RoutineDayName;
  meals: RoutineMealSummaryDto[];
}

export interface NutritionRoutineDto {
  id: string;
  name: string;
  status: RoutineStatus;
  createdAt: string;
  days: RoutineDayDto[];
}

export interface RoutineRecipeIngredient {
  name: string;
  amount: string;
}

export interface RoutineMealDetailDto {
  id: string;
  type: MealType;
  name: string;
  description: string;
  /** Calorías como string — puede incluir unidades o aproximaciones */
  calories: string;
  /** Proteínas en gramos como string */
  proteins: string;
  /** Carbohidratos en gramos como string */
  carbs: string;
  /** Grasas en gramos como string */
  fats: string;
  recipe: {
    instructions: string;
    ingredients: RoutineRecipeIngredient[];
  };
}
