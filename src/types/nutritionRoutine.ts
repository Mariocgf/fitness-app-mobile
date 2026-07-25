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

/** Resumen de una rutina nutricional para el listado "Mis planes" (sin días/comidas) */
export interface NutritionRoutineSummaryDto {
  id: string;
  name: string;
  status: RoutineStatus;
  isActive: boolean;
  dayCount: number;
  createdAt: string;
  updatedAt: string | null;
}

/** Respuesta paginada del listado de rutinas nutricionales del usuario */
export interface PagedNutritionRoutinesResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: NutritionRoutineSummaryDto[];
}

/** Ítem de catálogo de nutrición (alergia o tipo de dieta). El nombre ya viene en español. */
export interface NutritionCatalogItem {
  id: string;
  name: string;
}

/**
 * Datos que pueblan el modal de generación del plan, en una sola respuesta.
 * Trae catálogo + selección con ids porque el modal EDITA alergias y dietas; los
 * objetivos son de solo lectura (los calcula el backend desde el perfil).
 */
export interface NutritionGenerationOptions {
  foodAllergies: NutritionCatalogItem[];
  typeOfDiets: NutritionCatalogItem[];
  selectedFoodAllergyIds: string[];
  selectedTypeOfDietIds: string[];
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
}

/**
 * Estado del modal de generación conservado en memoria tras un fallo, para reabrirlo
 * tal cual estaba y **sin repetir la llamada** a `generation-options`.
 *
 * Se descarta apenas la generación sale bien.
 */
export interface NutritionGenerationDraft {
  /**
   * Snapshot de `generation-options` (catálogos + objetivos). Sus `selected*Ids` son
   * lo que está guardado en el SERVIDOR, o sea la base del diff al reintentar:
   * - si el fallo fue al generar, `persist` ya impactó y acá viaja la selección nueva
   *   → el diff da vacío y no se repite el PUT.
   * - si el fallo fue al guardar, quedan los valores viejos → el diff reintenta.
   */
  options: NutritionGenerationOptions;
  /** Selección que el usuario tenía al generar: es lo que se vuelve a mostrar. */
  allergyIds: string[];
  dietIds: string[];
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
