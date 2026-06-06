# Contrato Frontend — Settings de Fitness

Este documento describe los endpoints que usa la pantalla de **Settings > Fitness**.

Base path:

```txt
/api/fitness
```

Todos los endpoints requieren token:

```http
Authorization: Bearer <token>
```

## Días válidos

Los días se envían y reciben como `string` en inglés, lowercase:

```ts
type FitnessDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";
```

---

## 1. Obtener preferencias de entrenamiento

Obtiene el tiempo disponible para entrenar y los días seleccionados.

```http
GET /api/fitness/training-preferences
```

### Response 200

```json
{
  "sessionDurationPreference": 45,
  "preferredWorkoutDays": ["monday", "wednesday", "friday"]
}
```

### TypeScript

```ts
export type FitnessTrainingPreferences = {
  sessionDurationPreference: number;
  preferredWorkoutDays: FitnessDay[];
};
```

---

## 2. Actualizar preferencias de entrenamiento

Actualiza el tiempo disponible para entrenar y reemplaza la lista completa de días.

```http
PUT /api/fitness/training-preferences
Content-Type: application/json
```

### Request body

```json
{
  "sessionDurationPreference": 60,
  "preferredWorkoutDays": ["monday", "thursday", "saturday"]
}
```

### Response 204

Sin body.

### Validaciones

- `sessionDurationPreference` debe ser mayor a `0`.
- `preferredWorkoutDays` debe tener al menos un día.
- Los días deben ser strings válidos en inglés lowercase.
- Si se envían días duplicados, backend los normaliza y guarda una sola vez.

### TypeScript

```ts
export type UpdateFitnessTrainingPreferencesRequest = {
  sessionDurationPreference: number;
  preferredWorkoutDays: FitnessDay[];
};
```

---

## 3. Obtener subobjetivo fitness seleccionado

Obtiene el subobjetivo actual del usuario para Fitness.

```http
GET /api/fitness/sub-goal
```

### Response 200

```json
{
  "subGoalId": "8f6c3318-df0b-4e4a-8e8f-7f3fb3c8f6fd",
  "name": "Ganar fuerza",
  "description": "Enfocado en progresión de cargas y fuerza máxima."
}
```

### Response 204

El usuario todavía no tiene subobjetivo fitness seleccionado.

### TypeScript

```ts
export type FitnessSubGoal = {
  subGoalId: string;
  name: string;
  description: string;
};
```

---

## 4. Actualizar subobjetivo fitness

Actualiza el subobjetivo fitness seleccionado. Es **uno solo**: al guardar, reemplaza el anterior.

```http
PUT /api/fitness/sub-goal
Content-Type: application/json
```

### Request body

```json
{
  "subGoalId": "8f6c3318-df0b-4e4a-8e8f-7f3fb3c8f6fd"
}
```

### Response 204

Sin body.

### Validaciones

- `subGoalId` es requerido.
- El subobjetivo debe existir.
- El subobjetivo debe pertenecer al módulo `Fitness`.

### TypeScript

```ts
export type UpdateFitnessSubGoalRequest = {
  subGoalId: string;
};
```

---

## 5. Obtener subobjetivos disponibles

Este endpoint ya existía y sirve para poblar el selector de subobjetivos.

```http
GET /api/goals/sub-goals/{moduleId}
```

Usar el `moduleId` correspondiente al módulo `Fitness`.

### Response 200

```json
[
  {
    "id": "8f6c3318-df0b-4e4a-8e8f-7f3fb3c8f6fd",
    "name": "Ganar fuerza",
    "description": "Enfocado en progresión de cargas y fuerza máxima."
  }
]
```

---

## 6. Equipamiento disponible del usuario

Estos endpoints ya existían y siguen siendo los que usa la sección actual de equipamiento.

```http
GET /api/fitness/available-equipments
PUT /api/fitness/available-equipments
GET /api/fitness/equipments
```

El cambio nuevo **no rompe** el flujo actual de equipamiento.

---

## Manejo de errores

El backend responde errores con este formato general:

```json
{
  "statusCode": 400,
  "message": "Día de entrenamiento inválido: lunes.",
  "timestamp": "2026-06-05T21:30:00Z"
}
```

Códigos esperados:

- `400`: request inválido.
- `401`: token ausente o inválido.
- `404`: usuario o perfil fitness no encontrado.
- `500`: error no controlado.

---

## Ejemplo de flujo recomendado

Al abrir Settings > Fitness:

1. `GET /api/fitness/training-preferences`
2. `GET /api/fitness/sub-goal`
3. `GET /api/fitness/available-equipments`
4. `GET /api/goals/sub-goals/{fitnessModuleId}` para cargar opciones del selector.

Al guardar:

1. Si cambian tiempo/días: `PUT /api/fitness/training-preferences`
2. Si cambia subobjetivo: `PUT /api/fitness/sub-goal`
3. Si cambia equipamiento: `PUT /api/fitness/available-equipments`
