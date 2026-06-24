# Versionado de rutinas — Guía para el Frontend

Esta guía explica cómo el front (React Native + Expo) debe consumir el versionado de rutinas: el modelo mental, los endpoints nuevos, cuándo se crea una versión y cuándo no, y los flujos de UI recomendados. **Si entendés una sola cosa, que sea esta:**

> **Cambiar *qué versión uso* NO crea historial. Cambiar el *contenido* SÍ crea una versión nueva.**

---

## Modelo mental (leer primero)

Una **rutina** (`Routine`) es una identidad estable. Su **contenido** (días + ejercicios) vive en **versiones** (`RoutineVersion`) inmutables. La rutina apunta a dos versiones:

| Concepto | Qué es | Campo |
|---|---|---|
| **Versión activa** | La que el usuario está usando ahora | `activeVersionId` |
| **Última versión** | La más reciente creada | `latestVersionId` |

```txt
Rutina "Pierna"
  versiones: v1, v2, v3, v4, v5
  usando ahora (activeVersionId): v3
  última creada (latestVersionId): v5
```

- Las versiones **no se editan nunca**. Cualquier cambio de contenido crea una versión nueva.
- `activeVersionId` y `latestVersionId` **pueden ser distintos** (el usuario puede estar usando una versión vieja).
- ⚠️ **No confundir** el `isActive` de la **rutina** (es la rutina activa del usuario entre varias) con el `isActive` de una **versión** (es la versión en uso de esa rutina). Son cosas distintas.

---

## ¿Cuándo se crea una versión nueva?

Esta tabla es la regla de oro. Tenela presente al diseñar cada pantalla.

| Acción del usuario | Endpoint | ¿Crea versión? |
|---|---|---|
| Editar contenido de la rutina | `PUT /api/routine/{id}` | **Sí** (salvo no-op, ver abajo) |
| Cambiar ejercicios (swap) | `POST /api/routine/swap-exercises` | **Sí** |
| Regenerar con IA | `POST /api/routine/regenerate-routine` | **Sí** (nueva versión de la misma rutina) |
| Confirmar adaptación IA | `POST /api/routine/adaptation/{id}/confirm` | **Sí** |
| **Restaurar** una versión | `POST /api/routine/{id}/versions/{versionId}/restore` | **Sí, siempre** (deja trazabilidad) |
| **Usar** una versión | `PATCH /api/routine/{id}/active-version` | **No** (solo cambia la activa) |
| Renombrar / activar la rutina | `PUT` (solo nombre) / `POST .../activate` | **No** |
| Editar sin cambiar nada (no-op) | `PUT /api/routine/{id}` | **No** (el backend lo detecta) |

**No-op:** si el usuario "guarda" una edición pero el contenido es idéntico a la versión activa, el backend devuelve `200` pero **no crea versión**. No asumas que todo `PUT` incrementa la versión: si necesitás el número, consultá `GET .../versions`.

---

## Endpoints nuevos de versionado

Todos requieren `Authorization: Bearer <clerk-jwt>`. Base: `/api/routine`.

| Método | Ruta | Para qué | Devuelve |
|---|---|---|---|
| `GET` | `/{routineId}/versions` | Historial de versiones (metadata) | `RoutineVersionsResponse` |
| `GET` | `/{routineId}/versions/{versionId}` | Contenido completo de una versión | `RoutineVersionDetail` |
| `PATCH` | `/{routineId}/active-version` | **Usar esta versión** (no crea historial) | `RoutineVersionDetail` |
| `POST` | `/{routineId}/versions/{versionId}/restore` | **Restaurar como nueva versión** | `RoutineVersionDetail` |

### Historial — `GET /{routineId}/versions`

```jsonc
{
  "routineId": "11111111-...",
  "name": "Pierna",
  "activeVersionId": "33333333-...",   // la que se usa ahora
  "latestVersionId": "55555555-...",   // la última creada
  "versions": [                         // ordenadas de la más nueva a la más vieja
    { "id": "55555555-...", "versionNumber": 5, "isActive": false, "isLatest": true,
      "basedOnVersionId": "44444444-...", "changeReason": null, "createdAt": "2026-06-20T..." },
    { "id": "33333333-...", "versionNumber": 3, "isActive": true,  "isLatest": false,
      "basedOnVersionId": "22222222-...", "changeReason": "Ajuste fuerza", "createdAt": "2026-05-28T..." }
    // ...
  ]
}
```

### Detalle de versión — `GET /{routineId}/versions/{versionId}`

