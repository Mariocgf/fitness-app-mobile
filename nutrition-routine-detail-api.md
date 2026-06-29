# API — Detalle de Rutina Alimenticia

Endpoint para obtener una rutina alimenticia específica del usuario por su `id`, con sus días y comidas.

> Devuelve la misma forma que `GET /api/nutrition-routine/active`, pero para **cualquier** rutina del usuario (Draft, Active o Saved), no solo la activa.

---

## Obtener detalle de una rutina

```
GET /api/nutrition-routine/{routineId}
Authorization: Bearer <jwt>
```

| Parámetro | Tipo | Ubicación | Descripción |
|-----------|------|-----------|-------------|
| `routineId` | `guid` | path | Id de la rutina a consultar. |

No requiere query params ni body.

### Respuesta `200 OK`

```jsonc
{
  "id": "8f1c...",                       // guid de la rutina
  "name": "Plan alta proteína",
  "status": "Active",                    // "Draft" | "Active" | "Saved"
  "createdAt": "2026-06-29T14:10:00Z",   // ISO 8601, UTC
  "days": [
    {
      "id": "a1b2...",                   // guid del día
      "day": "Monday",                   // DayOfWeek en inglés: Monday..Sunday
      "meals": [
        {
          "id": "c3d4...",               // guid de la comida (usar para el detalle)
          "type": "Breakfast",           // "Breakfast" | "Lunch" | "AfternoonSnack" | "Dinner"
          "name": "Avena con frutas",
          "description": "Porción individual"
        }
        // ...resto de comidas del día
      ]
    }
    // ...resto de días
  ]
}
```

### Notas para el front

- **Payload liviano a propósito.** Cada comida trae solo `id`, `type`, `name`, `description`. Para macros (calorías, proteínas, carbs, grasas) y la receta (instrucciones + ingredientes) se pide el detalle de la comida bajo demanda:

  ```
  GET /api/nutrition-routine/meals/{mealId}
  ```

- `status` y `day` llegan como **string** (no enum numérico).
- `days` puede venir en cualquier orden; si el render necesita orden de semana, ordenar en el front por `day`.

### Errores

| Código | Cuándo |
|--------|--------|
| `401 Unauthorized` | Falta o es inválido el JWT. |
| `404 Not Found` | La rutina no existe **o** pertenece a otro usuario (no se distingue, por seguridad). |

---

## Endpoints relacionados

| Método | Ruta | Devuelve |
|--------|------|----------|
| `GET` | `/api/nutrition-routine/active` | Misma forma, solo la rutina activa. |
| `GET` | `/api/nutrition-routine/my-routines?page=&pageSize=` | Listado paginado (sin comidas). |
| `GET` | `/api/nutrition-routine/meals/{mealId}` | Detalle de una comida (macros + receta). |
