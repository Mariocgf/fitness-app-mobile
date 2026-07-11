# Fase 4 — Add-on de créditos

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones).
> Depende de: **Fase 3** (reusa el flujo de compra emulada).

**Estado: ⬜ Pendiente.**

## Objetivo
Permitir comprar el pack consumible de **+10 créditos** (`credits_addon`) sobre un
plan pago activo, con el mismo patrón de compra emulada que la suscripción.

## Alcance

### Hook — `src/hooks/useCreditsAddon.ts`
- `buyAddon()`: `getPurchaseProvider().purchase('credits_addon', getPurchasePlatform())` → `purchaseCreditsAddon(request, token)`.
- Leer `PurchaseAddonResultDto`: `granted`, `newBalance`, `creditsAdded`, `reason`.
- `granted: false` **NO es error** (200). Según `reason`:
  - "ya fue otorgado" → idempotencia (retry), el saldo ya lo incluye. Avisar suave.
  - "requiere suscripción de plan pago activa" → usuario Free → **upsell de plan**.
  - "compra inválida o no confirmada" → avisar que no validó.

### UI — `CreditsAddonCard` / sheet — `src/components/features/subscription/`
- Card en la pantalla de Suscripción (o sheet) para comprar el add-on: "+10 créditos", precio del emulador, CTA.
- El add-on es consumible: se puede comprar varias veces (cada una suma +10). No bloquear tras una compra.
- Mostrar `newBalance` tras un `granted: true`.

## Verificación
- Add-on sobre un plan pago → `granted: true`, `+10`, `newBalance` actualizado.
- Add-on siendo Free → `granted: false` con `reason` → aparece upsell de plan.
- Doble compra idéntica (retry) → `granted: false` "ya otorgado" sin duplicar.
- `tsc`/ESLint verdes; smoke en Expo Go y web.

## Reutilizar (no recrear)
`QuantityStepper` (si se muestra cantidad), `BottomSheetModal`/overlay, `IconTile`, `toast`, el `MockPurchaseSheet` de Fase 3 (mismo patrón de compra emulada).
