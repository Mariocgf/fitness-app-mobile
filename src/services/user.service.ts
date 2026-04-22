import apiClient from '../api/client';
import { BasicInfoPayload } from '../types/user';

/**
 * Envía los datos básicos del usuario (onboarding) al backend.
 * @param userId El ID del usuario proporcionado por Clerk (guardado como externalId en el backend).
 * @param payload Los datos del onboarding (fecha de nacimiento y género).
 * @param token El token de autenticación de Clerk.
 */
export const updateBasicInfo = async (
  userId: string,
  payload: BasicInfoPayload,
  token: string | null
) => {
  const { data } = await apiClient.put(
    `/api/Users/${userId}/profile/basic-info`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};
