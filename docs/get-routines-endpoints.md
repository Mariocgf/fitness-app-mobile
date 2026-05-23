# Endpoints — Listado de Rutinas del Usuario

Base URL: `/api/Routine`  
Autenticación: Bearer token requerido en todos los endpoints.

---

## 1. GET `/api/Routine/my-routines`

Devuelve **todas las rutinas del usuario** con paginación de 10 items por request.

### Query params

| Param | Tipo | Default | Descripción |
|---|---|---|---|
| `page` | `number` | `1` | Número de página (base 1) |
| `pageSize` | `number` | `10` | Items por página (máx 50) |

### Ejemplo de request

```
GET /api/Routine/my-routines?page=1&pageSize=10
Authorization: Bearer <token>
```

### Respuesta `200 OK`

```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 24,
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Fuerza Upper/Lower",
      "source": "Manual",
      "isActive": true,
      "dayCount": 4,
      "createdAt": "2026-05-10T14:32:00Z",
      "updatedAt": "2026-05-18T09:10:00Z"
    },
    {
      "id": "7cb12a30-1234-4abc-9def-000000000001",
      "name": "Rutina AI — Hipertrofia",
      "source": "AI",
      "isActive": false,
      "dayCount": 3,
      "createdAt": "2026-04-20T08:00:00Z",
      "updatedAt": null
    }
  ]
}
```

### Campos de cada item

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string (UUID)` | Identificador único de la rutina |
| `name` | `string` | Nombre de la rutina |
| `source` | `"AI" \| "Manual"` | Origen de la rutina |
| `isActive` | `boolean` | Si es la rutina activa del usuario |
| `dayCount` | `number` | Cantidad de días que tiene la rutina |
| `createdAt` | `string (ISO 8601)` | Fecha de creación |
| `updatedAt` | `string (ISO 8601) \| null` | Fecha de última modificación, `null` si nunca fue editada |

### Orden

1. Rutina activa (`isActive: true`) siempre primero
2. Luego por `createdAt` descendente (más recientes primero)

### Paginación — cómo implementarla en el front

- Empezar con `page=1`.
- Hay más páginas si `page * pageSize < totalCount`.
- Para cargar más: incrementar `page` y concatenar los nuevos `items` al listado existente.

---

## 2. GET `/api/Routine/routine-preview`

Devuelve una **muestra mixta** de hasta **5 rutinas AI + 5 rutinas Manual** del usuario.  
Sin paginación. Útil para pantallas de resumen o dashboards.

### Ejemplo de request

```
GET /api/Routine/routine-preview
Authorization: Bearer <token>
```

### Respuesta `200 OK`

```json
{
  "ai": [
    {
      "id": "aabbccdd-0000-0000-0000-000000000001",
      "name": "Rutina AI — Fuerza",
      "source": "AI",
      "isActive": true,
      "dayCount": 5,
      "createdAt": "2026-05-01T10:00:00Z",
      "updatedAt": null
    }
  ],
  "manual": [
    {
      "id": "aabbccdd-0000-0000-0000-000000000002",
      "name": "Mi rutina personalizada",
      "source": "Manual",
      "isActive": false,
      "dayCount": 3,
      "createdAt": "2026-04-15T12:00:00Z",
      "updatedAt": "2026-04-20T08:30:00Z"
    }
  ]
}
```

### Campos

| Campo | Tipo | Descripción |
|---|---|---|
| `ai` | `RoutineSummary[]` | Hasta 5 rutinas de origen AI |
| `manual` | `RoutineSummary[]` | Hasta 5 rutinas de origen Manual |

> Cada `RoutineSummary` tiene los mismos campos que los items del endpoint anterior.

### Comportamiento cuando hay menos de 5 de una fuente

Si el usuario tiene, por ejemplo, 2 rutinas AI y 8 Manual, la respuesta devuelve:
- `ai`: 2 items
- `manual`: 5 items (sin relleno con la otra fuente)

---

## Tipo TypeScript sugerido

```typescript
interface RoutineSummary {
  id: string;
  name: string;
  source: 'AI' | 'Manual';
  isActive: boolean;
  dayCount: number;
  createdAt: string;
  updatedAt: string | null;
}

interface PagedRoutinesResponse {
  page: number;
  pageSize: number;
  totalCount: number;
  items: RoutineSummary[];
}

interface RoutinePreviewResponse {
  ai: RoutineSummary[];
  manual: RoutineSummary[];
}
```