```jsonc
{
  "id": "33333333-...",
  "routineId": "11111111-...",
  "versionNumber": 3,
  "isActive": true,
  "basedOnVersionId": "22222222-...",
  "changeReason": "Ajuste fuerza",
  "createdAt": "2026-05-28T...",
  "days": [
    {
      "id": "...", "day": "Monday", "approxTimeSession": 60,
      "exercises": [
        {
          "id": "...", "exerciseId": "0V2YQjW", "order": 0, "name": "Sentadilla",
          "gifUrl": "https://...", "sets": 4, "repType": "Range",
          "minRep": 8, "maxRep": 12, "currentRep": 8, "durationSeconds": null,
          "rest": 90, "loadType": "ExternalWeight", "plannedWeightKg": 80.0,
          "primaryMuscleGroup": "legs"
        }
      ]
    }
  ]
}
```

> El mismo shape de `days[]`/`exercises[]` que ya devuelve `GET /api/routine/{id}`. Los enums llegan como string: `repType` = `Fixed|Range|Timed`, `loadType` = `BodyWeight|ExternalWeight`, `day` = `Monday..Sunday`.

### Usar versión — `PATCH /{routineId}/active-version`

```jsonc
// body
{ "versionId": "33333333-..." }
```
Cambia la versión activa. **No** crea historial. Refresca los targets de nutrición. Devuelve el `RoutineVersionDetail` que quedó activo.

### Restaurar — `POST /{routineId}/versions/{versionId}/restore`

Sin body. Crea una versión nueva clonando el contenido de `versionId`, basada en ella, y la deja activa + última. Devuelve el `RoutineVersionDetail` nuevo.

---

## Endpoints existentes que ahora versionan (no cambia tu request)

Estos ya los usás; lo único nuevo es que **internamente crean una versión** y la respuesta refleja el contenido nuevo (activo). No cambia el payload que mandás.

| Endpoint | Antes | Ahora |
|---|---|---|
| `PUT /api/routine/{id}` | Pisaba el contenido | Crea versión nueva (o no-op) |
| `POST /api/routine/swap-exercises` | Pisaba ejercicios | Crea versión nueva |
| `POST /api/routine/regenerate-routine` | Creaba **otra** rutina | Crea versión nueva de **la misma** rutina |
| `POST /api/routine/adaptation/{id}/confirm` | Pisaba el contenido | Crea versión nueva |
| `POST /api/routine/sessions` | — | Registra solita la **versión activa** del entreno (no mandás nada nuevo) |

> ⚠️ **Regenerar cambió de comportamiento:** antes generaba una rutina nueva y desactivaba la anterior. Ahora versiona la misma rutina (mantiene su `id` e historial). Si tu UI asumía "regenerar = rutina nueva", ajustala: el `routineId` no cambia.

---

## Flujos de UI recomendados

### 1. Pantalla de detalle de rutina
- `GET /api/routine/{id}` → muestra el contenido de la versión activa. El objeto ya trae `versionNumber`, `activeVersionId` y `latestVersionId`, así que podés mostrar "usando v3" (y detectar si hay una más nueva con `activeVersionId !== latestVersionId`) **sin una llamada extra**.
- Llamá `GET /{id}/versions` solo cuando necesites la **lista completa** (historial / selector).

### 2. Pantalla de historial
- `GET /{id}/versions`.
- Por cada versión, badges: **En uso** (`isActive`), **Última** (`isLatest`), fecha (`createdAt`) y motivo (`changeReason`).
- Acciones por versión:
  - **Ver** → `GET /{id}/versions/{versionId}`.
  - **Usar esta versión** → `PATCH /{id}/active-version`.
  - **Restaurar como nueva versión** → `POST /{id}/versions/{versionId}/restore`.
  - **Comparar** (opcional) → traés dos `versions/{id}` y hacés el diff en el cliente.

### 3. Aviso al editar una versión que no es la última
Si `activeVersionId !== latestVersionId`, el usuario está editando una versión vieja. Mostrá antes de guardar:
> "Estás usando v3, pero existe una versión más nueva (v5). Al guardar se creará una versión nueva basada en v3."

### 4. Después de cambiar versión o contenido
- Refrescá el detalle de la rutina.
- **Refrescá nutrición**: cambiar versión/contenido recalcula los targets diarios (próximos ~28 días). Volvé a pedir los targets de nutrición.

---

## Manejo de errores

| Código | Cuándo | Qué hacer en el front |
|---|---|---|
| `401` | Sin token / token inválido | Forzar re-login. |
| `404` | Rutina/versión no existe **o no pertenece al usuario** | Mensaje genérico "no encontrada". El backend no distingue a propósito (no filtra acceso). |
| `400` | Payload inválido (validación) | Mostrar el error de validación; no reintentar igual. |

