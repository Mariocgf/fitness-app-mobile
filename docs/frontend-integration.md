# IAP / Suscripciones — Guía de integración para el Frontend

Todo lo que el front necesita para consumir el sistema de pagos/suscripciones del backend
(planes, créditos, add-ons, gating). Cubre el resultado de las Fases 0-6.

> **Regla de oro (arquitectura):** el frontend **NO decide entitlements** ni valida compras. El front
> compra contra el store (Apple/Google), obtiene el receipt/token y **se lo manda al backend**. El
> backend valida contra la store y recién ahí concede acceso/créditos. El front solo refleja el estado
> que le devuelve el backend.

---

## 1. De dónde salen los planes para el paywall

Dos fuentes, complementarias:

- **Estructura del catálogo** (qué planes hay, qué desbloquea cada uno, créditos, product IDs) →
  **backend**, endpoint `GET /api/subscription/plans` (abajo).
- **Precio real y localizado** → **el store** (StoreKit / Play Billing, o RevenueCat), por product ID.
  Apple/Google **exigen** que el precio del paywall sea el del producto en la store; el `price` que
  devuelve el backend es **solo de referencia**, no para mostrarlo tal cual.

Flujo del paywall: pedir la estructura al backend → pedirle al store el precio vivo de cada `productId`
→ renderizar la comparación de planes.

### ⚠️ El precio NO tiene endpoint de backend — lo trae el SDK del store

No existe (ni debe existir) un endpoint del backend para los precios. El precio real y localizado lo
pide el **front al SDK del store en el dispositivo**, pasándole los `productId` que sacó de `GET /plans`.
Razones: Apple/Google **exigen** que el precio del paywall sea el del producto en la store (localizado
por región/moneda); el backend nunca consulta precios, solo valida receipts. El `price` de `GET /plans`
es **solo de referencia**, no para mostrarlo.

La app es **React Native + Expo**. Según la lib de IAP que uses:

| Lib | Llamada para traer precios | Campo del precio localizado |
|---|---|---|
| `react-native-iap` | `getSubscriptions({ skus })` / `getProducts({ skus })` | `localizedPrice` |
| RevenueCat (`react-native-purchases`) | `Purchases.getOfferings()` | `product.priceString` |
| iOS nativo (StoreKit 2) | `Product.products(for: ids)` | `product.displayPrice` |
| Android nativo (Play Billing) | `queryProductDetailsAsync(...)` | `ProductDetails.oneTimePurchaseOfferDetails` / `subscriptionOfferDetails` |

Pasos: (1) `GET /plans` → obtenés los `productId`; (2) se los pasás al SDK del store; (3) el SDK devuelve
cada producto con su precio localizado; (4) mostrás el paywall combinando features (backend) + precio (store).

### En DEV (con el emulador): `GET /admin/catalog`

En producción el precio lo da el SDK del store. **En desarrollo, con el IAP Provider Emulator**, el mock
de "traer productos con precio" es el endpoint **`GET /admin/catalog`** (requiere header `X-Mock-Key`).
Es lo que el **adapter mock** del front consume para simular lo que StoreKit/Play devuelven en prod.

```http
GET http://localhost:5247/admin/catalog
X-Mock-Key: <EXPO_PUBLIC_IAP_EMULATOR_KEY>
```

**Response 200** (recortado) — apps → products → plans, cada plan con `prices` y `providerMappings`:
```json
{
  "apps": [
    {
      "id": "sample-app",
      "displayName": "Sample App",
      "products": [
        {
          "id": "fitness",
          "displayName": "Fitness",
          "entitlementIds": ["fitness_access"],
          "plans": [
            {
              "id": "fitness_annual_plan",
              "productType": "subscription",
              "billingPeriod": "P1Y",
              "prices": [ { "region": "US", "currency": "USD", "amount": "49.90" } ],
              "providerMappings": [
                { "provider": "apple",  "externalProductId": "fitness_annual" },
                { "provider": "google", "externalProductId": "fitness_annual", "externalBasePlanId": "annual" }
              ]
            }
          ]
        }
      ]
    }
  ],
  "entitlements": [ { "id": "fitness_access", "description": "Fitness access" } ]
}
```

Cómo lo usa el front en dev:
- El **precio** sale de `plans[].prices[0].{ amount, currency }`.
- El **product ID** que matchea con `GET /plans` del backend es `plans[].providerMappings[].externalProductId`
  (según plataforma). Ese es el `productId` que después mandás en `POST /validate`.

Reglas dev:
- Es un endpoint **`/admin/*`** → requiere `X-Mock-Key` (`EXPO_PUBLIC_IAP_EMULATOR_KEY`), **solo local/dev**
  (la key **no** va en un bundle de prod/staging público).
- Ponelo **detrás del adapter** (`PurchaseProvider`): en dev el adapter lee `/admin/catalog`; en prod lee
  del SDK del store. El paywall NO debe acoplarse a `/admin/*` directo.

