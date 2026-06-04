# Cambios para frontend: carga estructurada en rutinas

El backend ya no usa el campo legacy `weight` en rutinas/adaptaciones. El front debe leer y enviar carga de ejercicios con campos estructurados: `loadType`, `plannedWeightKg` y `primaryMuscleGroup`.

## Quick path

1. Reemplazar toda lectura de `exercise.weight`.
2. Actualizar creación/edición manual de rutinas para enviar `loadType` y `plannedWeightKg`.
3. Actualizar pantallas de rutina/adaptación para mostrar la carga desde el nuevo contrato.
4. Verificar `create`, `update`, `active routine`, `routine detail`, `adapt-ai`, `confirm adaptation`, `swap` y `adjust-load`.

## Qué cambió

| Antes | Ahora |
|---|---|
| `weight: "20kg"` | `loadType: "ExternalWeight"`, `plannedWeightKg: 20` |
| `weight: "body weight"` | `loadType: "BodyWeight"`, `plannedWeightKg: null` |
| Texto libre de peso | Carga tipada: solo `BodyWeight` o `ExternalWeight` |
| `RequiresReconfiguration` en perfil nutricional | Ya no existe; usar `selectedSubGoalId == null` |

## Responses afectadas

En cada ejercicio de rutina/adaptación, el backend ahora devuelve:

```json
{
  "id": "routine-exercise-id",
  "exerciseId": "ex001",
  "order": 0,
  "sets": 3,
  "repType": "Fixed",
  "minRep": 10,
  "maxRep": 10,
  "currentRep": 10,
  "durationSeconds": null,
  "rest": 60,
  "loadType": "ExternalWeight",
  "plannedWeightKg": 20,
  "primaryMuscleGroup": "chest"
}
```

Endpoints donde aparece este shape:

- `GET /api/routine/active-routine`
- `GET /api/routine/{id}`
- `GET /api/routine/my-routines`
- `GET /api/routine/routine-preview`
- `POST /api/routine/generate-routine`
- `POST /api/routine/regenerate-routine`
- `POST /api/routine/swap-exercises`
- `POST /api/routine/{routineId}/adapt-ai`
- `POST /api/routine/adaptation/{adaptationId}/confirm`
- `POST /api/routine/create-routine`
- `PUT /api/routine/{id}`

## Requests afectados

### Crear o editar rutina manual

Endpoints:

- `POST /api/routine/create-routine`
- `PUT /api/routine/{id}`

Cada ejercicio debe enviar:

```json
{
  "exerciseId": "ex001",
  "order": 0,
  "sets": 3,
  "repMode": "reps",
  "reps": 10,
  "durationSeconds": null,
  "restSeconds": 60,
  "loadType": "ExternalWeight",
  "plannedWeightKg": 20
}
```

Para peso corporal:

```json
{
  "exerciseId": "ex002",
  "order": 1,
  "sets": 3,
  "repMode": "secs",
  "reps": null,
  "durationSeconds": 30,
  "restSeconds": 60,
  "loadType": "BodyWeight",
  "plannedWeightKg": null
}
```

Reglas:

- `loadType` acepta solo `"BodyWeight"` o `"ExternalWeight"`.
- Si `loadType = "ExternalWeight"`, `plannedWeightKg` es obligatorio y mayor a `0`.
- Si `loadType = "BodyWeight"`, `plannedWeightKg` debe ser `null`.
- El front NO envía `primaryMuscleGroup`; el backend lo deriva desde el catálogo.

### Ajuste de carga

Endpoint:

- `POST /api/exercise/adjust-load`

La respuesta ya no devuelve `weight`. Ahora puede devolver:

```json
{
  "loadType": "ExternalWeight",
  "plannedWeightKg": 22.5,
  "currentRep": null,
  "durationSeconds": null
}
```

Si no hay ajuste de carga, `loadType` y `plannedWeightKg` pueden venir `null`, pero puede cambiar `currentRep` o `durationSeconds`.

## Perfil nutricional

`NutritionProfileDto` ya no devuelve:

```json
"requiresReconfiguration"
```

Para detectar que falta elegir objetivo nutricional:

```ts
const needsNutritionGoal = nutritionProfile.selectedSubGoalId == null;
```

## Checklist frontend

- [ ] Eliminar usos de `exercise.weight`.
- [ ] Mostrar peso como `plannedWeightKg + "kg"` cuando `loadType === "ExternalWeight"`.
- [ ] Mostrar “peso corporal” cuando `loadType === "BodyWeight"`.
- [ ] En formularios manuales, cambiar `weightKg` por `loadType` + `plannedWeightKg`.
- [ ] Validar en UI que `plannedWeightKg` solo se pida para `ExternalWeight`.
- [ ] Actualizar tipos/interfaces de `RoutineExercise`, `AdaptedExercise` y `AdjustLoadResponse`.
- [ ] Cambiar lógica de perfil nutricional: `selectedSubGoalId == null` reemplaza `requiresReconfiguration`.

## Nota importante

Este cambio es intencionalmente no compatible con el contrato viejo. Si el front sigue esperando `weight`, las pantallas de rutina van a romper. Mejor arreglarlo de una vez: CONCEPTOS > parches.
