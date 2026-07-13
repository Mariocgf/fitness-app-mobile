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

/** Plataforma en el formato que espera el emulador IAP (`POST /store/purchases`, en minúscula). */
export type EmulatorPlatform = 'ios' | 'android';

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
  /**
   * Cupo mensual que otorga el PLAN (Free: 0, Fitness/Nutrition: 15, Full: 40).
   * OJO: no es el saldo disponible. El saldo del wallet vive en `CreditsBalanceDto`
   * (`GET /credits`) y se alimenta también de los créditos de bienvenida y los add-ons.
   */
  monthlyCredits: number;
  billingInterval: BillingInterval;
  productId: string | null;
}

/**
 * Saldo real del wallet de créditos (`GET /api/subscription/credits`).
 *
 * Es la ÚNICA fuente de verdad de "cuántos créditos me quedan". No confundir con
 * `SubscriptionStatusDto.monthlyCredits`, que es el cupo del plan: un usuario Free
 * tiene cupo 0 y aun así puede tener saldo (créditos de bienvenida, add-ons).
 */
export interface CreditsBalanceDto {
  balance: number;
  /** ISO date del último movimiento del wallet. */
  updatedAt: string;
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

/** ProductId del pack consumible de créditos (mismo id que espera el backend). */
export const CREDITS_ADDON_PRODUCT_ID = 'credits_addon';
/** Precio de referencia del add-on (fallback si el store no devuelve el producto). */
export const CREDITS_ADDON_REFERENCE_PRICE = '$2.99';

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

// ── Compra emulada (`POST /store/purchases`) — solo dev, detrás del adapter ──
// En prod el receipt lo genera el SDK del store tras la compra real; acá lo genera
// y PERSISTE el emulador, y el front solo lo reenvía a su backend para validarlo.

/** Escenario que simula el emulador. `success` es el happy path de dev. */
export type EmulatorPurchaseScenario = 'success';

/** Body de `POST /store/purchases`. `planId` es el `productId` del catálogo. */
export interface EmulatorPurchaseRequest {
  platform: EmulatorPlatform;
  planId: string;
  /** Identidad "de store" del comprador (en dev, el userId de Clerk). */
  externalUserId: string;
  appId: string;
  scenario: EmulatorPurchaseScenario;
}

/**
 * Respuesta 201 de `POST /store/purchases`. El front SOLO usa `receiptOrToken` y
 * `productId`; el resto (transaction ids, `validationPath`) lo maneja el backend
 * al validar contra el mock de Apple/Google.
 */
export interface EmulatorPurchaseResponse {
  status: string;
  platform: EmulatorPlatform;
  productId: string;
  receiptOrToken: string;
  purchaseId: string;
  transactionId: string;
  originalTransactionId: string;
  validationPath: string;
}

// ── View model del paywall (merge backend + store) ──

/**
 * Plan listo para pintar en el paywall: estructura del backend (`GET /plans`) +
 * precio localizado del store/emulador. `localizedPrice` ya viene resuelto
 * ("Gratis" para Free, precio del store para tiers pagos).
 */
export interface PlanViewModel {
  tier: SubscriptionTier;
  name: string;
  monthlyCredits: number;
  billingInterval: BillingInterval;
  productId: string | null;
  unlockedModules: string[];
  /** Precio ya resuelto para mostrar: "Gratis" | precio del store | referencia. */
  localizedPrice: string;
}
