# Mediciones corporales — Contrato de API para Frontend

## Autenticación

Todos los endpoints requieren un JWT de **Clerk** en el header:

```
Authorization: Bearer <clerk_session_token>
```

---

## Endpoints

### 1. Registrar una medición

```
POST /api/health/body-measurements
Content-Type: application/json
```

#### Body (todos los campos son opcionales)

```json
{
  "date": "2026-06-08",
  "weightKg": 78.5,
  "waistCm": 85.0,
  "neckCm": 38.0,
  "hipCm": 97.0,
  "chestCm": 100.0,
  "armCm": 32.0,
  "thighCm": 55.0
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `date` | `string` (YYYY-MM-DD) | Fecha de la medición. Si se omite, se usa la fecha UTC actual. |
| `weightKg` | `number` | Peso en kilogramos. Debe ser > 0. |
| `waistCm` | `number` | Cintura en centímetros. Debe ser > 0. |
| `neckCm` | `number` | Cuello en centímetros. Debe ser > 0. |
| `hipCm` | `number` | Cadera en centímetros. Debe ser > 0. Solo relevante para mujeres (ver cálculo automático). |
| `chestCm` | `number` | Pecho en centímetros. Debe ser > 0. |
| `armCm` | `number` | Brazo en centímetros. Debe ser > 0. |
| `thighCm` | `number` | Muslo en centímetros. Debe ser > 0. |

> No hace falta enviar todos los campos. El usuario puede registrar solo el peso, o solo medidas perimetrales, o cualquier combinación.

#### Respuesta `200 OK`

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "date": "2026-06-08",
  "capturedAt": "2026-06-08T23:10:00.000Z",
  "weightKg": 78.5,
  "waistCm": 85.0,
  "neckCm": 38.0,
  "hipCm": 97.0,
  "chestCm": 100.0,
  "armCm": 32.0,
  "thighCm": 55.0,
  "bodyFatPercentage": 18.42,
  "leanMassKg": 64.05
}
```

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | `string` (UUID) | Identificador único de la medición. |
| `date` | `string` (YYYY-MM-DD) | Fecha de la medición. |
| `capturedAt` | `string` (ISO 8601 UTC) | Timestamp exacto del registro en el servidor. |
| `weightKg` | `number \| null` | Peso enviado. |
| `waistCm` | `number \| null` | Cintura enviada. |
| `neckCm` | `number \| null` | Cuello enviado. |
| `hipCm` | `number \| null` | Cadera enviada. |
| `chestCm` | `number \| null` | Pecho enviado. |
| `armCm` | `number \| null` | Brazo enviado. |
| `thighCm` | `number \| null` | Muslo enviado. |
| `bodyFatPercentage` | `number \| null` | % grasa corporal calculado por el servidor (ver abajo). |
| `leanMassKg` | `number \| null` | Masa magra en kg calculada por el servidor (ver abajo). |

---

### 2. Obtener historial de mediciones

```
GET /api/health/body-measurements
```

Sin body ni query params. Devuelve todas las mediciones del usuario autenticado.

#### Respuesta `200 OK`

Array de objetos con el mismo schema que la respuesta del POST, ordenados por `capturedAt` ascendente.

```json
[
  {
    "id": "...",
    "date": "2026-06-01",
    "capturedAt": "2026-06-01T10:00:00.000Z",
    "weightKg": 79.2,
    ...
  },
  {
    "id": "...",
    "date": "2026-06-08",
    ...
  }
]
```

---

## Campos calculados automáticamente por el servidor

`bodyFatPercentage` y `leanMassKg` **no se envían desde el frontend**; el servidor los calcula usando la **Fórmula de la Marina de EE.UU.** y los persiste.

### Condiciones para que el cálculo ocurra

| Género del usuario | Campos mínimos necesarios |
|---|---|
| Masculino | `waistCm` + `neckCm` (+ peso del perfil si no se envía `weightKg`) |
| Femenino | `waistCm` + `neckCm` + `hipCm` |

Si no se cumplen las condiciones, ambos campos se devuelven como `null`. No es un error — simplemente no hay suficiente información para el cálculo.

### Rango de validez

El servidor descarta resultados fisiológicamente imposibles:
- Hombres: < 3 % de grasa → se devuelve `null`
- Mujeres: < 10 % de grasa → se devuelve `null`

---

## Efecto secundario — Recálculo nutricional automático

Al guardar una medición, el backend recalcula las metas nutricionales del usuario de forma transparente **si se cumplen todas estas condiciones**:

1. El usuario tiene un perfil nutricional.
2. Ese perfil tiene un subobjetivo seleccionado.
3. Ese subobjetivo tiene una regla activa configurada.

Cuando el cálculo ocurre:
- Las metas de calorías, proteínas, carbohidratos y grasas se actualizan.
- Si se pudo calcular masa magra (`leanMassKg != null`) y el nivel de cálculo era `Basic`, el nivel sube a `FitnessInferred` (usa la fórmula Katch-McArdle, más precisa).
- Se guarda un log de historial del cálculo en el backend.

> El frontend no necesita hacer nada extra. Si luego muestra el perfil nutricional actualizado (vía `GET /api/nutrition/profile` o similar), verá las metas ya recalculadas.

---

## Errores posibles

| Código | Causa |
|---|---|
| `401 Unauthorized` | Token ausente, expirado o inválido. |
| `400 Bad Request` | Algún campo numérico enviado con valor ≤ 0. |
| `404 / 500` | El usuario o perfil no existe en el sistema (no debería ocurrir si el onboarding está completo). |

---

## Ejemplo de llamada (fetch)

```ts
const response = await fetch('/api/health/body-measurements', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${clerkToken}`,
  },
  body: JSON.stringify({
    date: '2026-06-08',
    weightKg: 78.5,
    waistCm: 85,
    neckCm: 38,
    hipCm: 97,        // solo necesario para mujeres
  }),
});

const measurement = await response.json();
console.log(measurement.bodyFatPercentage); // calculado por el servidor
console.log(measurement.leanMassKg);
```
