import {
  AdminCatalogDto,
  EmulatorPlatform,
  PurchasePlatform,
  PurchaseResult,
  StoreProduct,
} from '../../types/subscription';
import { logger } from '../../utils/logger';
import { createStorePurchase, getAdminCatalog } from './emulator-client';
import { PurchaseProvider } from './purchase-provider';

/** `appId` del emulador (configurable por env, con default del proyecto). */
const EMULATOR_APP_ID =
  process.env.EXPO_PUBLIC_IAP_EMULATOR_APP_ID || 'wellium-app';

/** El emulador espera la plataforma en minúscula (`ios`/`android`). */
const toEmulatorPlatform = (platform: PurchasePlatform): EmulatorPlatform =>
  platform === 'Ios' ? 'ios' : 'android';

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
    logger.log('[mock-purchase-provider] getProducts:', productIds);
    try {
      const catalog = await getAdminCatalog();
      const index = indexCatalogByProductId(catalog);
      const products = productIds
        .map((id) => index.get(id))
        .filter((product): product is StoreProduct => Boolean(product));

      const missing = productIds.filter((id) => !index.has(id));
      if (missing.length > 0) {
        logger.error(
          '[mock-purchase-provider] productId(s) no encontrados en el catálogo del emulador:',
          missing,
        );
      }
      logger.log('[mock-purchase-provider] getProducts OK:', products);
      return products;
    } catch (error) {
      logger.error('[mock-purchase-provider] getProducts FALLÓ:', error);
      throw error;
    }
  },

  async purchase(
    productId: string,
    platform: PurchasePlatform,
    externalUserId?: string,
  ): Promise<PurchaseResult> {
    // El emulador exige la identidad del comprador en el body. En prod el SDK del
    // store la resuelve solo; acá la pasa el hook (userId de Clerk). Sin ella no se
    // puede simular la compra de forma coherente.
    if (!externalUserId) {
      throw new Error(
        'Falta externalUserId para la compra emulada. Pasá el userId de Clerk al provider.',
      );
    }

    // Ya NO fabricamos el receipt: se lo pedimos al emulador, que lo GENERA y PERSISTE.
    // Ese es el token que el backend después valida contra su mock de Apple/Google.
    logger.log('[mock-purchase-provider] purchase (emulada):', { productId, platform, externalUserId });
    const purchase = await createStorePurchase({
      platform: toEmulatorPlatform(platform),
      planId: productId,
      externalUserId,
      appId: EMULATOR_APP_ID,
      scenario: 'success',
    });

    // Devolvemos en el shape del backend (`PurchasePlatform` en mayúscula). El
    // `receiptOrToken` es el persistido por el emulador, no uno inventado.
    return {
      platform,
      productId: purchase.productId,
      receiptOrToken: purchase.receiptOrToken,
    };
  },
};
