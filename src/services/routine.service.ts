import apiClient from '../api/client';
import { Routine } from '../types/routine';
import { SessionLog } from '../types/session';
import { AxiosError } from 'axios';

/**
 * Genera una rutina personalizada usando la IA del backend.
 * Llama al endpoint POST /api/Routine/generate-routine.
 * @param token Token de autenticación de Clerk.
 */
export const generateRoutine = async (
  token: string | null
): Promise<Routine> => {
  const { data } = await apiClient.post<Routine>(
    '/api/Routine/generate-routine',
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
 * Obtiene la rutina activa del usuario.
 * @param token Token de autenticación de Clerk.
 */
export const getActiveRoutine = async (
  token: string | null
): Promise<Routine | null> => {
  try {
    const { data } = await apiClient.get<Routine>(
      '/api/Routine/active-routine',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

/**
 * Guarda una sesión de entrenamiento completada.
 * Llama al endpoint POST /api/Routine/sessions.
 * @param log Objeto con los datos de la sesión.
 * @param token Token de autenticación de Clerk.
 */
export const saveSession = async (
  log: SessionLog,
  token: string | null
): Promise<void> => {
  await apiClient.post(
    '/api/Routine/sessions',
    log,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
