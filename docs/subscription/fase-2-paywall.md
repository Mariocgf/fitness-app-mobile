# Fase 2 — Paywall (comparación de planes)

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).
> Depende de: **Fase 1**.

**Estado: ✅ Hecha.**

## Objetivo
Mostrar el paywall combinando la estructura de planes del backend (`GET /plans`)
con el precio vivo del store/emulador (adapter), respetando la regla Apple/Google:
el precio del paywall es el del producto en la store, no el `price` de referencia del backend.

## Alcance

### Hook — `src/hooks/usePlans.ts`
- `getSubscriptionPlans(token)` → lista de `SubscriptionPlanDto` (incluye Free con `productId: null`).
- Juntar los `productId` no-null y pedir precios al adapter: `getPurchaseProvider().getProducts(productIds)`.
- Merge → view model por plan: features (`unlockedModules`, `monthlyCredits`) del backend + `localizedPrice` del adapter. Free no tiene precio de store (mostrar "Gratis").
- `isLoading`, `error`. Patrón `getTokenRef`/`AbortController`.

### UI — `PaywallView` (en `app/profile/subscription.tsx` o `src/components/features/subscription/`)
- Header premium (`GradientText` para "Premium").
- `BillingIntervalToggle` — reusa `SegmentedControl` (`Mensual` / `Anual`, `accent="mono"`). Filtra los planes por `billingInterval`.
- Lista de `PlanCard` — reusa `CheckableCard` (variant `radio`) o `SelectableCard` (variant `outline`): tier, `localizedPrice`, `monthlyCredits`, features de `unlockedModules`. Selección única.
- CTA "Elegir plan" (`zinc-50` pill blanco inline). Sin compra todavía: deshabilitado o abre el sheet de Fase 3.
- Skeleton de carga: copiar el patrón shimmer de `TrainingHistoryCardSkeleton` (opacidad pulsante con Reanimated, bloques `bg-zinc-800`).

### Componentes nuevos — `src/components/features/subscription/`
- `PaywallView.tsx`, `PlanCard.tsx`, `BillingIntervalToggle.tsx`.

## Detalles del contrato
- `GET /plans` viene ordenado por tier y modalidad (mensual antes que anual).
- Cada tier tiene variantes mensual/anual como items separados (distinguir por `billingInterval` + `productId`).
- Anual = 10× mensual (2 meses gratis). El precio real lo muestra el store.

## Verificación
- Precios vivos del emulador (`/admin/catalog`) por `productId`.
- Toggle mensual/anual funciona. Free sin precio de store.
- `tsc`/ESLint verdes; smoke en Expo Go y web (revisar que `SegmentedControl` no rompa en web).

## Reutilizar (no recrear)
`SegmentedControl`, `CheckableCard`, `SelectableCard`, `IconTile`, `FillBar`, `GradientText`, patrón shimmer de `TrainingHistoryCardSkeleton`.