| Ambiente | De dónde saca el precio el front |
|---|---|
| **Dev (emulador)** | `GET /admin/catalog` (`X-Mock-Key`), detrás del adapter mock |
| **Producción** | SDK del store (StoreKit / Play Billing / RevenueCat), detrás del adapter real |

### `GET /api/subscription/plans`

Sin body. Devuelve la lista de planes **activos** (incluye Free, con `productId: null`).

**Response 200** — `SubscriptionPlanDto[]`
```json
[
  {
    "tier": "Free",
    "name": "Free",
    "price": 0.0,
    "currency": "USD",
    "monthlyCredits": 0,
    "billingInterval": "Monthly",
    "productId": null,
    "unlockedModules": []
  },
  {
    "tier": "Fitness",
    "name": "Fitness Anual",
    "price": 49.90,
    "currency": "USD",
    "monthlyCredits": 15,
    "billingInterval": "Annual",
    "productId": "fitness_annual",
    "unlockedModules": ["Fitness"]
  }
]
```
- Ordenado por tier y luego modalidad (mensual antes que anual).
- Cada tier aparece con sus variantes (mensual y anual) como items separados, distinguidos por `billingInterval` + `productId`.
- Usar `unlockedModules` para armar la comparación de features.

### Product IDs (el contrato con el store)

| Plan | Product ID mensual | Product ID anual | Créditos/mes | Precio ref. mensual / anual |
|---|---|---|---|---|
| Free | — (sin compra) | — | 10 (bienvenida, única vez) | $0 |
| Fitness | `fitness_monthly` | `fitness_annual` | 15 | $4.99 / $49.90 |
| Nutrition | `nutrition_monthly` | `nutrition_annual` | 15 | $4.99 / $49.90 |
| Full | `full_monthly` | `full_annual` | 40 (pool compartido) | $8.99 / $89.90 |
| Add-on créditos | `credits_addon` (consumible) | — | +10 por compra | $2.99 |

- **Anual = 10× mensual** (2 meses gratis). Expira a los 12 meses.
- Los **precios de arriba son de referencia** (los reales los muestra el store).
- El **add-on** es un producto **consumible**: se puede comprar varias veces; cada compra suma +10.

---

## 2. Autenticación

Todos los endpoints (salvo los webhooks, que son store→backend) requieren **JWT de Clerk** en el header:

```http
Authorization: Bearer <clerk_jwt>
```

El backend identifica al usuario por el claim `sub` del token. No hay que mandar el userId en el body.

Base URL de los endpoints: **`/api/subscription`**.

---

## 3. Flujo de compra de suscripción

```
1. El front muestra el paywall con los productos del store (por product ID).
2. El usuario compra → el store SDK devuelve un receipt (iOS) o purchaseToken (Android).
3. El front POST /api/subscription/validate con { platform, productId, receiptOrToken }.
4. El backend valida contra la store, activa la suscripción y devuelve el estado.
5. El front refleja el estado (tier, período, créditos).
```

### `POST /api/subscription/validate`

**Request**
```json
{
  "platform": "Ios",            // "Ios" | "Android"
  "productId": "fitness_annual", // el product ID que compró en el store
  "receiptOrToken": "<receipt (iOS) o purchaseToken (Android)>"
}
```

**Response 200** — `SubscriptionStatusDto`
```json
{
  "tier": "Fitness",                    // "Free" | "Fitness" | "Nutrition" | "Full"
  "status": "active",                   // "active" | "pending" | "expired" | "invalid" | "none"
  "currentPeriodEnd": "2027-07-11T00:00:00Z", // null si no hay período activo
  "monthlyCredits": 15,
  "billingInterval": "Annual",          // "Monthly" | "Annual"
  "productId": "fitness_annual"          // null para Free
}
```

Notas de comportamiento:
- **Idempotente**: revalidar la misma compra (mismo `originalTransactionId`) no duplica ni recompensa;
  devuelve el estado actual.
- `status: "pending"` → la compra está reconocida pero no confirmada; no conceder acceso todavía.
- `status: "invalid"` o `"expired"` → no se concede acceso (el `tier` puede volver a `Free`).
- **Plan anual**: en la activación el usuario recibe su **primer pool mensual** de créditos.

---

## 4. Estado de suscripción

### `GET /api/subscription/me`

Sin body. Devuelve el `SubscriptionStatusDto` (mismo shape que arriba).

- **Sin suscripción activa → Free por defecto** (200 con `tier: "Free"`, `status: "none"`). Nunca 404.
- Úsalo al abrir la app / la pantalla de cuenta para saber qué mostrar (tier, período, `billingInterval`).

---

## 5. Créditos (eje consumo)

Cada acción de IA **cuesta créditos**. El backend los debita al ejecutar la acción; si la IA falla, los
reembolsa (no se cobran fallos). El front no maneja el saldo directamente, pero **debe manejar el 402**.

