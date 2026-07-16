import apiClient from '../api/client';
import { withRequestSignal } from '../utils/request-cancellation';

/** Combinación de pesos alcanzables para un tipo de equipo de carga por placas */
export interface PlateCombination {
  apiFamilyIdentifier: string;
  symmetryMultiplier: number;
  baseWeight: number;
  achievableWeights: number[];
}

/** Respuesta completa del inventario de pesos del usuario */
export interface WeightInventoryResponse {
  plateCombinations: PlateCombination[];
  dumbbellWeights: number[];
}

/**
 * Obtiene el inventario de combinaciones de pesos alcanzables del usuario.
 * Llama a GET /api/equipment/weight-inventory.
 * @param token Token de autenticación de Clerk.
 */
export const getWeightInventory = async (
  token: string | null,
  signal?: AbortSignal,
): Promise<WeightInventoryResponse> => {
  const { data } = await apiClient.get<WeightInventoryResponse>(
    '/api/equipment/weight-inventory',
    withRequestSignal({
      headers: { Authorization: `Bearer ${token}` },
    }, signal),
  );
  console.log(JSON.stringify(data));
  
  return data;
};
