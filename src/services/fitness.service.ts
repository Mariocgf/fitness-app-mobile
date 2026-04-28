import apiClient from '../api/client';
import { Equipment, FitnessProfilePayload } from '../types/fitness';

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
