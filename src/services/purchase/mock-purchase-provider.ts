import {
  AdminCatalogDto,
  PurchasePlatform,
  PurchaseResult,
  StoreProduct,
} from '../../types/subscription';
import { getAdminCatalog } from './emulator-client';
import { PurchaseProvider } from './purchase-provider';

/** Formatea un monto + moneda para mostrar (ej. "$49.90" / "49.90 EUR"). */
const formatLocalizedPrice = (amount: number, currency: string): string => {
  if (currency === 'USD') return `$${amount.toFixed(2)}`;
  return `${amount.toFixed(2)} ${currency}`;
};

/**
 * Indexa el catálogo del emulador por `externalProductId`, que es el `productId`
 * que matchea con `GET /api/subscription/plans` y el que se manda a `POST /validate`.
 */
const indexCatalogByProductId = (catalog: AdminCatalogDto): Map<string, StoreProduct> => {
  const index = new Map<string, StoreProduct>();

  for (const app of catalog.apps ?? []) {
    for (const product of app.products ?? []) {
      for (const plan of product.plans ?? []) {
        const price = plan.prices?.[0];
        if (!price) continue;
        const amount = Number(price.amount);
        if (Number.isNaN(amount)) continue;

        for (const mapping of plan.providerMappings ?? []) {
          if (!mapping.externalProductId) continue;
          // Un mismo externalProductId puede repetirse entre providers (apple/google);
          // el precio es el mismo, así que la primera entrada alcanza.
          if (index.has(mapping.externalProductId)) continue;
          index.set(mapping.externalProductId, {
            productId: mapping.externalProductId,
            localizedPrice: formatLocalizedPrice(amount, price.currency),
            currency: price.currency,
            amount,
          });
        }
      }
    }
  }

  return index;
};

/**
 * Adapter MOCK (desarrollo): resuelve precios y "compra" contra el emulador IAP.
 * Simula lo que StoreKit/Play Billing devuelven en prod, detrás de la interfaz
 * `PurchaseProvider` para que el paywall no toque `/admin/*` directo.
 */
export const mockPurchaseProvider: PurchaseProvider = {
  async getProducts(productIds: string[]): Promise<StoreProduct[]> {
    const catalog = await getAdminCatalog();
    const index = indexCatalogByProductId(catalog);
    return productIds
      .map((id) => index.get(id))
      .filter((product): product is StoreProduct => Boolean(product));
  },

  async purchase(productId: string, platform: PurchasePlatform): Promise<PurchaseResult> {
    // Receipt/token simulado. En prod, esto lo devuelve el SDK del store tras la
    // compra real. El backend en dev acepta este token contra el emulador.
    const receiptOrToken = `mock-receipt-${platform}-${productId}-${Date.now()}`;
    return { platform, productId, receiptOrToken };
  },
};
