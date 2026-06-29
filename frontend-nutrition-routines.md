# Frontend — Rutinas Alimenticias

Este documento resume lo que necesita el frontend para listar y activar rutinas alimenticias del usuario autenticado.

## Quick path

1. Para mostrar el listado, llamar:

```http
GET /api/nutrition-routine/my-routines?page=1&pageSize=10
```

2. Para activar una rutina seleccionada:

```http
POST /api/nutrition-routine/{routineId}/activate
```

3. Después de activar, refrescar el listado y/o la rutina activa:

```http
GET /api/nutrition-routine/active
```

## Autenticación

Todos los endpoints requieren usuario autenticado.

```http
Authorization: Bearer <token>
```

Si falta token o el usuario no se puede resolver, el backend responde `401 Unauthorized`.

## Listar rutinas

### Request

```http
GET /api/nutrition-routine/my-routines?page=1&pageSize=10
```

| Query | Tipo | Default | Regla |
|-------|------|---------|-------|
| `page` | number | `1` | Si es menor que `1`, backend usa `1`. |
| `pageSize` | number | `10` | Si es menor que `1` o mayor que `50`, backend usa `10`. |

### Response `200`

```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 2,
  "items": [
    {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Rutina saludable",
      "status": "Active",
      "isActive": true,
      "dayCount": 7,
      "createdAt": "2026-06-29T12:00:00Z",
      "updatedAt": "2026-06-29T12:05:00Z"
    }
  ]
}
```

### Estados posibles

| Status | Significado para UI |
|--------|----------------------|
| `Active` | Rutina actualmente activa. Mostrar como seleccionada/activa. |
| `Draft` | Rutina generada pendiente. Puede activarse. |
| `Saved` | Rutina archivada/histórica. Puede reactivarse. |

El backend ordena la activa primero y luego las más recientes.

## Activar rutina

### Request

```http
POST /api/nutrition-routine/{routineId}/activate
```

No requiere body.

### Response

| Código | Significado |
|--------|-------------|
| `204 No Content` | Rutina activada correctamente, o ya estaba activa. |
| `401 Unauthorized` | Falta autenticación. |
| `404 Not Found` | Rutina inexistente, usuario inexistente o rutina de otro usuario. |

La activación es idempotente: si el usuario activa una rutina ya activa, no falla.

## Endpoint relacionado

Para obtener la rutina activa con días y comidas resumidas:

```http
GET /api/nutrition-routine/active
```

Response `200`:

```json
{
  "id": "11111111-1111-1111-1111-111111111111",
  "name": "Rutina saludable",
  "status": "Active",
  "createdAt": "2026-06-29T12:00:00Z",
  "days": [
    {
      "id": "22222222-2222-2222-2222-222222222222",
      "day": "Monday",
      "meals": [
        {
          "id": "33333333-3333-3333-3333-333333333333",
          "type": "Breakfast",
          "name": "Avena con fruta",
          "description": "Desayuno alto en fibra"
        }
      ]
    }
  ]
}
```

## Checklist para front

- [ ] Usar `GET /api/nutrition-routine/my-routines` para la pantalla de historial/listado.
- [ ] Usar `isActive` para marcar la rutina activa, no comparar strings manualmente si no hace falta.
- [ ] Deshabilitar o permitir como no-op el botón de activar cuando `isActive = true`.
- [ ] Después de `204`, invalidar/refrescar queries de listado y rutina activa.
- [ ] Manejar `404` como “no se pudo activar esta rutina” sin mostrar IDs internos.
