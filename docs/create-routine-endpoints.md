# Endpoints requeridos: Creación manual de rutina

## Contexto

El frontend ya tiene implementado el flujo completo de creación manual de rutinas.
Al confirmar el guardado, el front envía el payload descrito abajo a uno de dos endpoints
según la elección del usuario ("Solo guardar" o "Guardar y activar").

La autenticación es mediante **Clerk Bearer token** en el header `Authorization`,
igual que todos los endpoints existentes (`/api/Routine/*`).

---

## Endpoint 1 — Guardar rutina (sin activar)

```
POST /api/Routine/create-routine
Authorization: Bearer <clerk_token>
Content-Type: application/json
```

### Request body

```json
{
  "name": "Mi rutina",
  "activate": false,
  "days": [
    {
      "dayOfWeek": "monday",
      "exercises": [
        {
          "exerciseId": "uuid-del-ejercicio",
          "order": 1,
          "sets": 3,
          "repMode": "reps",
          "reps": 12,
          "durationSeconds": null,
          "restSeconds": 60,
          "weightKg": 20.0
        },
        {
          "exerciseId": "uuid-del-ejercicio-2",
          "order": 2,
          "sets": 4,
          "repMode": "secs",
          "reps": null,
          "durationSeconds": 30,
          "restSeconds": 45,
          "weightKg": null
        }
      ]
    },
    {
      "dayOfWeek": "wednesday",
      "exercises": [
        {
          "exerciseId": "uuid-del-ejercicio-3",
          "order": 1,
          "sets": 3,
          "repMode": "reps",
          "reps": 10,
          "durationSeconds": null,
          "restSeconds": 90,
          "weightKg": 60.0
        }
      ]
    }
  ]
}
```

### Respuesta esperada — `200 OK`

Devolver la rutina creada en el mismo formato que usa `GET /api/Routine/active-routine`
(tipo `Routine` del front), para que pueda cachearse inmediatamente:

```json
{
  "id": "guid-rutina",
  "name": "Mi rutina",
  "createdAt": "2025-05-21T21:00:00Z",
  "days": [
    {
      "id": "guid-dia",
      "day": "Lunes",
      "approxTimeSession": "32 min aprox.",
      "exercises": [
        {
          "id": "guid-routine-exercise",
          "exerciseId": "uuid-del-ejercicio",
          "order": "1",
          "name": "Press de banca",
          "gifUrl": "https://...",
          "sets": "3",
          "repType": "Fixed",
          "minRep": null,
          "maxRep": null,
          "currentRep": "12",
          "durationSeconds": null,
          "rest": "60",
          "weight": "20"
        }
      ]
    }
  ]
}
```

---

## Endpoint 2 — Guardar y activar rutina

Idéntico al anterior pero con `"activate": true`.
El backend debe marcar esta rutina como la rutina activa del usuario
(reemplazando la anterior si existía).

```
POST /api/Routine/create-routine
Authorization: Bearer <clerk_token>
Content-Type: application/json

{ ...mismo body con "activate": true }
```

> Se usa el **mismo endpoint** — el campo `activate` controla el comportamiento.
> Alternativamente se puede separar en `/create-routine` y `/create-routine/activate`,
> pero un solo endpoint es más simple para el front.

---

## Notas importantes para el backend

### Campo `repMode`
- `"reps"` → el ejercicio se mide en repeticiones. Usar `reps` e ignorar `durationSeconds`.
- `"secs"` → el ejercicio se mide en segundos. Usar `durationSeconds` e ignorar `reps`.

Mapeo sugerido al modelo de BD (consistente con `RepType` ya existente):
| `repMode` | `RepType` en BD |
|-----------|-----------------|
| `"reps"`  | `"Fixed"`       |
| `"secs"`  | `"Timed"`       |

### Campo `order`
Entero que indica la posición del ejercicio dentro del día (1-indexed).
El front ya envía los ejercicios en el orden correcto (drag & drop), así que
el back puede confiar en el array y asignar `order` secuencialmente si prefiere.

### Campo `weightKg`
Puede ser `null` si el usuario no configuró peso (ejercicio con peso corporal o sin peso).

### Días vacíos
El front **ya filtra** los días sin ejercicios antes de enviar.
El payload solo contiene días con al menos un ejercicio.

### `dayOfWeek` — valores posibles
```
"monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
```

---

## Errores esperados

| Status | Situación |
|--------|-----------|
| `400`  | Payload inválido (nombre vacío, días sin ejercicios, etc.) |
| `401`  | Token inválido o expirado |
| `409`  | Conflicto (si se decide limitar a 1 rutina activa por usuario) |

---

## Dónde integrar en el front

**Archivo:** `src/components/features/routine/CreateRoutineView.tsx`

**Función a reemplazar:** `doSave` (línea con el `// TODO`)

```typescript
const doSave = (activate: boolean) => {
  onClearDraft?.();
  // TODO: llamar al endpoint con { name: name.trim(), days: daysToSave, activate }
};
```

**Servicio a crear:** `src/services/routine.service.ts` — agregar función `createRoutine`:

```typescript
export const createRoutine = async (
  payload: CreateRoutinePayload,
  token: string | null
): Promise<Routine> => {
  const { data } = await apiClient.post<Routine>(
    '/api/Routine/create-routine',
    payload,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return capitalizeRoutineNames(data);
};
```
