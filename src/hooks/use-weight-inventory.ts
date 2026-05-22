import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { WeightInventoryResponse, getWeightInventory } from '../services/equipment.service';

interface UseWeightInventoryResult {
  inventory: WeightInventoryResponse | null;
  loading: boolean;
  error: string | null;
}

/**
 * Obtiene el inventario de combinaciones de pesos alcanzables del usuario.
 * Realiza la llamada una sola vez al montar el componente.
 */
export const useWeightInventory = (): UseWeightInventoryResult => {
  const { getToken } = useAuth();
  const [inventory, setInventory] = useState<WeightInventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        const data = await getWeightInventory(token);
        if (!cancelled) setInventory(data);
      } catch {
        if (!cancelled) setError('No se pudo cargar el inventario de pesos.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchInventory();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { inventory, loading, error };
};
