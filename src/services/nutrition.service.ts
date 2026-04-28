import apiClient from '../api/client';
import {
  NutritionItem,
  NutritionProfilePayload,
  SubGoal,
} from '../types/nutrition';

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
