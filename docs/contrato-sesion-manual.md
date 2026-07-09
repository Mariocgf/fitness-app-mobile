# Contrato Frontend — Sesión de Entrenamiento Manual

Guía para el equipo de front: **cómo enviar** una sesión histórica manual (sin rutina) y **cómo se
recibe** después en el historial. Incluye el detalle de **qué cambió** respecto a lo que ya existía.

> Autenticación: todos los endpoints son `[Authorize]` (Bearer JWT de Clerk). El backend resuelve al
> usuario desde el token; **no** se envía userId en el body.

---

## 1. Registrar una sesión manual

### `POST /api/routine/sessions/manual`

Registra una sesión histórica **sin rutina asociada**. La filosofía es **sin campos obligatorios**
salvo el ejercicio: todo lo que el usuario no cargó se puede omitir.

#### Body (`CreateManualTrainingSessionDto`)

| Campo | Tipo | Obligatorio | Default si se omite | Notas |
|-------|------|:-----------:|---------------------|-------|
| `trainedAt` | `DateTime?` (ISO 8601) | No | Momento actual (UTC) | Fecha/hora en que se entrenó. Enviar en UTC. |
| `totalTime` | `TimeSpan?` (`"hh:mm:ss"`) | No | `"00:00:00"` | Duración total del entreno. |
| `exercises` | `array` | **Sí** | — | Al menos 1 ejercicio. |

**`exercises[]` (`CreateManualExerciseDto`)**

| Campo | Tipo | Obligatorio | Default | Notas |
|-------|------|:-----------:|---------|-------|
| `exerciseId` | `string` | **Sí** | — | **ExternalId del catálogo (Mongo)**. Ver ⚠️ abajo. |
| `exerciseNameSnapshot` | `string?` | No | — | Nombre de respaldo. Solo se usa si el catálogo no resuelve el nombre. |
| `sets` | `array` | **Sí** | — | Al menos 1 set por ejercicio. |

**`sets[]` (`CreateManualSetDto`)**

| Campo | Tipo | Obligatorio | Default | Notas |
|-------|------|:-----------:|---------|-------|
| `setNumber` | `int?` | No | Orden en el array (1-based) | Si se omite en todos, se numeran 1, 2, 3… por posición. |
| `reps` | `int?` | No | `0` | Repeticiones realizadas. |
| `rpe` | `int?` | No | `0` | Esfuerzo percibido, rango **0–10**. |
| `weight` | `double?` | No | `0` | Peso empleado (kg). `0` = peso corporal. |
| `durationSeconds` | `int?` | No | `null` | Para ejercicios por tiempo. |

> ⚠️ **`exerciseId` en la sesión manual = ExternalId de Mongo directo.** Enviá el id del catálogo de
> ejercicios tal cual, **no** un id de rutina. El backend resuelve el nombre en español contra Mongo y
> lo guarda como snapshot histórico (si no lo encuentra, usa `exerciseNameSnapshot`).

#### Ejemplo de request

```json
{
  "trainedAt": "2026-07-08T20:00:00Z",
  "totalTime": "00:45:00",
  "exercises": [
    {
      "exerciseId": "abc123",
      "exerciseNameSnapshot": "Press banca",
      "sets": [
        { "setNumber": 1, "reps": 10, "rpe": 8, "weight": 25 },
        { "setNumber": 2, "reps": 8,  "rpe": 9, "weight": 25.5 }
      ]
    }
  ]
}
```

Ejemplo mínimo válido (todo lo opcional omitido):

```json
{
  "exercises": [
    { "exerciseId": "abc123", "sets": [ { } ] }
  ]
}
```
→ se guarda: `trainedAt` = ahora, `totalTime` = 00:00:00, 1 set con `setNumber` 1 y reps/rpe/weight en 0.

#### Respuestas

| Código | Cuerpo | Cuándo |
|--------|--------|--------|
| `200 OK` | `Guid` (id de la sesión creada) | Éxito. |
| `400 Bad Request` | `{ statusCode, message, timestamp }` | Falla de validación (ver reglas). |
| `404 Not Found` | `{ statusCode, message, timestamp }` | Usuario o perfil de fitness inexistente. |

#### Reglas de validación (400 si no se cumplen)

- `exercises`: al menos 1.
- Cada ejercicio: `exerciseId` no vacío **y** al menos 1 set.
- Si vienen: `setNumber > 0`, `reps >= 0`, `rpe` entre 0 y 10, `weight >= 0`, `durationSeconds >= 0`.
- Si viene: `totalTime >= 0`.

