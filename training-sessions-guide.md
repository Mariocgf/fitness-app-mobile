# Guía: Registro de Sesiones de Entrenamiento

## Endpoint

```
POST /api/routine/sessions
Authorization: Bearer <token_jwt>
Content-Type: application/json
```

---

## Estructura del Payload

```jsonc
{
  "routineId": "guid-de-la-rutina-activa",
  "trainedAt": "2025-05-25T10:30:00Z",       // ISO 8601 UTC
  "totalTime": "00:45:30",                     // HH:mm:ss (duración total de la sesión)
  "exercises": [
    {
      "exerciseId": "0V2YQjW",                 // ID externo del ejercicio (string, viene de la rutina)
      "rpe": 8,                                 // Rate of Perceived Exertion (1-10)
      "totalWeight": 60.0,                      // Peso total acumulado en el ejercicio (kg). 0 = bodyweight
      "sets": [
        {
          "setNumber": 1,                       // Número de set (1-indexed, obligatorio > 0)
          "repsPerformed": 12,                  // Repeticiones realizadas en este set
          "weightUsed": 20.0,                   // Peso usado en este set específico (kg). 0 = bodyweight
          "durationSeconds": null,              // Solo para ejercicios timed (ej: plancha 30s). null si es reps.
          "isCompleted": true                   // Si el usuario completó el set o lo abandonó
        },
        {
          "setNumber": 2,
          "repsPerformed": 10,
          "weightUsed": 20.0,
          "durationSeconds": null,
          "isCompleted": true
        },
        {
          "setNumber": 3,
          "repsPerformed": 8,
          "weightUsed": 22.5,
          "durationSeconds": null,
          "isCompleted": true
        }
      ]
    },
    {
      "exerciseId": "aB3xKlM",
      "rpe": 7,
      "totalWeight": 0,
      "sets": [
        {
          "setNumber": 1,
          "repsPerformed": 0,
          "weightUsed": 0,
          "durationSeconds": 45,
          "isCompleted": true
        },
        {
          "setNumber": 2,
          "repsPerformed": 0,
          "weightUsed": 0,
          "durationSeconds": 40,
          "isCompleted": true
        }
      ]
    }
  ]
}
```

---

## Descripción de cada campo

### Nivel raíz (sesión)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `routineId` | `string (GUID)` | Sí | ID de la rutina que el usuario estaba siguiendo |
| `trainedAt` | `string (ISO 8601)` | Sí | Fecha y hora de inicio de la sesión en UTC |
| `totalTime` | `string (HH:mm:ss)` | Sí | Duración total de la sesión |
| `exercises` | `array` | Sí | Lista de ejercicios realizados |

### Nivel ejercicio

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `exerciseId` | `string` | Sí | ID externo del ejercicio (el que viene en la rutina, ej: `"0V2YQjW"`) |
| `rpe` | `int` | Sí | Percepción de esfuerzo del 1 al 10 |
| `totalWeight` | `number` | Sí | Peso total acumulado en todos los sets (kg). Enviar `0` para bodyweight |
| `sets` | `array` | Sí | Detalle de cada set realizado. Puede estar vacío `[]` para retrocompatibilidad |

### Nivel set

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `setNumber` | `int` | Sí | Número ordinal del set (empezando en 1) |
| `repsPerformed` | `int` | Sí | Repeticiones realizadas. Enviar `0` para ejercicios timed |
| `weightUsed` | `number` | Sí | Peso usado en este set específico (kg). `0` = bodyweight |
| `durationSeconds` | `int \| null` | No | Segundos mantenidos (solo para ejercicios de tiempo: plancha, iso hold, etc.) |
| `isCompleted` | `bool` | Sí | `true` si el set fue completado, `false` si fue abandonado antes de terminar |

---

## Casos de uso del Front

### 1. Ejercicio con repeticiones (Bench Press, Squat, etc.)

