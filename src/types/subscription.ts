// ── Uniones literales del dominio ──

/** Niveles de suscripción que devuelve el backend. */
export type SubscriptionTier = 'Free' | 'Fitness' | 'Nutrition' | 'Full';

/** Estado de una suscripción/validación. 200 con `invalid` NO es error HTTP. */
export type SubscriptionStatusValue =
  | 'active'
  | 'pending'
  | 'expired'
  | 'invalid'
  | 'none';

/** Modalidad de cobro. */
export type BillingInterval = 'Monthly' | 'Annual';

/** Plataforma de compra que espera el backend en `POST /validate` y `/credits/addon`. */
export type PurchasePlatform = 'Ios' | 'Android';

// ── DTOs del backend ──

/** Plan del catálogo. Free aparece con `productId: null`. */
export interface SubscriptionPlanDto {
  tier: SubscriptionTier;
  name: string;
  /** Precio de REFERENCIA. El precio real y localizado lo trae el store/emulador. */
  price: number;
  currency: string;
  monthlyCredits: number;
  billingInterval: BillingInterval;
  productId: string | null;
  unlockedModules: string[];
}

/** Estado de suscripción del usuario (`GET /me` y respuesta de `POST /validate`). */
export interface SubscriptionStatusDto {
  tier: SubscriptionTier;
  status: SubscriptionStatusValue;
  /** ISO date; `null` si no hay período activo. */
  currentPeriodEnd: string | null;
  monthlyCredits: number;
  billingInterval: BillingInterval;
  productId: string | null;
}

/** Resultado de comprar el add-on de créditos. `granted: false` NO es error. */
export interface PurchaseAddonResultDto {
  granted: boolean;
  newBalance: number;
  creditsAdded: number;
  /** Motivo cuando `granted: false` (Free, ya otorgado, compra inválida). */
  reason: string | null;
}

// ── Payloads de POST ──

export interface ValidatePurchaseRequest {
  platform: PurchasePlatform;
  productId: string;
  /** Receipt (iOS) o purchaseToken (Android). En dev, un token simulado. */
  receiptOrToken: string;
}

export interface PurchaseAddonRequest {
  platform: PurchasePlatform;
  productId: string;
  receiptOrToken: string;
}

// ── Catálogo del emulador IAP (solo dev, detrás del adapter) ──
// Forma de `GET /admin/catalog`. El paywall NO consume esto directo: lo lee el
// mock adapter y lo normaliza a `StoreProduct`.

export interface CatalogPrice {
  region: string;
  currency: string;
  /** Monto como string, ej. "49.90". */
  amount: string;
}

export interface CatalogProviderMapping {
  provider: string;
  externalProductId: string;
  externalBasePlanId?: string;
}

export interface CatalogPlan {
  id: string;
  productType: string;
  billingPeriod?: string;
  prices: CatalogPrice[];
  providerMappings: CatalogProviderMapping[];
}

export interface CatalogProduct {
  id: string;
  displayName: string;
  entitlementIds: string[];
  plans: CatalogPlan[];
}

export interface CatalogApp {
  id: string;
  displayName: string;
  products: CatalogProduct[];
}

export interface CatalogEntitlement {
  id: string;
  description: string;
}

export interface AdminCatalogDto {
  apps: CatalogApp[];
  entitlements: CatalogEntitlement[];
}

// ── Producto normalizado del adapter (precio localizado del store/emulador) ──

/**
 * Lo que el `PurchaseProvider` devuelve por `productId`, sin acoplar el paywall
 * a la forma del store ni del emulador. En prod sale del SDK; en dev, del catálogo.
 */
export interface StoreProduct {
  productId: string;
  /** Precio ya formateado para mostrar, ej. "$49.90". */
  localizedPrice: string;
  currency: string;
  /** Monto numérico crudo, por si se necesita ordenar/comparar. */
  amount: number;
}

/** Resultado de una compra emulada/real: lo que se manda a `POST /validate`. */
export interface PurchaseResult {
  platform: PurchasePlatform;
  productId: string;
  receiptOrToken: string;
}
