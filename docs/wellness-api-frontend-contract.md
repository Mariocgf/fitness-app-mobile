# Wellness Tracking API — Contrato Frontend

Este documento define el contrato completo que el frontend necesita para implementar las 4 funcionalidades de wellness: **Sueño**, **Hidratación**, **Ánimo** y **Meditación**.

---

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Enums Globales](#enums-globales)
3. [Sueño](#sueño)
4. [Hidratación](#hidratación)
5. [Ánimo](#ánimo)
6. [Meditación](#meditación)
7. [Paginación](#paginación)
8. [Manejo de Errores](#manejo-de-errores)
9. [Ejemplos de Uso](#ejemplos-de-uso)

---

## Autenticación

Todos los endpoints requieren un **Bearer Token** en el header:

```
Authorization: Bearer {token}
```

El token se obtiene del flujo OAuth/OIDC existente del proyecto. Sin token → **401 Unauthorized**.

---

## Enums Globales

Estos enums se usan en múltiples endpoints. Úsalos tal cual están; el backend los valida como strings.

### SleepQuality (Sueño)
```typescript
enum SleepQuality {
  VeryPoor = "VeryPoor",     // Muy mala
  Poor = "Poor",              // Mala
  Fair = "Fair",              // Regular
  Good = "Good",              // Buena
  Excellent = "Excellent"     // Excelente
}
```

### MoodLevel (Ánimo y Meditación)
```typescript
enum MoodLevel {
  VeryBad = "VeryBad",       // Muy mal
  Bad = "Bad",               // Mal
  Neutral = "Neutral",       // Normal
  Good = "Good",             // Bien
  VeryGood = "VeryGood"      // Muy bien
}
```

### BeverageType (Hidratación)
```typescript
enum BeverageType {
  Water = "Water",           // Agua
  Tea = "Tea",               // Té
  Coffee = "Coffee",         // Café
  Infusion = "Infusion",     // Infusión
  Other = "Other"            // Otro
}
```

### MeditationTechnique (Meditación)
```typescript
enum MeditationTechnique {
  Mindfulness = "Mindfulness",
  Breathing = "Breathing",
  BodyScan = "BodyScan",
  LovingKindness = "LovingKindness",
  Guided = "Guided",
  Other = "Other"
}
```

---

## 🛏️ Sueño

### Registrar Sueño

**POST** `/api/sleep`

Registra una entrada de sueño del usuario actual.

#### Request Body
```typescript
interface AddSleepLogDto {
  date: string;              // ISO 8601 (YYYY-MM-DD)
  durationMinutes: number;   // Entre 1 y 720 (12 horas máx)
  quality: SleepQuality;     // Enum: VeryPoor | Poor | Fair | Good | Excellent
  note?: string | null;      // Opcional, máx 500 caracteres
}
```

#### Request Example
```json
{
  "date": "2026-06-26",
  "durationMinutes": 480,
  "quality": "Good",
  "note": "Dormí bien, sin interrupciones"
}
```

#### Response (200 OK)
```typescript
interface SleepLogDto {
  id: string;                // UUID
  userId: string;            // UUID (tu ID, autom generado)
  date: string;              // ISO 8601
  capturedAt: string;        // ISO 8601 timestamp UTC (cuándo lo registraste)
  durationMinutes: number;
  quality: SleepQuality;
  note: string | null;
}
```

#### Response Example
```json
{
  "id": "a1b2c3d4-e5f6-47c8-9d0e-1a2b3c4d5e6f",
  "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
  "date": "2026-06-26",
  "capturedAt": "2026-06-26T14:32:10Z",
  "durationMinutes": 480,
  "quality": "Good",
  "note": "Dormí bien, sin interrupciones"
}
```

#### Validaciones
- `durationMinutes` debe estar entre 1 y 720
- `note` máximo 500 caracteres
- `date` debe ser una fecha válida
- Si el usuario no existe → **404 WellnessException**

---

### Obtener Historial de Sueño

**GET** `/api/sleep?page={page}&pageSize={pageSize}`

Obtiene el historial de sueño paginado (descendente por fecha).

#### Query Parameters
```typescript
interface SleepQueryParams {
  page?: number;             // Defecto: 1 (primera página)
  pageSize?: number;         // Defecto: 10, máximo: 100
}
```

#### Response (200 OK)
```typescript
interface PagedResponseDto<SleepLogDto> {
  page: number;
  pageSize: number;
  totalCount: number;        // Total de registros del usuario
  items: SleepLogDto[];      // Listado de registros en esta página
}
```

#### Response Example
```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 25,
  "items": [
    {
      "id": "a1b2c3d4-e5f6-47c8-9d0e-1a2b3c4d5e6f",
      "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
      "date": "2026-06-26",
      "capturedAt": "2026-06-26T14:32:10Z",
      "durationMinutes": 480,
      "quality": "Good",
      "note": "Dormí bien"
    }
    // ... más registros
  ]
}
```

#### Notas
- Si `pageSize > 100` se clampea automáticamente a 100
- El `totalCount` te permite paginar correctamente
- Los registros vienen ordenados más reciente primero

---

### Obtener Sueño por ID

**GET** `/api/sleep/{id:guid}`

Obtiene el detalle de un registro de sueño específico.

#### Path Parameters
- `id` — UUID del registro

#### Response (200 OK)
```json
{
  "id": "a1b2c3d4-e5f6-47c8-9d0e-1a2b3c4d5e6f",
  "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
  "date": "2026-06-26",
  "capturedAt": "2026-06-26T14:32:10Z",
  "durationMinutes": 480,
  "quality": "Good",
  "note": "Dormí bien"
}
```

#### Posibles Respuestas
- **200 OK** — Registro encontrado y te pertenece
- **404 Not Found** — Registro no existe o no te pertenece (WellnessException)

---

### Eliminar Sueño

**DELETE** `/api/sleep/{id:guid}`

Elimina un registro de sueño del usuario actual.

#### Path Parameters
- `id` — UUID del registro

#### Response (204 No Content)
Sin body. Si la eliminación fue exitosa.

#### Posibles Respuestas
- **204 No Content** — Eliminado correctamente
- **404 Not Found** — Registro no existe o no te pertenece

---

## 💧 Hidratación

### Registrar Hidratación

**POST** `/api/hydration`

Registra un registro de hidratación (bebida consumida).

#### Request Body
```typescript
interface AddHydrationLogDto {
  date: string;              // ISO 8601 (YYYY-MM-DD)
  amountMl: number;          // Entre 1 y 10000 ml
  beverageType: BeverageType;// Enum: Water | Tea | Coffee | Infusion | Other
}
```

#### Request Example
```json
{
  "date": "2026-06-26",
  "amountMl": 500,
  "beverageType": "Water"
}
```

#### Response (200 OK)
```typescript
interface HydrationLogDto {
  id: string;                // UUID
  userId: string;            // UUID
  date: string;              // ISO 8601
  capturedAt: string;        // ISO 8601 timestamp UTC
  amountMl: number;
  beverageType: BeverageType;
}
```

#### Response Example
```json
{
  "id": "b2c3d4e5-f6a7-48d9-ae1f-2b3c4d5e6f7a",
  "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
  "date": "2026-06-26",
  "capturedAt": "2026-06-26T15:00:00Z",
  "amountMl": 500,
  "beverageType": "Water"
}
```

#### Validaciones
- `amountMl` debe estar entre 1 y 10000
- `date` debe ser una fecha válida

---

### Obtener Historial de Hidratación

**GET** `/api/hydration?page={page}&pageSize={pageSize}`

Obtiene el historial de hidratación paginado (descendente por fecha).

#### Query Parameters
```typescript
interface HydrationQueryParams {
  page?: number;             // Defecto: 1
  pageSize?: number;         // Defecto: 10, máximo: 100
}
```

#### Response (200 OK)
```typescript
interface PagedResponseDto<HydrationLogDto> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: HydrationLogDto[];
}
```

---

### Obtener Hidratación por ID

**GET** `/api/hydration/{id:guid}`

Obtiene el detalle de un registro de hidratación.

#### Response (200 OK)
Como el DTO completo.

#### Posibles Respuestas
- **200 OK**
- **404 Not Found** — No existe o no te pertenece

---

### Eliminar Hidratación

**DELETE** `/api/hydration/{id:guid}`

Elimina un registro de hidratación.

#### Response (204 No Content)

---

## 😊 Ánimo

### Registrar Ánimo

**POST** `/api/mood`

Registra cómo te sientes en un momento dado.

#### Request Body
```typescript
interface AddMoodLogDto {
  date: string;              // ISO 8601 (YYYY-MM-DD)
  mood: MoodLevel;           // Enum: VeryBad | Bad | Neutral | Good | VeryGood
  note?: string | null;      // Opcional, máx 500 caracteres
}
```

#### Request Example
```json
{
  "date": "2026-06-26",
  "mood": "Good",
  "note": "Día productivo, me siento bien"
}
```

#### Response (200 OK)
```typescript
interface MoodLogDto {
  id: string;                // UUID
  userId: string;            // UUID
  date: string;              // ISO 8601
  capturedAt: string;        // ISO 8601 timestamp UTC
  mood: MoodLevel;
  note: string | null;
}
```

#### Response Example
```json
{
  "id": "c3d4e5f6-a7b8-49ea-bf20-3c4d5e6f7a8b",
  "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
  "date": "2026-06-26",
  "capturedAt": "2026-06-26T16:30:00Z",
  "mood": "Good",
  "note": "Día productivo, me siento bien"
}
```

#### Validaciones
- `note` máximo 500 caracteres
- `date` debe ser una fecha válida

---

### Obtener Historial de Ánimo

**GET** `/api/mood?page={page}&pageSize={pageSize}`

Obtiene el historial de ánimo paginado (descendente por fecha).

#### Query Parameters
```typescript
interface MoodQueryParams {
  page?: number;             // Defecto: 1
  pageSize?: number;         // Defecto: 10, máximo: 100
}
```

#### Response (200 OK)
```typescript
interface PagedResponseDto<MoodLogDto> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MoodLogDto[];
}
```

---

### Obtener Ánimo por ID

**GET** `/api/mood/{id:guid}`

Obtiene el detalle de un registro de ánimo.

#### Response (200 OK)
Como el DTO completo.

---

### Eliminar Ánimo

**DELETE** `/api/mood/{id:guid}`

Elimina un registro de ánimo.

#### Response (204 No Content)

---

## 🧘 Meditación

### Obtener Catálogo de Guías

**GET** `/api/meditation/guides?page={page}&pageSize={pageSize}`

Obtiene el catálogo de guías de meditación disponibles (solo activas).

#### Query Parameters
```typescript
interface GuideQueryParams {
  page?: number;             // Defecto: 1
  pageSize?: number;         // Defecto: 10, máximo: 100
}
```

#### Response (200 OK)
```typescript
interface PagedResponseDto<MeditationGuideDto> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MeditationGuideDto[];
}
```

#### MeditationGuideDto
```typescript
interface MeditationGuideDto {
  id: string;                // UUID
  title: string;             // Nombre de la guía
  description: string;       // Descripción de la técnica
  durationMinutes: number;   // Duración en minutos
  technique: MeditationTechnique;
  audioUrl: string;          // URL del audio (puede estar vacío)
  imageUrl: string | null;   // URL de la imagen (puede ser null)
}
```

#### Response Example
```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 3,
  "items": [
    {
      "id": "a1f1e1d1-0001-4001-b001-0c1d2e3f4a5b",
      "title": "Respiración Profunda",
      "description": "Técnica de respiración controlada para reducir estrés",
      "durationMinutes": 10,
      "technique": "Breathing",
      "audioUrl": "https://cdn.example.com/guides/breathing.mp3",
      "imageUrl": "https://cdn.example.com/guides/breathing.jpg"
    },
    {
      "id": "a1f1e1d1-0002-4002-b002-0c1d2e3f4a5b",
      "title": "Mindfulness",
      "description": "Meditación de atención plena",
      "durationMinutes": 20,
      "technique": "Mindfulness",
      "audioUrl": "https://cdn.example.com/guides/mindfulness.mp3",
      "imageUrl": null
    }
    // ... más guías
  ]
}
```

#### Notas
- Solo muestra guías activas (IsActive = true)
- El catálogo es igual para todos los usuarios

---

### Obtener Guía por ID

**GET** `/api/meditation/guides/{id:guid}`

Obtiene el detalle de una guía específica.

#### Path Parameters
- `id` — UUID de la guía

#### Response (200 OK)
```json
{
  "id": "a1f1e1d1-0001-4001-b001-0c1d2e3f4a5b",
  "title": "Respiración Profunda",
  "description": "Técnica de respiración controlada para reducir estrés",
  "durationMinutes": 10,
  "technique": "Breathing",
  "audioUrl": "https://cdn.example.com/guides/breathing.mp3",
  "imageUrl": "https://cdn.example.com/guides/breathing.jpg"
}
```

#### Posibles Respuestas
- **200 OK** — Guía encontrada
- **404 Not Found** — Guía no existe

---

### Registrar Sesión de Meditación

**POST** `/api/meditation`

Registra una sesión de meditación del usuario actual. Puede referenciar una guía del catálogo.

#### Request Body
```typescript
interface AddMeditationSessionDto {
  date: string;              // ISO 8601 (YYYY-MM-DD)
  durationMinutes: number;   // Entre 1 y 600 minutos
  technique: MeditationTechnique;
  guideId?: string | null;   // Opcional: UUID de una guía del catálogo
  moodBefore?: MoodLevel | null; // Opcional: cómo te sentías antes
  moodAfter?: MoodLevel | null;  // Opcional: cómo te sientes después
  note?: string | null;      // Opcional, máx 500 caracteres
}
```

#### Request Example (sin guía)
```json
{
  "date": "2026-06-26",
  "durationMinutes": 15,
  "technique": "Mindfulness"
}
```

#### Request Example (con guía)
```json
{
  "date": "2026-06-26",
  "durationMinutes": 10,
  "technique": "Breathing",
  "guideId": "a1f1e1d1-0001-4001-b001-0c1d2e3f4a5b",
  "moodBefore": "Bad",
  "moodAfter": "Good",
  "note": "Usé la guía de respiración, me calmó mucho"
}
```

#### Response (200 OK)
```typescript
interface MeditationSessionDto {
  id: string;                // UUID
  userId: string;            // UUID
  date: string;              // ISO 8601
  capturedAt: string;        // ISO 8601 timestamp UTC
  durationMinutes: number;
  technique: MeditationTechnique;
  guideId: string | null;    // Puede ser null
  moodBefore: MoodLevel | null;
  moodAfter: MoodLevel | null;
  note: string | null;
}
```

#### Response Example
```json
{
  "id": "d4e5f6a7-b8c9-4afa-c021-4d5e6f7a8b9c",
  "userId": "f1e2d3c4-b5a6-47c8-9d0e-1a2b3c4d5e6f",
  "date": "2026-06-26",
  "capturedAt": "2026-06-26T17:00:00Z",
  "durationMinutes": 10,
  "technique": "Breathing",
  "guideId": "a1f1e1d1-0001-4001-b001-0c1d2e3f4a5b",
  "moodBefore": "Bad",
  "moodAfter": "Good",
  "note": "Usé la guía de respiración, me calmó mucho"
}
```

#### Validaciones
- `durationMinutes` entre 1 y 600
- `note` máximo 500 caracteres
- Si `guideId` se proporciona, la guía debe existir **y estar activa** → si no, **404 WellnessException**
- `date` debe ser una fecha válida

---

### Obtener Historial de Sesiones de Meditación

**GET** `/api/meditation?page={page}&pageSize={pageSize}`

Obtiene el historial de sesiones de meditación del usuario (descendente por fecha).

#### Query Parameters
```typescript
interface SessionQueryParams {
  page?: number;             // Defecto: 1
  pageSize?: number;         // Defecto: 10, máximo: 100
}
```

#### Response (200 OK)
```typescript
interface PagedResponseDto<MeditationSessionDto> {
  page: number;
  pageSize: number;
  totalCount: number;
  items: MeditationSessionDto[];
}
```

---

### Obtener Sesión de Meditación por ID

**GET** `/api/meditation/{id:guid}`

Obtiene el detalle de una sesión específica.

#### Path Parameters
- `id` — UUID de la sesión

#### Response (200 OK)
Como el DTO completo de la sesión.

#### Posibles Respuestas
- **200 OK** — Sesión encontrada y te pertenece
- **404 Not Found** — Sesión no existe o no te pertenece

---

### Eliminar Sesión de Meditación

**DELETE** `/api/meditation/{id:guid}`

Elimina una sesión de meditación del usuario actual.

#### Path Parameters
- `id` — UUID de la sesión

#### Response (204 No Content)

#### Posibles Respuestas
- **204 No Content** — Eliminado correctamente
- **404 Not Found** — Sesión no existe o no te pertenece

---

## 📑 Paginación

**Todos los endpoints que devuelven listas usan paginación con el siguiente contrato:**

```typescript
interface PagedResponseDto<T> {
  page: number;              // Página actual (1-indexed)
  pageSize: number;          // Registros por página
  totalCount: number;        // Total de registros en la BD
  items: T[];                // Datos de esta página
}
```

### Cálculo de Páginas Totales
```typescript
const totalPages = Math.ceil(response.totalCount / response.pageSize);
```

### Comportamiento Automático
- Si `pageSize` > 100 → se clampea automáticamente a 100
- Si `page` < 1 → se usa 1
- Los registros se devuelven ordenados **descendente por fecha** (más reciente primero)

---

## ⚠️ Manejo de Errores

### Códigos de Error

| Código | Descripción | Solución |
|--------|-------------|----------|
| **400** | BadRequest — validación de input fallida | Verifica los tipos y rangos del contrato |
| **401** | Unauthorized — token falta o inválido | Obtén un token válido del auth provider |
| **404** | Not Found — recurso no existe o no te pertenece | Verifica el ID o si el registro es tuyo |
| **500** | Internal Server Error — error del backend | Reintenta o reporta al equipo backend |

### Respuesta de Error (WellnessException)

Cuando la API devuelve **404 Not Found**, puede ser por:
- Recurso no existe (ID inválido)
- Recurso existe pero no te pertenece (seguridad: no leaking de datos)
- Usuario no existe (relacionado con un error anterior)

El body será vacío o un error genérico. **No asumas detalles específicos.**

### Validación en Frontend

Siempre valida en frontend antes de enviar:

```typescript
// Ejemplo para sueño
if (durationMinutes < 1 || durationMinutes > 720) {
  // Error: duración fuera de rango
}

if (note && note.length > 500) {
  // Error: nota muy larga
}
```

---

## 💡 Ejemplos de Uso

### 1. Registrar Sueño

```typescript
const token = "tu_bearer_token";

const sleep = {
  date: "2026-06-26",
  durationMinutes: 480,
  quality: "Good",
  note: "Dormí bien"
};

const response = await fetch("http://localhost:5000/api/sleep", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(sleep)
});

const data = await response.json();
console.log(data.id); // ID del nuevo registro
```

### 2. Obtener Historial de Hidratación

```typescript
const token = "tu_bearer_token";
const page = 1;
const pageSize = 10;

const response = await fetch(
  `http://localhost:5000/api/hydration?page=${page}&pageSize=${pageSize}`,
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();
console.log(`Total registros: ${data.totalCount}`);
console.log(`Página ${data.page} de ${Math.ceil(data.totalCount / data.pageSize)}`);
data.items.forEach(item => {
  console.log(`${item.date}: ${item.amountMl}ml de ${item.beverageType}`);
});
```

### 3. Registrar Sesión de Meditación con Guía

```typescript
const token = "tu_bearer_token";

const session = {
  date: "2026-06-26",
  durationMinutes: 10,
  technique: "Breathing",
  guideId: "a1f1e1d1-0001-4001-b001-0c1d2e3f4a5b", // Del catálogo
  moodBefore: "Bad",
  moodAfter: "Good",
  note: "Me ayudó mucho"
};

const response = await fetch("http://localhost:5000/api/meditation", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify(session)
});

const data = await response.json();
console.log(`Sesión registrada: ${data.id}`);
```

### 4. Obtener Catálogo de Guías y Filtrar

```typescript
const token = "tu_bearer_token";

const response = await fetch(
  "http://localhost:5000/api/meditation/guides?page=1&pageSize=50",
  {
    headers: { "Authorization": `Bearer ${token}` }
  }
);

const data = await response.json();

// Filtrar por técnica (en frontend)
const mindfulnessGuides = data.items.filter(g => g.technique === "Mindfulness");

mindfulnessGuides.forEach(guide => {
  console.log(`${guide.title} (${guide.durationMinutes} min)`);
  console.log(`Audio: ${guide.audioUrl}`);
});
```

### 5. Eliminar un Registro

```typescript
const token = "tu_bearer_token";
const recordId = "a1b2c3d4-e5f6-47c8-9d0e-1a2b3c4d5e6f";

const response = await fetch(
  `http://localhost:5000/api/sleep/${recordId}`,
  {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  }
);

if (response.status === 204) {
  console.log("Registro eliminado");
} else if (response.status === 404) {
  console.log("Registro no encontrado o no te pertenece");
}
```

---

## 📱 Recomendaciones de Implementación Frontend

### 1. **Gestión de Estado**
- Mantén un estado local con el historial paginado de cada feature
- Cachea el catálogo de guías (no cambia frecuentemente)
- Invalida el caché cuando haces un POST/DELETE

### 2. **Formularios**
- Pre-valida rangos antes de enviar (ej: durationMinutes entre 1 y 720)
- Muestra max length en campos de texto (note: máx 500)
- Usa date inputs nativos del navegador para `date`

### 3. **Listados**
- Implementa paginación con botones Anterior/Siguiente
- Calcula total de páginas: `Math.ceil(totalCount / pageSize)`
- Ordena por fecha descendente (el backend ya lo hace)

### 4. **UX**
- Muestra loading spinners mientras se carga
- Muestra un empty state si el usuario no tiene registros (`items.length === 0`)
- Implementa soft delete (ej: swipe left para eliminar)
- Confirma antes de eliminar ("¿Eliminar este registro?")

### 5. **Errores**
- Captura errores de red y muestra mensajes amigables
- Para 404, no muestres detalles técnicos (seguridad)
- Reintenta automáticamente en caso de 5xx con backoff exponencial

---

## 🔗 Endpoints Resumen

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| **POST** | `/api/sleep` | Registrar sueño |
| **GET** | `/api/sleep` | Listar sueño paginado |
| **GET** | `/api/sleep/{id}` | Detalle de sueño |
| **DELETE** | `/api/sleep/{id}` | Eliminar sueño |
| **POST** | `/api/hydration` | Registrar hidratación |
| **GET** | `/api/hydration` | Listar hidratación paginada |
| **GET** | `/api/hydration/{id}` | Detalle de hidratación |
| **DELETE** | `/api/hydration/{id}` | Eliminar hidratación |
| **POST** | `/api/mood` | Registrar ánimo |
| **GET** | `/api/mood` | Listar ánimo paginado |
| **GET** | `/api/mood/{id}` | Detalle de ánimo |
| **DELETE** | `/api/mood/{id}` | Eliminar ánimo |
| **GET** | `/api/meditation/guides` | Catálogo de guías |
| **GET** | `/api/meditation/guides/{id}` | Detalle de guía |
| **POST** | `/api/meditation` | Registrar sesión |
| **GET** | `/api/meditation` | Listar sesiones paginadas |
| **GET** | `/api/meditation/{id}` | Detalle de sesión |
| **DELETE** | `/api/meditation/{id}` | Eliminar sesión |

---

## 📞 Preguntas Frecuentes

### ¿Puedo actualizar un registro?
No, por ahora solo DELETE + create nuevo. La opción UPDATE se agrega después si es necesario.

### ¿Hay un endpoint para estadísticas (ej: promedio de sueño)?
No en esta fase. Los datos son brutos; la lógica de agregación es frontend.

### ¿El `userId` en el DTO viene del token?
Sí. El backend extrae el usuario autenticado del token y genera el `userId` automáticamente.

### ¿Puedo registrar datos de hoy en el pasado?
Sí, pero `date` debe ser una fecha válida. El backend no valida si es futura o pasada.

### ¿Qué pasa si elimino una sesión vinculada a una guía?
La sesión se elimina. La guía no se ve afectada (cada uno es independiente).

---

**Versión del Contrato:** 1.0  
**Fecha:** 2026-06-26  
**Backend Base URL:** `http://localhost:5000` (desarrollo) / `https://api.example.com` (producción)
