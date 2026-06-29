import { useAuth } from '@clerk/clerk-expo';
import { useEffect, useState } from 'react';
import { WeightInventoryResponse, getWeightInventory } from '../services/equipment.service';
import { isRequestCanceled } from '../utils/request-cancellation';

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
    const controller = new AbortController();
    const { signal } = controller;

    const fetchInventory = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = await getToken();
        if (signal.aborted) return;
        const data = await getWeightInventory(token, signal);
        if (!signal.aborted) setInventory(data);
      } catch (err) {
        if (signal.aborted || isRequestCanceled(err)) return;
        setError('No se pudo cargar el inventario de pesos.');
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchInventory();

    return () => {
      controller.abort();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { inventory, loading, error };
};
