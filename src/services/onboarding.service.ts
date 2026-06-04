import apiClient from '../api/client';
import { BasicInfoPayload, Module, OnboardingStatusResponse } from '../types/user';
/**
 * Sincroniza el usuario autenticado contra Clerk/backend antes de consultar estado de onboarding.
 * Evita depender exclusivamente del webhook, que puede llegar tarde.
 */
export const syncAuthenticatedUser = async (
  token: string | null
) => {
  const { data } = await apiClient.post(
    '/api/Auth/sync',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Envía los datos básicos del usuario (onboarding) al backend.
 * @param payload Los datos del onboarding (género, fecha de nacimiento, altura, peso y objetivo).
 * @param token El token de autenticación de Clerk.
 */
export const setBasicInfo = async (
  payload: BasicInfoPayload,
  token: string | null
) => {
  const { data } = await apiClient.post(
    `/api/Onboarding/basic-info`,
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Obtiene el estado actual del onboarding del usuario.
 * @param token El token de autenticación de Clerk.
 */
export const getOnboardingStatus = async (
  token: string | null
): Promise<OnboardingStatusResponse> => {
  const { data } = await apiClient.get<OnboardingStatusResponse>(
    '/api/Onboarding/status',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(data);
  
  return data;
};

/**
 * Obtiene la lista de módulos disponibles.
 * @param token El token de autenticación de Clerk.
 */
export const getModules = async (
  token: string | null
): Promise<Module[]> => {
  const { data } = await apiClient.get<Module[]>(
    '/api/Modules',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Envía los módulos seleccionados por el usuario durante el onboarding.
 * @param moduleIds IDs de los módulos seleccionados.
 * @param token El token de autenticación de Clerk.
 */
export const setSelectedModules = async (
  moduleIds: string[],
  token: string | null
) => {
  const { data } = await apiClient.post(
    '/api/Onboarding/modules',
    { moduleIds },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Acepta los términos y condiciones de privacidad.
 * @param token El token de autenticación de Clerk.
 */
export const acceptTerms = async (
  token: string | null
) => {
  const { status } = await apiClient.post(
    '/api/Users/accept-terms',
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return status === 204;
};

