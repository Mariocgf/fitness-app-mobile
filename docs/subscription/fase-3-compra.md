# Fase 3 — Flujo de compra (emulado, realista)

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).
> Depende de: **Fase 2**.

**Estado: ✅ Hecha.**

> Implementación: `src/hooks/usePurchaseFlow.ts` (orquesta compra → `POST /validate` →
> `refresh`), `src/components/features/subscription/MockPurchaseSheet.tsx` (overlay
> emulado platform-aware), y el cableado en `PaywallView` (callback `onChoosePlan`) +
> `app/profile/subscription.tsx` (dueño del hook y del sheet).
>
> **Nota de arquitectura:** el sheet se renderiza a nivel de pantalla, **hermano del
> `ScrollView`**, NO dentro de `PaywallView`. Un overlay absoluto dentro del ScrollView
> queda atrapado en el contenido y scrollea con él (ver lección registrada).

## Objetivo
Cerrar el ciclo de compra emulado para las 3 plataformas (iOS / Android / PWA),
lo más realista posible, de modo que migrar al pago real sea cambiar el adapter.

## Flujo (del contrato §3)
1. El usuario elige un plan en el paywall y toca "Elegir plan".
2. Se abre la hoja de compra **emulada** (por plataforma) → confirma.
3. El adapter (`purchase`) devuelve `{ platform, productId, receiptOrToken }`.
4. `POST /api/subscription/validate` con ese payload.
5. El backend valida y devuelve `SubscriptionStatusDto` → refrescar el contexto.

## Alcance

### UI — `MockPurchaseSheet` — `src/components/features/subscription/`
- Card/sheet **platform-aware** que emula la hoja del store: producto, `localizedPrice`, plataforma detectada (`getPurchasePlatform`), botón "Confirmar compra" y "Cancelar".
- **Overlay absoluto** (`View`/`Animated.View`, no `Modal` — lección del modal de generación). Padear el CTA con `insets.bottom` (Perfil no tiene tab bar nativo).
- Que se vea "de sistema" para iOS / Android / PWA (título tipo App Store / Play Store según plataforma), pero SIN imitar marcas reales de forma engañosa: es una emulación de dev.

### Hook — `src/hooks/usePurchaseFlow.ts`
- `purchase(plan)`: `getPurchaseProvider().purchase(productId, getPurchasePlatform())` → `validatePurchase(request, token)` → `subscription.refresh()`.
- Estados: `isPurchasing`, `error`.
- Manejar `status` de la respuesta:
  - `active` → éxito, reflejar tier/período/créditos.
  - `pending` → compra reconocida no confirmada: no conceder acceso, avisar "en proceso".
  - `invalid` / `expired` → 200, NO es error: avisar sin conceder (tier puede volver a Free).
- Idempotencia: revalidar la misma compra no duplica (lo garantiza el backend).

## Verificación
- Comprar un plan en iOS/Android/PWA emulados → `GET /me` refleja el nuevo tier.
- Revalidar la misma compra → sin duplicar.
- Plan anual → el usuario recibe su primer pool mensual de créditos en la activación.
- `tsc`/ESLint verdes; smoke en Expo Go y web.

## Reutilizar (no recrear)
`BottomSheetModal` (o el patrón overlay absoluto de `RoutineDetailView`), `IconTile`, `GradientText`, `toast`, `TAB_BAR_HEIGHT` (si aplica).
