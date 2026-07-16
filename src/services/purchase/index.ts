import { mockPurchaseProvider } from './mock-purchase-provider';
import { PurchaseProvider } from './purchase-provider';
// import { storePurchaseProvider } from './store-purchase-provider';

/**
 * Selecciona el adapter de compras activo. Hoy SIEMPRE el mock (emulador IAP),
 * porque el pago real requiere un dev build con el SDK del store. El día que se
 * active, cambiar acá al `storePurchaseProvider` (o ramificar por entorno) es el
 * único cambio: el paywall y los hooks solo dependen de la interfaz.
 */
export const getPurchaseProvider = (): PurchaseProvider => {
  // return __DEV__ ? mockPurchaseProvider : storePurchaseProvider;
  return mockPurchaseProvider;
};

export type { PurchaseProvider } from './purchase-provider';
export { getPurchasePlatform } from './platform';
