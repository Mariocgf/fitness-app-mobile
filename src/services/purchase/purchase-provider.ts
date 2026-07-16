import { PurchasePlatform, PurchaseResult, StoreProduct } from '../../types/subscription';

/**
 * Adapter de compras. Aísla al paywall de CÓMO se obtienen precios y se compra:
 * en dev lo resuelve el emulador (mock); en prod, el SDK del store. El paywall
 * solo depende de esta interfaz, así migrar al pago real es un cambio de impl.
 */
export interface PurchaseProvider {
  /**
   * Devuelve los productos con su precio localizado por `productId`. En prod sale
   * del SDK del store; en dev, del catálogo del emulador. Los `productId` salen
   * de `GET /api/subscription/plans`.
   */
  getProducts(productIds: string[]): Promise<StoreProduct[]>;

  /**
   * Ejecuta la compra de un producto y devuelve el receipt/token para mandar a
   * `POST /validate`. En prod lo genera el SDK del store tras la compra real; en dev
   * lo genera y persiste el emulador (`POST /store/purchases`).
   *
   * `externalUserId` es la identidad "de store" del comprador. En prod el SDK la
   * resuelve solo (por eso es OPCIONAL acá), pero el emulador la exige en el body,
   * así que en dev se pasa el userId de Clerk.
   */
  purchase(
    productId: string,
    platform: PurchasePlatform,
    externalUserId?: string,
  ): Promise<PurchaseResult>;
}
