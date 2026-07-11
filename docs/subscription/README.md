# Suscripción / IAP — Índice de implementación

Índice base de la implementación del módulo de Suscripciones/IAP en el Frontend
(RN + Expo). El detalle de cada fase vive en su propio archivo para poder retomar
el trabajo en un chat nuevo sin cargar todo el contexto.

Contrato de backend: [`../frontend-integration.md`](../frontend-integration.md) (Fases 0-6 del backend).

---

## ⚠️ Reglas obligatorias (leer antes de tocar código)

Esta implementación se rige por dos documentos. **No se avanza sin respetarlos:**

1. **[`../../agent.md`](../../agent.md)** — reglas de arquitectura y estilo:
   - Código (variables, funciones, archivos) en **inglés**; comentarios y docs en **español**.
   - `app/` = rutas/pantallas (contenedores livianos); `src/` = dominio (api, services, hooks, types, store, components).
   - Estilos **solo NativeWind** (`className`), evitar `StyleSheet.create`.
   - Toda petición en `try/catch`, errores como mensajes ES amigables desde services/hooks.
   - Siempre loading states / skeletons mientras se espera al backend.
   - Pagos **solo IAP** (Apple/Google). **PROHIBIDO Stripe/PayPal**. El front obtiene el receipt y lo manda al backend a validar.

2. **[`../agent-implementation-lessons.md`](../agent-implementation-lessons.md)** — errores ya cometidos que NO se repiten. Los más relevantes para este módulo:
   - `docs/component-library.md` **no existe**: verificar átomos directo en `src/components/common`. Reutilizar antes de crear; atomizar lo repetido; `grep` antes de borrar huérfanos.
   - Overlays grandes = `View`/`Animated.View` absoluto, **nunca `Modal`** de RN (flota sobre navegación y tab bar).
   - No inventar campos que el DTO no trae; degradar con criterio.
   - CTA sobre tab bar nativo = `insets.bottom + TAB_BAR_HEIGHT`. (Perfil es ruta pusheada fuera de `(tabs)` → sin tab bar → solo `insets.bottom`.)
   - App **dark-only** `zinc`; status bar `style="light"`.
   - Verificar con `tsc --noEmit` + ESLint directo (`node .\node_modules\eslint\bin\eslint.js`), no solo `expo lint`. Smoke test en Expo Go **y** web/PWA.

> **Si aparece un error nuevo durante la implementación, registrarlo en
> [`../agent-implementation-lessons.md`](../agent-implementation-lessons.md)** (tabla `| Error | Qué pasó | Corrección aplicada |`).

---

## Regla de oro del contrato

El frontend **NO decide entitlements ni valida compras**. Compra contra el store
(o el emulador en dev), obtiene el receipt/token y lo manda al backend; el backend
valida y concede acceso/créditos. El front **solo refleja** el estado que devuelve `GET /me`.

---

## Arquitectura transversal

**Variables de entorno** (`EXPO_PUBLIC_*`, leídas inline como el resto del repo):

| Variable | Uso | Ejemplo dev |
|---|---|---|
| `EXPO_PUBLIC_IAP_EMULATOR_URL` | Base del emulador IAP (mock del store) | `http://localhost:5247` |
| `EXPO_PUBLIC_IAP_EMULATOR_KEY` | Header `X-Mock-Key` para `GET /admin/catalog` | `<tu-key-local>` |

> Distintas de `EXPO_PUBLIC_API_URL` (backend, ej. `:5233`). La `X-Mock-Key` es
> **solo dev**: no va en un bundle público de prod/staging.

**Capas** (siguen los patrones existentes del repo):

- `src/types/subscription.ts` — DTOs del contrato + catálogo del emulador + `StoreProduct`.
- `src/services/subscription.service.ts` — endpoints `/api/subscription/*` + `InsufficientCreditsError` (402).
- `src/services/purchase/` — adapter `PurchaseProvider` (mock dev / store prod), cliente del emulador, helper de plataforma.
- `src/store/subscription-context.tsx` — estado global de `GET /me`.
- `src/hooks/` — `usePlans`, `usePurchaseFlow`, `useCreditsAddon`.
- `src/components/features/subscription/` — UI (paywall, cards, sheets).

**Estrategia de compra**: el paso de compra se **emula** contra el emulador IAP,
detrás del adapter, con un flujo lo más realista posible (plataforma real, productId,
receipt/token) para que migrar al pago real (`store-purchase-provider`) sea mínimo.

**Acento visual**: neutro `zinc` con un acento **premium puntual** (`GradientText`
violeta/índigo) en el clímax "Premium". CTA principal `zinc-50`.

---

## Fases

| Fase | Estado | Documento | Resumen |
|---|---|---|---|
| 0 | ✅ Hecha | [`fase-0-fundamentos.md`](./fase-0-fundamentos.md) | Env vars, tipos, service, adapter. Sin UI. |
| 1 | ⬜ Pendiente | [`fase-1-estado.md`](./fase-1-estado.md) | `SubscriptionProvider` + `GET /me`. Perfil con tier real. |
| 2 | ⬜ Pendiente | [`fase-2-paywall.md`](./fase-2-paywall.md) | Paywall: `GET /plans` + precios del emulador. |
| 3 | ⬜ Pendiente | [`fase-3-compra.md`](./fase-3-compra.md) | Compra emulada (iOS/Android/PWA) + `POST /validate`. |
| 4 | ⬜ Pendiente | [`fase-4-addon.md`](./fase-4-addon.md) | Add-on de créditos + `POST /credits/addon`. |
| 5 | ⬜ Pendiente | [`fase-5-402-gating.md`](./fase-5-402-gating.md) | Manejo del 402 en acciones de IA + CTAs de upgrade. |

> Cadena de dependencias: **0 → 1 → 2 → 3 → 4 → 5**. Cada fase deja `tsc`/ESLint
> verdes y un smoke test antes de pasar a la siguiente.
