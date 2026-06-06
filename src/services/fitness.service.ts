import apiClient from '../api/client';
import {
  Equipment,
  FitnessProfilePayload,
  FitnessSubGoal,
  FitnessTrainingPreferences,
  UpdateFitnessSubGoalRequest,
  UpdateFitnessTrainingPreferencesRequest,
} from '../types/fitness';

/**
 * Obtiene la lista de equipamiento disponible.
 * @param token El token de autenticación de Clerk.
 */
export const getEquipments = async (
  token: string | null
): Promise<Equipment[]> => {
  const { data } = await apiClient.get<Equipment[]>('/api/Fitness/equipments', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * Obtiene los sub-objetivos de un módulo.
 * @param moduleId El ID del módulo.
 * @param token El token de autenticación.
 */
export const getSubGoals = async (
  moduleId: string,
  token: string | null
): Promise<{ id: string; name: string; description: string }[]> => {
  const { data } = await apiClient.get<{ id: string; name: string; description: string }[]>(
    `/api/Goals/sub-goals/${moduleId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Obtiene los días y duración preferidos para entrenar.
 * @param token El token de autenticación.
 */
export const getTrainingPreferences = async (
  token: string | null
): Promise<FitnessTrainingPreferences> => {
  const { data } = await apiClient.get<FitnessTrainingPreferences>(
    '/api/fitness/training-preferences',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Actualiza los días y duración preferidos para entrenar.
 * @param payload Preferencias completas que reemplazan las anteriores.
 * @param token El token de autenticación.
 */
export const updateTrainingPreferences = async (
  payload: UpdateFitnessTrainingPreferencesRequest,
  token: string | null
) => {
  await apiClient.put('/api/fitness/training-preferences', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Obtiene el subobjetivo actual de Fitness.
 * @param token El token de autenticación.
 */
export const getFitnessSubGoal = async (
  token: string | null
): Promise<FitnessSubGoal | null> => {
  const response = await apiClient.get<FitnessSubGoal | ''>(
    '/api/fitness/sub-goal',
    {
      headers: { Authorization: `Bearer ${token}` },
      validateStatus: (status) => status === 200 || status === 204,
    }
  );

  if (response.status === 204 || !response.data) return null;
  return response.data;
};

/**
 * Actualiza el subobjetivo actual de Fitness.
 * @param payload Subobjetivo seleccionado.
 * @param token El token de autenticación.
 */
export const updateFitnessSubGoal = async (
  payload: UpdateFitnessSubGoalRequest,
  token: string | null
) => {
  await apiClient.put('/api/fitness/sub-goal', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/**
 * Envía el perfil de fitness del usuario.
 * @param payload Datos de experiencia, disponibilidad, entorno y equipamiento.
 * @param token El token de autenticación de Clerk.
 */
export const submitFitnessProfile = async (
  payload: FitnessProfilePayload,
  token: string | null
) => {
  const { data } = await apiClient.post(
    '/api/Onboarding/module/fitness',
    payload,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};
