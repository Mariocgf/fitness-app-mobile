import apiClient from '../api/client';
import {
  HealthProfilePayload,
  Injury,
  MedicalCondition,
} from '../types/health';

/**
 * Obtiene la lista de lesiones disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getInjuries = async (
  token: string | null
): Promise<Injury[]> => {
  const { data } = await apiClient.get<Injury[]>('/api/Health/injuries', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

/**
 * Obtiene la lista de afecciones médicas disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getMedicalConditions = async (
  token: string | null
): Promise<MedicalCondition[]> => {
  const { data } = await apiClient.get<MedicalCondition[]>(
    '/api/Health/medical-conditions',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return data;
};

/**
 * Envía el perfil de salud del usuario (lesiones y afecciones médicas).
 * @param payload Los IDs de lesiones y afecciones seleccionadas.
 * @param token El token de autenticación de Clerk.
 */
export const submitHealthProfile = async (
  payload: HealthProfilePayload,
  token: string | null
) => {
  const { data } = await apiClient.post('/api/Onboarding/module/health', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};
