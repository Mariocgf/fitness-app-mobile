# Fase 0 — Fundamentos + documentación (sin UI)

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).

**Estado: ✅ Hecha.**

## Objetivo
Dejar armada la base de datos-y-servicios del módulo, sin UI: env vars, tipos,
service de suscripción y el adapter de compras (mock + stub real). Así las fases
siguientes solo consumen estas capas.

## Qué se hizo

### Variables de entorno
Dos `EXPO_PUBLIC_*` nuevas (ver tabla del README). **Pendiente manual del usuario**:
agregarlas al `.env` (el archivo está fuera del alcance de escritura del agente):

```dotenv
EXPO_PUBLIC_IAP_EMULATOR_URL=http://localhost:5247
EXPO_PUBLIC_IAP_EMULATOR_KEY=<tu-mock-key-local>
```

El código lee `process.env` con fallback (`http://localhost:5247` y `''`), así que
no rompe si faltan; pero sin la key el emulador responderá 401 en `/admin/catalog`.

### Tipos — `src/types/subscription.ts`
- Uniones: `SubscriptionTier`, `SubscriptionStatusValue`, `BillingInterval`, `PurchasePlatform`.
- DTOs del backend: `SubscriptionPlanDto`, `SubscriptionStatusDto`, `PurchaseAddonResultDto`.
- Payloads: `ValidatePurchaseRequest`, `PurchaseAddonRequest`.
- Catálogo del emulador: `AdminCatalogDto` y sus hijos (`CatalogApp/Product/Plan/Price/...`).
- Normalizados del adapter: `StoreProduct`, `PurchaseResult`.

### Service — `src/services/subscription.service.ts`
- `getSubscriptionPlans`, `getMySubscription`, `validatePurchase`, `purchaseCreditsAddon`.
- `unwrapApiData` local (patrón del repo para respuestas `{ data }`).
- `mapSubscriptionError` mapea 400/401/402/404/409/503/500 a mensajes ES.
- `InsufficientCreditsError` (402) + `isInsufficientCreditsError(error)` — se usan en Fase 5.

### Adapter — `src/services/purchase/`
- `purchase-provider.ts` — interfaz `PurchaseProvider { getProducts, purchase }`.
- `emulator-client.ts` — axios al emulador con `X-Mock-Key`; `getAdminCatalog()`.
- `mock-purchase-provider.ts` — DEV: indexa el catálogo por `externalProductId`,
  arma `StoreProduct` con `prices[0]`; `purchase` devuelve un receipt simulado.
- `store-purchase-provider.ts` — PROD stub (lanza "requiere dev build"). Fase futura.
- `platform.ts` — `getPurchasePlatform(): 'Ios'|'Android'` (web infiere por user agent).
- `index.ts` — `getPurchaseProvider()` (hoy siempre mock; swap trivial a futuro).

## Verificación
- `node .\node_modules\typescript\bin\tsc --noEmit` (o el script del repo) → 0 errores en los archivos nuevos.
- ESLint directo sobre los archivos nuevos.
- Smoke opcional: llamar `getAdminCatalog()` + `getSubscriptionPlans(token)` y loguear el merge (sin UI).

## Notas para la próxima fase
- El `productId` que matchea `GET /plans` es el `externalProductId` del catálogo — ya se indexa por ahí.
- El precio de `GET /plans` es de referencia; el real sale del adapter (`getProducts`).
