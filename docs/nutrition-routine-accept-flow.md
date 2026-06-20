# Flujo de confirmación de rutina alimenticia

## Contexto

Generar una rutina ya no la activa de inmediato. El backend la guarda como **Draft** y espera que el usuario la confirme. Hasta que no acepte, la rutina activa anterior sigue intacta.

```
generate → Draft (sin tocar la activa)
  ├── accept → Active  (la anterior pasa a Saved)
  └── reject → eliminada
```

---

## Cambio en el campo `status`

Todos los endpoints que devuelven `NutritionRoutineSummaryDto` ahora incluyen el campo `status` (string):

| Valor      | Significado |
|------------|-------------|
| `"Draft"`  | Recién generada, pendiente de confirmación |
| `"Active"` | La rutina que el usuario sigue actualmente |
| `"Saved"`  | Guardada en la biblioteca, no activa |

---

## Endpoints

### 1. Generar rutina

```
POST /api/nutrition-routine/generate
Authorization: Bearer <jwt>
```

**Sin body.**

**Respuesta `200`** — Draft de la rutina generada:

```jsonc
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Rutina saludable semanal",
  "status": "Draft",
  "createdAt": "2026-06-19T23:30:00Z",
  "days": [
    {
      "id": "guid",
      "day": "Monday",
      "meals": [
        {
          "id": "guid",
          "type": "Breakfast",
          "name": "Avena con frutas",
          "description": "Avena cocida con banana y arándanos"
        }
        // ...más comidas
      ]
    }
    // ...más días
  ]
}
```

> El `id` de la respuesta es el que se usa en accept y reject.

---

### 2. Aceptar rutina

```
POST /api/nutrition-routine/{routineId}/accept
Authorization: Bearer <jwt>
```

**Sin body.**

**Respuesta `200`** — La rutina ahora activa:

```jsonc
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Rutina saludable semanal",
  "status": "Active",
  "createdAt": "2026-06-19T23:30:00Z",
  "days": [ /* igual que en generate */ ]
}
```

**Respuestas de error:**

| Código | Cuándo |
|--------|--------|
| `404`  | `routineId` no existe o no pertenece al usuario |
| `400`  | La rutina no está en estado `Draft` (ej: ya es `Saved`) |

> Si la rutina ya era `Active`, devuelve `200` sin cambios (idempotente).

---

### 3. Rechazar rutina

```
DELETE /api/nutrition-routine/{routineId}
Authorization: Bearer <jwt>
```

**Sin body.**

**Respuesta `204`** — Sin contenido.

**Respuestas de error:**

| Código | Cuándo |
|--------|--------|
| `404`  | `routineId` no existe o no pertenece al usuario |
| `400`  | La rutina no está en estado `Draft` |

---

### 4. Obtener rutina activa (sin cambios de contrato, nuevo campo `status`)

```
GET /api/nutrition-routine/active
Authorization: Bearer <jwt>
```

**Respuesta `200`** — igual al shape de generate, con `"status": "Active"`.

**Respuesta `404`** — si el usuario no tiene rutina activa.

---

## Flujo recomendado en el front

```
1. Llamar a POST /generate
   → guardar el { id, days } del Draft en estado local

2. Mostrar pantalla de preview con los días y comidas

3a. Usuario acepta → POST /{id}/accept
    → navegar a la pantalla de rutina activa

3b. Usuario rechaza → DELETE /{id}
    → volver sin cambios (la rutina anterior sigue activa)
```

> No es necesario guardar el payload completo. El `id` del Draft alcanza para aceptar o rechazar. Los días y comidas solo se necesitan para el preview.

---

## Notas

- Un usuario solo puede tener **un Draft** a la vez. Si llama a `/generate` nuevamente antes de aceptar, el Draft anterior se elimina automáticamente.
- El endpoint `/active` sigue funcionando igual — solo devuelve rutinas con `status: "Active"`.
- Los endpoints de comidas (`/meals/{id}`, `/meals/{id}/log`) solo funcionan sobre rutinas activas.
