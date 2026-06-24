import apiClient from '../api/client';
import {
  AddConsumedFoodItemPayload,
  FoodCatalogItemDto,
  FoodSearchResultDto,
  MealType,
  NutritionDayDto,
  NutritionItem,
  NutritionProfileDto,
  NutritionProfilePayload,
  NutritionTargetDto,
  ReplaceMealItemsPayload,
  SubGoal,
} from '../types/nutrition';

const unwrapApiData = <T>(value: T | { data: T }): T => {
  if (
    value &&
    typeof value === 'object' &&
    'data' in value &&
    Object.keys(value).length === 1
  ) {
    return (value as { data: T }).data;
  }

  return value as T;
};

/**
 * Obtiene los sub-objetivos de un módulo dado.
 * @param moduleId ID del módulo (Nutrition).
 * @param token El token de autenticación de Clerk.
 */
export const getSubGoals = async (
  moduleId: string,
  token: string | null
): Promise<SubGoal[]> => {
  const { data } = await apiClient.get<SubGoal[]>(
    `/api/Goals/sub-goals/${moduleId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Obtiene la lista de alergias alimentarias.
 * @param token El token de autenticación de Clerk.
 */
export const getFoodAllergies = async (
  token: string | null
): Promise<NutritionItem[]> => {
  const { data } = await apiClient.get<NutritionItem[]>(
    '/api/Nutrition/food-allergies',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Obtiene la lista de preferencias dietéticas (estilos de dieta).
 * @param token El token de autenticación de Clerk.
 */
export const getDietaryPreferences = async (
  token: string | null
): Promise<NutritionItem[]> => {
  const { data } = await apiClient.get<NutritionItem[]>(
    '/api/Nutrition/type-of-diets',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Envía el perfil de nutrición del usuario.
 * @param payload Alergias, preferencias dietéticas y sub-objetivos seleccionados.
 * @param token El token de autenticación de Clerk.
 */
export const submitNutritionProfile = async (
  payload: NutritionProfilePayload,
  token: string | null
) => {
  const { data } = await apiClient.post(
    '/api/Onboarding/module/nutrition',
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Obtiene el perfil nutricional calculado por el backend.
 */
export const getNutritionProfile = async (
  token: string | null,
): Promise<NutritionProfileDto> => {
  const { data } = await apiClient.get<NutritionProfileDto>(
    '/api/Nutrition/profile',
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return unwrapApiData(data);
};

/**
 * Obtiene los objetivos nutricionales para un rango de fechas.
 */
export const getNutritionTargets = async (
  from: string,
  to: string,
  token: string | null,
): Promise<NutritionTargetDto[]> => {
  const { data } = await apiClient.get<NutritionTargetDto[] | { data: NutritionTargetDto[] }>(
    '/api/nutrition/targets',
    {
      params: { from, to },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return unwrapApiData(data);
};

/**
 * Obtiene el día nutricional con sus comidas e items cargados.
 */
export const getNutritionDay = async (
  date: string,
  token: string | null,
): Promise<NutritionDayDto> => {
  const { data } = await apiClient.get<NutritionDayDto | { data: NutritionDayDto }>(
    `/api/nutrition/days/${date}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return unwrapApiData(data);
};

/**
 * Busca alimentos del catálogo nutricional.
 */
export const searchFoods = async (
  query: string,
  page: number,
  pageSize: number,
  token: string | null,
): Promise<FoodSearchResultDto> => {
  const { data } = await apiClient.get<FoodSearchResultDto | FoodCatalogItemDto[] | { data: FoodSearchResultDto | FoodCatalogItemDto[] }>(
    '/api/nutrition/foods',
    {
      params: { query, page, pageSize },
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  
  const unwrapped = unwrapApiData(data);

  if (Array.isArray(unwrapped)) {
    return {
      items: unwrapped,
      page,
      pageSize,
      hasNextPage: unwrapped.length === pageSize,
    };
  }
  

  return unwrapped;
};

/**
 * Busca un alimento por código de barras.
 */
export const getFoodByBarcode = async (
  code: string,
  token: string | null,
): Promise<FoodCatalogItemDto> => {
  const { data } = await apiClient.get<FoodCatalogItemDto | { data: FoodCatalogItemDto }>(
    `/api/nutrition/foods/barcode/${code}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  
  
  return unwrapApiData(data);
};

/**
 * Agrega un alimento consumido a una comida del día.
 */
export const addFoodToMeal = async (
  date: string,
  mealType: MealType,
  payload: AddConsumedFoodItemPayload,
  token: string | null,
): Promise<NutritionDayDto> => {
  const { data } = await apiClient.post<NutritionDayDto | { data: NutritionDayDto }>(
    `/api/nutrition/days/${date}/meals/${mealType}/items`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  return unwrapApiData(data);
};

/**
 * Reemplaza la lista de alimentos consumidos de una comida del día.
 */
export const replaceMealItems = async (
  date: string,
  mealType: MealType,
  payload: ReplaceMealItemsPayload,
  token: string | null,
): Promise<NutritionDayDto | null> => {
  const { data } = await apiClient.put<NutritionDayDto | { data: NutritionDayDto }>(
    `/api/nutrition/days/${date}/meals/${mealType}/items`,
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!data) return null;
  return unwrapApiData(data);
};
