import { useAuth } from '@clerk/clerk-expo';
import { useCallback, useEffect, useRef, useState } from 'react';

import { getFoodByBarcode, searchFoods } from '../services/nutrition.service';
import { FoodCatalogItemDto } from '../types/nutrition';
import { getBarcodeLookupCandidates } from '../utils/barcode.utils';
import {
  abortRequest,
  beginAbortableRequest,
  endAbortableRequest,
  isCurrentRequest,
  isRequestCanceled,
} from '../utils/request-cancellation';

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
  const lookupRequestRef = useRef<AbortController | null>(null);

  getTokenRef.current = getToken;

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findFoodBySearchFallback = useCallback(async (
    code: string,
    token: string | null,
    signal?: AbortSignal,
  ): Promise<FoodCatalogItemDto | null> => {
    const result = await searchFoods(code, 1, BARCODE_SEARCH_PAGE_SIZE, token, signal);
    return result.items.find((item) => item.barcode === code) ?? result.items[0] ?? null;
  }, []);

  const scanBarcode = useCallback(async (code: string) => {
    const normalizedCode = code.trim();
    if (!normalizedCode || isResolvingRef.current || lastCodeRef.current === normalizedCode) {
      return null;
    }

    const controller = beginAbortableRequest(lookupRequestRef);
    const { signal } = controller;

    isResolvingRef.current = true;
    lastCodeRef.current = normalizedCode;
    setIsLookingUp(true);
    setError(null);

    try {
      const token = await getTokenRef.current();
      const candidates = getBarcodeLookupCandidates(normalizedCode);
      let lastError: unknown = null;

      for (const candidate of candidates) {
        if (signal.aborted) return null;
        try {
          return await getFoodByBarcode(candidate, token, signal);
        } catch (err) {
          if (signal.aborted || isRequestCanceled(err)) return null;
          lastError = err;
        }
      }

      for (const candidate of candidates) {
        if (signal.aborted) return null;
        const fallbackFood = await findFoodBySearchFallback(candidate, token, signal);
        if (fallbackFood) return fallbackFood;
      }

      throw lastError;
    } catch (err) {
      if (signal.aborted || isRequestCanceled(err)) return null;
      lastCodeRef.current = null;
      if (isCurrentRequest(lookupRequestRef, controller)) {
        setError('No encontramos ese alimento. Probá buscarlo por nombre.');
      }
      return null;
    } finally {
      if (isCurrentRequest(lookupRequestRef, controller)) {
        isResolvingRef.current = false;
        setIsLookingUp(false);
      }
      endAbortableRequest(lookupRequestRef, controller);
    }
  }, [findFoodBySearchFallback]);

  const resetScanner = useCallback(() => {
    abortRequest(lookupRequestRef);
    isResolvingRef.current = false;
    lastCodeRef.current = null;
    setIsLookingUp(false);
    setError(null);
  }, []);

  useEffect(() => () => {
    abortRequest(lookupRequestRef);
  }, []);

  return {
    isLookingUp,
    error,
    scanBarcode,
    resetScanner,
  };
}
