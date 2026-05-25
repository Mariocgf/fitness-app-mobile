# API de Sesiones de Entrenamiento

## Cambios importantes

Se simplificó el modelo: ya no existe una tabla separada para sets. Ahora cada entrada en `exercises` representa **un set de un ejercicio**. El `exerciseId` y `rpe` se repiten por cada set del mismo ejercicio.

---

## 1. Registrar sesión de entrenamiento

```
POST /api/routine/sessions
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Payload

```jsonc
{
  "routineId": "guid-de-la-rutina",
  "trainedAt": "2025-05-25T10:30:00Z",     // ISO 8601, UTC
  "totalTime": "00:45:30",                   // HH:mm:ss
  "exercises": [
    // Ejercicio con peso: Bench Press — 3 sets
    {
      "exerciseId": "0V2YQjW",
      "rpe": 8,
      "setNumber": 1,
      "repsPerformed": 12,
      "weightUsed": 20.0,
      "durationSeconds": null,
      "isCompleted": true
    },
    {
      "exerciseId": "0V2YQjW",
      "rpe": 8,
      "setNumber": 2,
      "repsPerformed": 10,
      "weightUsed": 22.5,
      "durationSeconds": null,
      "isCompleted": true
    },
    {
      "exerciseId": "0V2YQjW",
      "rpe": 8,
      "setNumber": 3,
      "repsPerformed": 8,
      "weightUsed": 22.5,
      "durationSeconds": null,
      "isCompleted": false
    },
    // Ejercicio timed: Plancha — 2 sets
    {
      "exerciseId": "xK9pLmN",
      "rpe": 6,
      "setNumber": 1,
      "repsPerformed": 0,
      "weightUsed": 0,
      "durationSeconds": 60,
      "isCompleted": true
    },
    {
      "exerciseId": "xK9pLmN",
      "rpe": 6,
      "setNumber": 2,
      "repsPerformed": 0,
      "weightUsed": 0,
      "durationSeconds": 45,
      "isCompleted": true
    },
    // Bodyweight: Pull-ups — 2 sets
    {
      "exerciseId": "bW2cDfG",
      "rpe": 9,
      "setNumber": 1,
      "repsPerformed": 12,
      "weightUsed": 0,
      "durationSeconds": null,
      "isCompleted": true
    },
    {
      "exerciseId": "bW2cDfG",
      "rpe": 9,
      "setNumber": 2,
      "repsPerformed": 10,
      "weightUsed": 0,
      "durationSeconds": null,
      "isCompleted": true
    }
  ]
}
```

### Campos por entrada en `exercises`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `exerciseId` | `string` | Sí | ID externo del ejercicio (viene de la rutina) |
| `rpe` | `int` | Sí | Percepción de esfuerzo (1-10). Mismo valor para todos los sets del mismo ejercicio |
| `setNumber` | `int` | Sí | Número del set (empezando en 1, debe ser > 0) |
| `repsPerformed` | `int` | Sí | Reps realizadas. `0` para ejercicios timed |
| `weightUsed` | `number` | Sí | Peso usado en kg. `0` = bodyweight |
| `durationSeconds` | `int?` | No | Segundos (solo para ejercicios timed: plancha, etc.). `null` para ejercicios de reps |
| `isCompleted` | `bool` | Sí | `true` si el set se completó, `false` si se abandonó |

### Respuesta

```json
// 200 OK
"guid-de-la-sesion-creada"
```

---

// ── Construir el payload ──

const payload: CreateTrainingSession = {
  routineId: activeRoutine.id,
  trainedAt: sessionStartTime.toISOString(),
  totalTime: formatDuration(totalElapsedSeconds),
  exercises: completedExercises.flatMap(exercise =>
    exercise.sets.map((set, index) => ({
      exerciseId: exercise.exerciseId,
      rpe: exercise.userRpe,
      setNumber: index + 1,
      repsPerformed: set.reps,
      weightUsed: set.weight,
      durationSeconds: set.duration ?? null,
      isCompleted: set.completed,
    }))
  ),
};

await api.post('/api/routine/sessions', payload);
```

**Clave**: usar `.flatMap()` para aplanar los sets. Cada set se convierte en una entrada independiente en el array `exercises`, repitiendo `exerciseId` y `rpe`.

---

## 4. Errores posibles

| HTTP | Causa |
|------|-------|
| `400` | Validación fallida: `setNumber <= 0`, `repsPerformed < 0`, `weightUsed < 0`, `pageSize > 50` |
| `401` | Token JWT inválido o ausente |
| `404` | Usuario o perfil fitness no encontrado |
