# Fase 1 — Estado de suscripción

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).
> Depende de: **Fase 0**.

**Estado: ⬜ Pendiente.**

## Objetivo
Que la app conozca el estado real de suscripción (`GET /me`) y lo refleje en el
Perfil, reemplazando el `plan="Premium"` **hardcodeado** (dato falso, lección "no inventar").

## Alcance

### Store global — `src/store/subscription-context.tsx`
- `SubscriptionProvider` + `useSubscription()`. Mantiene `SubscriptionStatusDto`, `isLoading`, `error`, `refresh()`.
- Patrón del repo: `getTokenRef = useRef(getToken)`, `mountedRef`, `AbortController` (ver `nutrition-routine-context.tsx`).
- Hidratación offline-first: cache en AsyncStorage (`@subscription_status`) al montar, luego `refresh()` contra backend.
- Helpers derivados: `tier`, `unlockedModules`, `hasModuleAccess(moduleName)`.
- Sin suscripción → Free por defecto (`status: "none"`), nunca error.
- Montar el provider en `app/_layout.tsx` junto a los demás.

### UI — Perfil
- `app/profile/index.tsx`:
  - Quitar `plan="Premium"` hardcodeado (`ProfileIdentityHeader plan=...`) → usar el tier real (ej. "Plan Fitness" / "Plan Free") desde `useSubscription`.
  - Card "Suscripción": subtitle dinámico (ej. "Plan Fitness activo" / "Sin plan activo") y `onPress` → `router.push('/profile/subscription')` (reemplaza el `toast.info('Próximamente.')`).
- `app/profile/_layout.tsx`: registrar `<Stack.Screen name="subscription" />`.
- `app/profile/subscription.tsx` (nuevo): scaffold `ProfileSectionScreen title="Suscripción"`. Muestra el estado actual con `SubscriptionStatusCard` (tier, período `currentPeriodEnd`, `monthlyCredits`, `billingInterval`). El paywall entra en Fase 2.

### Componente — `src/components/features/subscription/SubscriptionStatusCard.tsx`
- Card `zinc-900` con el estado. Acento premium puntual (`GradientText`) si el tier no es Free.
- No inventar campos: si `currentPeriodEnd` es null, no mostrar fecha.

## Verificación
- Abrir Perfil → ver el tier real (Free si no hay sub). Entrar a Suscripción → ver `GET /me`.
- `tsc`/ESLint verdes; smoke en Expo Go y web.

## Reutilizar (no recrear)
`ProfileSectionScreen`, `ProfileModuleCard`, `ProfileIdentityHeader`, `GradientText`, `IconTile`, `FullPageLoader`, `toast`.