### Costos por acción

| Acción | Costo |
|---|---|
| Generar rutina (IA) | 3 |
| Regenerar rutina (IA) | 3 |
| Adaptar rutina manual con IA | 2 |
| Sugerencias de swap (IA) | 1 |
| Generar rutina nutricional (IA) | 3 |

### Fondeo del saldo

- **Usuario nuevo**: 10 créditos de bienvenida (una sola vez, al primer uso de IA).
- **Plan pago mensual**: el pool se resetea en cada renovación.
- **Plan pago anual**: el primer pool se otorga en la activación (el resto es follow-up del backend).
- **Add-on**: +10 por compra (ver abajo).

### Saldo insuficiente → **HTTP 402**

Cuando una acción de IA no tiene créditos, el endpoint correspondiente responde **402 Payment Required**.
El front debe atrapar el 402 y ofrecer comprar un **add-on** o subir de plan.

---

## 6. Add-on de créditos (pack consumible)

Compra de un pack de **+10 créditos** ($2.99) **sobre un plan pago activo**. Producto **consumible** en
el store (`credits_addon`). Mismo patrón que la validación de compra.

### `POST /api/subscription/credits/addon`

**Request**
```json
{
  "platform": "Android",
  "productId": "credits_addon",
  "receiptOrToken": "<receipt/purchaseToken del consumible>"
}
```

**Response 200** — `PurchaseAddonResultDto`
```json
{
  "granted": true,       // true si esta llamada acreditó el pack
  "newBalance": 25,      // saldo del wallet tras la operación
  "creditsAdded": 10,    // 0 si no se otorgó
  "reason": null         // motivo cuando granted=false
}
```

**Importante — `granted: false` NO es un error (es 200):**
- `"El add-on ya fue otorgado."` → idempotencia: la misma compra ya se acreditó (retry). El saldo ya lo incluye.
- `"El add-on requiere una suscripción de plan pago activa."` → el usuario es Free. Mostrar upsell de plan.
- `"Compra inválida o no confirmada por el proveedor."` → la compra no validó.

El front debe leer `granted` y, si es `false`, usar `reason` para decidir qué mostrar.

---

## 7. Gating de acceso por plan (eje acceso)

El plan desbloquea módulos y define límites del modo Free. **El backend aplica los límites al leer**
(recorta la respuesta); el front no bloquea, solo refleja lo que llega.

Límites del modo **Free** (usuarios sin plan que cubra el módulo):
- **Historial**: máximo **7 días** en Training, Sleep, Mood, Hydration, Meditation, Health, Clinical.
- **Tope**: máximo **1** rutina de ejercicio y **1** plan nutricional.

Un usuario con el plan correspondiente ve el historial completo y sin tope. El front puede usar el
`tier`/`billingInterval` de `GET /me` para mostrar CTAs de upgrade donde corresponda.

---

## 8. Manejo de errores

Todos los errores salen con este formato (middleware global):

```json
{ "statusCode": 402, "message": "Créditos insuficientes...", "timestamp": "2026-07-11T00:00:00Z" }
```

| Código | Cuándo | Qué hace el front |
|---|---|---|
| **400** | Body inválido (falta productId/receipt, plataforma inválida) | Corregir el request |
| **401** | Falta/expiró el JWT | Re-autenticar |
| **402** | Saldo de créditos insuficiente (acciones de IA) | Ofrecer add-on / upgrade |
| **404** | Usuario no encontrado | Estado inconsistente de sesión |
| **409** | Conflicto de suscripción | Reintentar / soporte |
| **503** | Proveedor (store) no disponible | Reintentar con backoff |
| **500** | Error inesperado | Reintentar / soporte |

> El caso "compra inválida" en `validate` **no** es un error HTTP: devuelve 200 con `status: "invalid"`.
> El caso "add-on no otorgado" tampoco: 200 con `granted: false`.

---

## 9. Checklist para el front

- [ ] Configurar los product IDs en App Store Connect / Play Console (tabla sección 1).
- [ ] Paywall: estructura desde `GET /api/subscription/plans` + precios desde el store.
- [ ] Tras comprar, `POST /api/subscription/validate` con `platform`/`productId`/`receiptOrToken`.
- [ ] Al abrir la app, `GET /api/subscription/me` para pintar tier/período/`billingInterval`.
- [ ] Add-on consumible: `POST /api/subscription/credits/addon`; leer `granted` y `reason`.
- [ ] Manejar **402** en las acciones de IA (ofrecer add-on/upgrade).
- [ ] Distinguir 200 con `status:"invalid"` / `granted:false` (no son errores).
- [ ] Nunca llamar `/admin/*` del emulador ni decidir entitlements en el cliente.

---

## 10. Pendiente del backend (que impacta al front)

- **Top-up mensual recurrente para suscriptores anuales**: hoy el anual recibe el primer pool en la
  activación; la recarga mensual automática es un follow-up del backend (requiere scheduler).