> Una rutina **borrada** (soft delete) desaparece de los listados y de sus versiones (devuelve `404`). No hay endpoint de "deshacer borrado".

---

## Gotchas (leé esto antes de codear)

- **El detalle de la rutina ya incluye `versionNumber`, `activeVersionId` y `latestVersionId`.** Para "usando vN" no hace falta una segunda llamada; usá `GET /{id}/versions` solo para la lista completa.
- **No asumas que cada `PUT`/edición sube el número de versión** (puede ser no-op). Si mostrás "v6", confirmalo con `/versions`.
- **`isActive` de la rutina ≠ versión activa.** El primero es "rutina activa del usuario entre varias"; el segundo, "versión en uso de esa rutina".
- **Los entrenamientos quedan clavados a la versión** con la que se hicieron. Si la rutina cambia después, el historial de entrenos NO cambia. El backend lo registra solo (no mandás `versionId`), y el historial (`GET /api/routine/training-history`) ahora devuelve `routineVersionId` + `routineVersionNumber` por sesión para que lo muestres.
- **Cambiar versión/contenido toca nutrición.** Re-fetcheá targets después de editar, usar versión, restaurar, swap, regenerar o confirmar adaptación.

---

## Checklist de integración

- [ ] Pantalla de historial consumiendo `GET /{id}/versions` con badges En uso / Última.
- [ ] Acción "Usar esta versión" (`PATCH active-version`) → refresca detalle + nutrición.
- [ ] Acción "Restaurar como nueva versión" (`POST .../restore`) → refresca detalle + nutrición.
- [ ] Ver versión concreta (`GET /{id}/versions/{versionId}`).
- [ ] Aviso al editar cuando `activeVersionId !== latestVersionId`.
- [ ] `PUT`/swap/regenerar/confirmar: tratar la respuesta como el contenido activo nuevo; re-fetch de nutrición.
- [ ] Regenerar: NO asumir rutina nueva (mismo `routineId`).
- [ ] Manejo de `404` como "no encontrada/sin acceso" sin filtrar existencia.

---

## Referencia rápida de tipos (TypeScript sugerido)

```ts
type RoutineVersionSummary = {
  id: string;
  versionNumber: number;
  isActive: boolean;
  isLatest: boolean;
  basedOnVersionId: string | null;
  changeReason: string | null;
  createdAt: string; // ISO
};

type RoutineVersionsResponse = {
  routineId: string;
  name: string;
  activeVersionId: string | null;
  latestVersionId: string | null;
  versions: RoutineVersionSummary[];
};

type RoutineExercise = {
  id: string;
  exerciseId: string;
  order: number;
  name: string;
  gifUrl: string | null;
  sets: number;
  repType: "Fixed" | "Range" | "Timed";
  minRep: number | null;
  maxRep: number | null;
  currentRep: number | null;
  durationSeconds: number | null;
  rest: number;
  loadType: "BodyWeight" | "ExternalWeight";
  plannedWeightKg: number | null;
  primaryMuscleGroup: string;
};

type RoutineDay = {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  approxTimeSession: number;
  exercises: RoutineExercise[];
};

type RoutineVersionDetail = {
  id: string;
  routineId: string;
  versionNumber: number;
  isActive: boolean;
  basedOnVersionId: string | null;
  changeReason: string | null;
  createdAt: string;
  days: RoutineDay[];
};

// GET /api/routine/{id}, /active-routine, y respuestas de crear/editar/swap/regenerar/confirmar
type RoutineResponse = {
  id: string;
  name: string;
  source: "AI" | "Manual";
  isActive: boolean;             // rutina activa del usuario (NO la versión)
  createdAt: string;
  activeVersionId: string | null; // versión cuyo contenido está en days[]
  latestVersionId: string | null; // última versión creada
  versionNumber: number | null;   // número de la versión activa mostrada
  days: RoutineDay[];
};

// Item de GET /api/routine/training-history → items[]
type TrainingSessionHistoryItem = {
  id: string;
  trainedAt: string;
  totalTime: string;                   // TimeSpan: "00:45:00"
  routineId: string;
  routineName: string;
  routineVersionId: string | null;     // versión entrenada
  routineVersionNumber: number | null; // su número (v1, v2, ...)
  exercises: unknown[];                // detalle por ejercicio/set (sin cambios)
};
```

---

## Para profundizar

- Modelo conceptual y reglas de negocio: [`routine-versioning.md`](./routine-versioning.md).
- Detalle de implementación backend: [`routine-versioning-implementation-plan.md`](./routine-versioning-implementation-plan.md).
