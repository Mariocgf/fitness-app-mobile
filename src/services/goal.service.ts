import apiClient from '../api/client';
import { Goal } from '../types/goal';

/**
 * Obtiene la lista de objetivos globales.
 * @param token El token de autenticación de Clerk.
 */
export const getGlobalGoals = async (token: string | null): Promise<Goal[]> => {
  const { data } = await apiClient.get<Goal[]>('/api/Goals/global-goals', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

/**
 * Obtiene la lista de sub-objetivos para un objetivo global dado.
 * @param globalGoalId ID del objetivo global.
 * @param token El token de autenticación de Clerk.
 */
export const getSubGoals = async (
  globalGoalId: string,
  token: string | null
): Promise<Goal[]> => {
  const { data } = await apiClient.get<Goal[]>(
    `/api/Goals/${globalGoalId}/sub-goals`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};