---

## 2. Listar el historial

### `GET /api/routine/training-history`

Devuelve el historial cronológico paginado, con detalle por ejercicio y por set. **Las sesiones
manuales aparecen mezcladas con las de rutina** en el mismo listado.

#### Query params (`TrainingHistoryQueryDto`)

| Param | Tipo | Default | Notas |
|-------|------|---------|-------|
| `fromDate` | `DateTime?` | — | Filtro desde. |
| `toDate` | `DateTime?` | — | Filtro hasta. |
| `routineId` | `Guid?` | — | Filtra por rutina. **Las sesiones manuales quedan fuera** si se envía (no tienen rutina). |
| `targetMuscle` | `string?` | — | Filtra por músculo objetivo. |
| `page` | `int` | `1` | — |
| `pageSize` | `int` | `10` | — |

#### Response (`TrainingHistoryResponseDto`)

```jsonc
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 37,
  "items": [
    {
      "id": "e3f1...",
      "trainedAt": "2026-07-08T20:00:00Z",
      "totalTime": "00:45:00",
      "routineId": null,                    // null en sesiones manuales
      "routineName": "Sesión manual",       // etiqueta fija cuando no hay rutina
      "routineVersionId": null,
      "routineVersionNumber": null,
      "exercises": [
        {
          "exerciseId": "abc123",
          "exerciseNameEs": "Press banca",  // snapshot guardado al registrar
          "sets": [
            { "setNumber": 1, "repsPerformed": 10, "rpe": 8, "weightUsed": 25,   "durationSeconds": null, "isCompleted": true },
            { "setNumber": 2, "repsPerformed": 8,  "rpe": 9, "weightUsed": 25.5, "durationSeconds": null, "isCompleted": true }
          ]
        }
      ]
    }
  ]
}
```

#### Cómo distinguir y mostrar una sesión manual en el front

- **Es manual** cuando `routineId === null`.
- **Título**: componer en el front `"Sesión manual" · {trainedAt formateada}`. El backend manda la
  etiqueta (`routineName`) y la fecha cruda (`trainedAt`); **el formato/locale/zona horaria es
  responsabilidad del front** (por eso no viene un string ya armado).
- **Nombre del ejercicio**: usar `exerciseNameEs` (viene resuelto como snapshot; no hace falta pegarle
  al catálogo).

---

## 3. Qué cambió (antes → ahora)

### Modelo / persistencia
| Elemento | Antes | Ahora |
|----------|-------|-------|
| `TrainingSession.RoutineId` | `Guid` (obligatorio) | **`Guid?`** (null en sesiones manuales) |
| Registrar sin rutina | No era posible | Nuevo endpoint `POST /sessions/manual` |
| Migración DB | — | `MakeTrainingSessionRoutineIdNullable` (columna `RoutineId` pasa a nullable) |

### Contrato de escritura
- **Nuevo** endpoint `POST /api/routine/sessions/manual` con body **anidado** (`exercises[].sets[]`).
- El endpoint de rutina existente `POST /api/routine/sessions` **no cambió** (sigue con su DTO plano y
  `routineId` obligatorio).

### Contrato de lectura (`training-history`) — ⚠️ cambios que impactan al front
| Campo | Antes | Ahora | Acción del front |
|-------|-------|-------|------------------|
| `items[].routineId` | `Guid` | **`Guid?`** (puede ser `null`) | Tratar `null` como "sesión manual". |
| `items[].routineName` | Nombre de la rutina | `"Sesión manual"` cuando no hay rutina | Usar como etiqueta base del título. |
| **RPE** | En el **ejercicio** (`exercises[].rpe`) | **Movido al set** (`exercises[].sets[].rpe`) | **Leer el RPE desde cada set.** El campo a nivel ejercicio ya no existe. |

> El cambio de RPE es el único **breaking** del contrato de lectura. El resto es aditivo/compatible
> (`routineId` nullable no rompe si el front ya lo trataba como opcional).

---

## 4. Fuera de alcance (por ahora)

- **Enriquecimiento** (imagen, músculos, equipamiento) en el historial: no se devuelve; el listado
  muestra solo nombre + sets.
- **Título editable** por el usuario: hoy es la etiqueta fija `"Sesión manual"`. Si se quisiera un
  nombre propio, se agregaría un campo `Title` a la sesión (requiere migración).
- **Sincronización offline** de la sesión manual.
