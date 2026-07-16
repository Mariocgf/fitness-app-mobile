# Fase 5 — Manejo del 402 + gating

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).
> Depende de: **Fase 4** (usa el add-on como salida del upsell).

**Estado: ⬜ Pendiente.**

## Objetivo
Que cuando una acción de IA se quede sin créditos (**HTTP 402**), el usuario vea un
upsell (comprar add-on / subir de plan) en vez del error genérico. Y mostrar CTAs
de upgrade en los puntos de gating del modo Free.

## Alcance

### Enganchar el 402 en las acciones de IA
En los `catch` de los services de IA, detectar `status === 402` y lanzar
`InsufficientCreditsError` (ya definido en `subscription.service.ts`):
- `src/services/routine.service.ts`: `generateRoutine`, `regenerateRoutine`, `adaptRoutineWithAi`, `getSwapSuggestions` (modo IA).
- `src/services/nutritionRoutine.service.ts`: `generateNutritionRoutine`.

> Costos (del contrato §5): generar/regenerar rutina 3, adaptar manual 2, swap 1, generar nutrición 3.

### UI — `UpsellSheet` — `src/components/features/subscription/`
- Sheet/overlay que ofrece: comprar add-on (+10, reusa Fase 4) o ir al paywall (`/profile/subscription`).
- Se abre desde los handlers al atrapar `InsufficientCreditsError` (usar `isInsufficientCreditsError`):
  - `app/(tabs)/fitness/index.tsx`: `handleGenerateSubmit`, `handleRegenerate`.
  - `src/components/features/routine/AdaptRoutineModal.tsx`.
  - `src/store/nutrition-routine-context.tsx`: `generate`.
- Reemplaza el `toast.error` genérico SOLO para el 402; los demás errores siguen igual.

### Gating (modo Free)
- Con `tier`/`unlockedModules` de `useSubscription`, mostrar CTAs de upgrade donde el backend recorta:
  - Historial: máx 7 días (Training/Sleep/Mood/Hydration/Meditation/Health/Clinical).
  - Tope: máx 1 rutina de ejercicio y 1 plan nutricional en Free.
- El front **no bloquea** (el backend ya recorta al leer): solo un CTA "Actualizar plan" donde tenga sentido. Mantener liviano.

## Verificación
- Forzar 402 (créditos agotados en el emulador) al generar rutina → aparece el `UpsellSheet`, no el error genérico.
- Comprar add-on desde el upsell → reintentar la acción funciona.
- CTA de upgrade visible en un punto de gating siendo Free; ausente con plan.
- `tsc`/ESLint verdes; smoke en Expo Go y web.

## Reutilizar (no recrear)
`InsufficientCreditsError`/`isInsufficientCreditsError` (Fase 0), el flujo de add-on (Fase 4), `BottomSheetModal`/overlay, `toast`.
