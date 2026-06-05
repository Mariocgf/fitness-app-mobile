import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useRef, useState } from 'react';

import { getFoodByBarcode, searchFoods } from '../services/nutrition.service';
import { FoodCatalogItemDto } from '../types/nutrition';
import { getBarcodeLookupCandidates } from '../utils/barcode.utils';

const BARCODE_SEARCH_PAGE_SIZE = 20;

interface UseFoodBarcodeScannerReturn {
  isLookingUp: boolean;
  error: string | null;
  scanBarcode: (code: string) => Promise<FoodCatalogItemDto | null>;
  resetScanner: () => void;
}

/**
 * Resuelve códigos de barras contra el backend y evita lecturas duplicadas.
 */
export function useFoodBarcodeScanner(): UseFoodBarcodeScannerReturn {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const isResolvingRef = useRef(false);
  const lastCodeRef = useRef<string | null>(null);

  getTokenRef.current = getToken;

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findFoodBySearchFallback = useCallback(async (
    code: string,
    token: string | null,
  ): Promise<FoodCatalogItemDto | null> => {
    const result = await searchFoods(code, 1, BARCODE_SEARCH_PAGE_SIZE, token);
    return result.items.find((item) => item.barcode === code) ?? result.items[0] ?? null;
  }, []);

  const scanBarcode = useCallback(async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode || isResolvingRef.current || lastCodeRef.current === normalizedCode) {
      return null;
    }

    isResolvingRef.current = true;
    lastCodeRef.current = normalizedCode;
    setIsLookingUp(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      const candidates = getBarcodeLookupCandidates(normalizedCode);
      let lastError: unknown = null;

      for (const candidate of candidates) {
        try {
          return await getFoodByBarcode(candidate, token);
        } catch (err) {
          lastError = err;
        }
      }

      for (const candidate of candidates) {
        const fallbackFood = await findFoodBySearchFallback(candidate, token);
        if (fallbackFood) return fallbackFood;
      }

      throw lastError;
    } catch (err) {
      lastCodeRef.current = null;
      setError('No encontramos ese alimento. Probá buscarlo por nombre.');
      return null;
    } finally {
      isResolvingRef.current = false;
      setIsLookingUp(false);
    }
  }, [findFoodBySearchFallback]);

  const resetScanner = useCallback(() => {
    isResolvingRef.current = false;
    lastCodeRef.current = null;
    setIsLookingUp(false);
    setError(null);
  }, []);

  return {
    isLookingUp,
    error,
    scanBarcode,
    resetScanner,
  };
}
