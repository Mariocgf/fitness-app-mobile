import { PurchasePlatform, PurchaseResult, StoreProduct } from '../../types/subscription';
import { PurchaseProvider } from './purchase-provider';

/**
 * Adapter REAL (producción) — PENDIENTE. Acá se enchufa el SDK del store
 * (react-native-iap o RevenueCat). Requiere un dev build/prebuild: NO corre en
 * Expo Go. Migrar del mock a este provider es el único cambio necesario el día
 * que se active el pago real (ver `getProducts`/`purchase` de la interfaz).
 *
 * Referencia de implementación (cuando toque):
 * - `getProducts`: `getSubscriptions({ skus })` / `Purchases.getOfferings()`.
 * - `purchase`: `requestSubscription(...)` → receipt (iOS) / purchaseToken (Android).
 */
export const storePurchaseProvider: PurchaseProvider = {
  async getProducts(_productIds: string[]): Promise<StoreProduct[]> {
    throw new Error(
      'El pago real del store no está implementado todavía. Requiere un dev build con el SDK del store.',
    );
  },

  async purchase(_productId: string, _platform: PurchasePlatform): Promise<PurchaseResult> {
    throw new Error(
      'El pago real del store no está implementado todavía. Requiere un dev build con el SDK del store.',
    );
  },
};
