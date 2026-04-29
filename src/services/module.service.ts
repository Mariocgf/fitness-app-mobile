import apiClient from '../api/client';
import { ActiveModule } from '../types/module';

/**
 * Obtiene los módulos activos del usuario autenticado.
 * GET /api/Modules/user/active → [{ name: "Fitness" | "Health" | "Nutrition" }]
 */
export const getActiveModules = async (
  token: string | null
): Promise<ActiveModule[]> => {
  const { data } = await apiClient.get<ActiveModule[]>(
    '/api/Modules/user/active',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  

  return data;
};