```json
{
  "exerciseId": "0V2YQjW",
  "rpe": 8,
  "totalWeight": 60.0,
  "sets": [
    { "setNumber": 1, "repsPerformed": 12, "weightUsed": 20.0, "durationSeconds": null, "isCompleted": true },
    { "setNumber": 2, "repsPerformed": 10, "weightUsed": 20.0, "durationSeconds": null, "isCompleted": true },
    { "setNumber": 3, "repsPerformed": 8,  "weightUsed": 20.0, "durationSeconds": null, "isCompleted": false }
  ]
}
```

### 2. Ejercicio timed (Plancha, Wall Sit, etc.)

```json
{
  "exerciseId": "xK9pLmN",
  "rpe": 6,
  "totalWeight": 0,
  "sets": [
    { "setNumber": 1, "repsPerformed": 0, "weightUsed": 0, "durationSeconds": 60, "isCompleted": true },
    { "setNumber": 2, "repsPerformed": 0, "weightUsed": 0, "durationSeconds": 45, "isCompleted": true }
  ]
}
```

### 3. Ejercicio bodyweight con reps (Pull-ups, Push-ups, etc.)

```json
{
  "exerciseId": "bW2cDfG",
  "rpe": 9,
  "totalWeight": 0,
  "sets": [
    { "setNumber": 1, "repsPerformed": 15, "weightUsed": 0, "durationSeconds": null, "isCompleted": true },
    { "setNumber": 2, "repsPerformed": 12, "weightUsed": 0, "durationSeconds": null, "isCompleted": true },
    { "setNumber": 3, "repsPerformed": 10, "weightUsed": 0, "durationSeconds": null, "isCompleted": true }
  ]
}
```

---

## Cómo armar el objeto desde React Native

```typescript
interface SessionSet {
  setNumber: number;
  repsPerformed: number;
  weightUsed: number;
  durationSeconds: number | null;
  isCompleted: boolean;
}

interface SessionExercise {
  exerciseId: string;
  rpe: number;
  totalWeight: number;
  sets: SessionSet[];
}

interface CreateTrainingSession {
  routineId: string;
  trainedAt: string;    // new Date().toISOString()
  totalTime: string;    // formato "HH:mm:ss"
  exercises: SessionExercise[];
}
```

### Ejemplo de construcción:

```typescript
// Función helper para formatear duración
const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// Construir el payload
const payload: CreateTrainingSession = {
  routineId: activeRoutine.id,
  trainedAt: sessionStartTime.toISOString(),
  totalTime: formatDuration(totalElapsedSeconds),
  exercises: completedExercises.map(exercise => ({
    exerciseId: exercise.exerciseId,
    rpe: exercise.userRpe,
    totalWeight: exercise.sets.reduce((sum, set) => sum + set.weightUsed, 0),
    sets: exercise.sets.map((set, index) => ({
      setNumber: index + 1,
      repsPerformed: set.reps,
      weightUsed: set.weight,
      durationSeconds: set.duration ?? null,
      isCompleted: set.completed,
    })),
  })),
};

// Enviar
await api.post('/api/routine/sessions', payload);
```

---

## Respuesta exitosa

```json
// 200 OK
"guid-de-la-sesion-creada"
```

---

## Errores posibles

| HTTP Status | Causa |
|-------------|-------|
| `401` | Token JWT inválido o ausente |
| `404` | Usuario no encontrado / Perfil fitness no existe |
| `400` | Datos inválidos (setNumber <= 0, repsPerformed < 0, etc.) |

---

## Notas importantes

1. **`sets` es opcional para retrocompatibilidad**: si el front envía `sets: []`, la sesión se guarda solo con RPE y TotalWeight (comportamiento anterior).
2. **`totalWeight`** es un campo de resumen. El detalle real está en cada set. El front puede calcularlo como `sum(sets.weightUsed)` o dejarlo como el peso nominal del ejercicio.
3. **`trainedAt`** siempre en UTC. El front debe convertir la hora local a UTC antes de enviar.
4. **`setNumber`** debe empezar en 1 y ser secuencial. El back valida que sea > 0.
5. **Ejercicios timed**: enviar `repsPerformed: 0` y usar `durationSeconds`.
6. **Ejercicios de reps**: enviar `durationSeconds: null`.
