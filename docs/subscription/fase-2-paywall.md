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

### UI — `PaywallView` (`src/components/features/subscription/`)
Estructura en dos pasos: **primero el plan, después el ciclo de cobro**.

1. Header premium (`GradientText` para "Premium").
2. Selector de **tier** — `SegmentedControl` (`accent="mono"`) con los tiers pagos presentes en `GET /plans` (`Fitness` / `Nutrición` / `Full`). Free NO aparece: no se compra, y el plan vigente ya lo muestra `SubscriptionStatusCard`.
3. `PlanFeatureList` — "Qué incluye" del tier elegido. Los beneficios se **derivan de `unlockedModules`** (el entitlement lo manda el backend) más el cupo de `monthlyCredits`; el mapa `plan-features.ts` solo describe qué hace cada módulo.
4. `BillingOptionRow` ×2 — Anual (primero, con badge de ahorro) y Mensual, con el `localizedPrice` del store. El plan ya contratado no se vuelve a ofrecer (se oculta esa fila, no el tier).
5. CTA "Suscribirme" (`zinc-50`) → abre el sheet de compra de Fase 3 con el plan + ciclo elegidos.
6. `PaywallSkeleton` — shimmer con la MISMA estructura (selector → beneficios → ciclos → CTA) para que no salte el layout.

### Componentes — `src/components/features/subscription/`
- `PaywallView.tsx`, `PlanFeatureList.tsx`, `BillingOptionRow.tsx`, `PaywallSkeleton.tsx`, `plan-features.ts`.
- `src/utils/pricing.ts` → `computeAnnualSavingsPercent`.

## Detalles del contrato
- `GET /plans` viene ordenado por tier y modalidad (mensual antes que anual).
- Cada tier tiene variantes mensual/anual como items separados (distinguir por `billingInterval` + `productId`).
- Anual = 10× mensual (2 meses gratis). El precio real lo muestra el store.
- El **badge de ahorro NO está hardcodeado**: `computeAnnualSavingsPercent` lo calcula con los montos reales (`PlanViewModel.amount`, mismo origen que el precio visible). Con el 10× del contrato da 17%; si el backend cambia los precios, el badge se ajusta solo y desaparece si el anual deja de convenir.
- El texto del precio **nunca se re-formatea ni se deriva** (ej. "$X/mes equivalente"): sale tal cual del store. `amount` existe solo para comparar, no para mostrar.

## Verificación
- Precios vivos del emulador (`/admin/catalog`) por `productId`.
- Cambiar de tier actualiza beneficios y precios; el ciclo elegido se reevalúa contra la lista visible.
- Con suscripción activa, la fila del plan contratado no aparece (sí la otra, para el upgrade).
- `tsc`/ESLint verdes; smoke en Expo Go y web (revisar que `SegmentedControl` no rompa en web).

## Reutilizar (no recrear)
`SegmentedControl`, `IconTile`, `FillBar`, `GradientText`, patrón shimmer de `TrainingHistoryCardSkeleton`, patrón de selección `border-{acento} bg-{acento}/10` (`RegisterManualSessionView`).
