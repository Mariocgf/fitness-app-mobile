import apiClient from '../api/client';
import { ExerciseInfo, ExerciseInstructions } from '../types/exercise';

/**
 * Obtiene la información detallada de un ejercicio.
 * @param exerciseId ID del ejercicio
 * @param token Token de autenticación de Clerk
 */
export const getExerciseInfo = async (
  exerciseId: string,
  token: string | null
): Promise<ExerciseInfo> => {
  const { data } = await apiClient.get<ExerciseInfo>(
    `/api/Exercise/${exerciseId}/info`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

/**
 * Obtiene las instrucciones de un ejercicio.
 * @param exerciseId ID del ejercicio
 * @param token Token de autenticación de Clerk
 */
export const getExerciseInstructions = async (
  exerciseId: string,
  token: string | null
): Promise<ExerciseInstructions> => {
  const { data } = await apiClient.get<ExerciseInstructions>(
    `/api/Exercise/${exerciseId}/instructions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return data;
};

export interface AdjustLoadResponse {
  weight: string | null;
  currentRep: string | null;
  durationSeconds: string | null;
}

/**
 * Ajusta la carga de un ejercicio en base al RPE reportado.
 * @param exerciseId ID del ejercicio
 * @param rpe Valor de RPE reportado (0-10)
 * @param token Token de autenticación de Clerk
 */
export const adjustExerciseLoad = async (
  exerciseId: string,
  routineDayId: string,
  rpe: number,
  token: string | null
): Promise<AdjustLoadResponse> => {
  const { data } = await apiClient.post<AdjustLoadResponse>(
    '/api/Exercise/adjust-load',
    { exerciseId, routineDayId, rpe },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  console.log(data);
  
  return data;
};
