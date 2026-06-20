# API de Generación de Rutina Alimenticia — Documentación Frontend

## Resumen

El backend proporciona dos endpoints para generar una rutina alimenticia semanal personalizada usando IA:

1. **Generar rutina** (`POST /api/nutrition-routine/generate`) — devuelve nombre + semana + comidas con descripción
2. **Detalle de comida** (`GET /api/nutrition-routine/meals/{mealId}`) — devuelve comida completa con macros y receta

---

## Requisitos Previos

El usuario debe tener:
- ✅ **Módulo Nutrición ACTIVO** — si no, recibirá `409 Conflict`
- ✅ **Módulo Nutrición CONFIGURADO** (onboarding completado) — si no, recibirá `409 Conflict`
- ✅ **Targets nutricionales definidos** (calorías, proteínas, carbos, grasas) — si no, recibirá `404`
- ✅ **Token JWT válido** en header `Authorization: Bearer {token}` — sin esto, recibirá `401`

---

## Paso 1 — Generar Rutina

### Request

```http
POST /api/nutrition-routine/generate
Authorization: Bearer {jwt_token}
```

**Parámetros:** ninguno (el backend lee el usuario del JWT)

**Headers:**
- `Authorization: Bearer {token}` (requerido)
- `Content-Type: application/json` (automático)

### Response — Success (200 OK)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Rutina Balanceada con Proteína Alta",
  "createdAt": "2026-06-17T20:35:00Z",
  "days": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "day": "Monday",
      "meals": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440002",
          "type": "Breakfast",
          "name": "Avena con Proteína",
          "description": "Avena integral con polvo de proteína de vainilla y plátano"
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440003",
          "type": "Lunch",
          "name": "Pechuga a la Plancha",
          "description": "Pechuga de pollo marinada con limón, acompañada de arroz integral y brócoli"
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440004",
          "type": "AfternoonSnack",
          "name": "Yogur Griego",
          "description": "Yogur griego natural 0% con nueces y miel"
        },
        {
          "id": "770e8400-e29b-41d4-a716-446655440005",
          "type": "Dinner",
          "name": "Salmón al Horno",
          "description": "Salmón fresco al horno con verduras asadas (zanahoria, calabacín, pimiento)"
        }
      ]
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440006",
      "day": "Tuesday",
      "meals": [...]
    },
    ...
  ]
}
```

**Estructura:**
- `id` (Guid) — ID de la rutina generada (usar para tracking/auditoría)
- `name` (string) — nombre descriptivo de la rutina
- `createdAt` (ISO 8601) — timestamp de generación
- `days` (array) — 7 objetos, uno por cada día de la semana
  - `id` (Guid) — ID del día (no se necesita para el paso 2)
  - `day` (string) — "Monday", "Tuesday", ..., "Sunday"
  - `meals` (array) — 4 comidas:
    - `id` (Guid) — **GUARDAR ESTE ID** — necesario para `GET /api/nutrition-routine/meals/{mealId}`
    - `type` (string) — "Breakfast", "Lunch", "AfternoonSnack" (snack), "Dinner"
    - `name` (string) — nombre corto de la comida
    - `description` (string) — descripción breve

### Response — Errores

| Código | Descripción | Acción |
|--------|-------------|--------|
| **400** | Argumento inválido | Revisar request (no debería ocurrir si sigues este doc) |
| **401** | No autorizado | JWT inválido o expirado — pedir login |
| **404** | Usuario / Perfil no encontrado | Usuario no existe o no tiene perfil nutricional |
| **409** | Módulo no activo o no configurado | Usuario no activó Nutrición o no completó setup — redirigir a onboarding |

---

## Paso 2 — Detalle de Comida

### Request

```http
GET /api/nutrition-routine/meals/{mealId}
Authorization: Bearer {jwt_token}
```

**Parámetros de URL:**
- `mealId` (Guid) — ID de la comida guardado del paso 1

**Headers:**
- `Authorization: Bearer {token}` (requerido)

### Response — Success (200 OK)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "type": "Breakfast",
  "name": "Avena con Proteína",
  "description": "Avena integral con polvo de proteína de vainilla y plátano",
  "calories": "350",
  "proteins": "25",
  "carbs": "45",
  "fats": "8",
  "recipe": {
    "instructions": "1. Calentar 1 taza de agua. 2. Agregar 50g de avena y cocinar 5 min. 3. Mezclar con 30g de proteína en polvo. 4. Servir con plátano picado.",
    "ingredients": [
      {
        "name": "Avena integral",
        "amount": "50g"
      },
      {
        "name": "Proteína en polvo (vainilla)",
        "amount": "30g"
      },
      {
        "name": "Plátano",
        "amount": "1 unidad"
      },
      {
        "name": "Agua",
        "amount": "1 taza"
      }
    ]
  }
}
```

**Estructura:**
- `id`, `type`, `name`, `description` — igual que en el paso 1
- `calories`, `proteins`, `carbs`, `fats` (strings) — macros aproximados en texto
  - ⚠️ **Nota:** Pueden venir como "350" o números; asume siempre string y parsea si necesitas número
- `recipe` (objeto):
  - `instructions` (string) — pasos para preparar
  - `ingredients` (array):
    - `name` (string) — nombre del ingrediente
    - `amount` (string) — cantidad (ej: "50g", "1 taza", "1 unidad")

### Response — Errores

| Código | Descripción | Acción |
|--------|-------------|--------|
| **401** | No autorizado | JWT inválido |
| **404** | Comida no encontrada o no pertenece al usuario | El `mealId` no existe o pertenece a otro usuario |

---

## Flujo Típico Frontend

### 1️⃣ Usuario pide "Generar Rutina"

```javascript
const response = await fetch('/api/nutrition-routine/generate', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

if (!response.ok) {
  if (response.status === 409) {
    // Módulo no activo/configurado
    alert('Completa la configuración del módulo Nutrición primero');
  } else if (response.status === 404) {
    alert('Perfil nutricional no encontrado');
  }
  return;
}

const routine = await response.json();
// routine.days es un array de 7 días
// Cada day.meals es un array de 4 comidas
```

### 2️⃣ Frontend lista la rutina

```javascript
// Mostrar: Nombre de la rutina
// Mostrar: 7 cards (una por cada día)
//   - Card muestra el día (Monday, Tuesday...)
//   - Dentro, 4 filas (breakfast, lunch, snack, dinner)
//   - Cada fila: type | name | description | botón "Ver receta"

routine.days.forEach(day => {
  console.log(`${day.day}:`);
  day.meals.forEach(meal => {
    console.log(`  ${meal.type}: ${meal.name} — ${meal.description}`);
    // Guardar meal.id para cuando usuario haga click
  });
});
```

### 3️⃣ Usuario hace click en "Ver receta" / "Detalles"

```javascript
// Usuario seleccionó una comida (guardaste el mealId)
const mealId = "770e8400-e29b-41d4-a716-446655440002";

const response = await fetch(`/api/nutrition-routine/meals/${mealId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

if (!response.ok) {
  alert('Comida no encontrada');
  return;
}

const mealDetail = await response.json();
// Mostrar:
//   - name, description, macros (calories, proteins, carbs, fats)
//   - Recipe:
//     - Lista de ingredientes (name + amount)
//     - Instructions paso a paso
```

---

## Notas Técnicas

### Macros — Tolerancia a Tipos

⚠️ Los campos `calories`, `proteins`, `carbs`, `fats` se devuelven como **strings**, no números.

Esto ocurre porque la IA puede devolver:
- `"350"` (texto que parece número)
- `"350 kcal"` (texto con unidad)
- `"~350"` (aproximado)

**Recomendación frontend:**
```javascript
// Si necesitas número puro:
const caloriesNum = parseInt(meal.calories.replace(/[^\d]/g, ''), 10) || 0;

// Si solo necesitas mostrar en UI:
<span>{meal.calories}</span>  // Mostrar as-is
```

### Días de la Semana

El formato es **inglés en mayúscula**:
- "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"

Si necesitas mostrar en español, mapea:
```javascript
const dayNames = {
  Monday: 'Lunes',
  Tuesday: 'Martes',
  Wednesday: 'Miércoles',
  Thursday: 'Jueves',
  Friday: 'Viernes',
  Saturday: 'Sábado',
  Sunday: 'Domingo'
};
```

### Tipos de Comida (MealType)

Los tipos se devuelven como strings. Valores válidos:
- `"Breakfast"` — desayuno
- `"Lunch"` — almuerzo / comida
- `"AfternoonSnack"` — merienda / snack
- `"Dinner"` — cena

### Guardado de IDs

**Importante:** Guarda los `meal.id` del paso 1 para poder hacer el `GET` del paso 2.

Opciones:
1. **En estado del componente (React/Vue):**
   ```javascript
   const [routine, setRoutine] = useState(null);
   // routine.days[].meals[].id está siempre disponible
   ```

2. **En localStorage (si quieres persistencia entre navegaciones):**
   ```javascript
   localStorage.setItem('currentRoutine', JSON.stringify(routine));
   ```

---

## Ejemplos cURL

### Generar rutina

```bash
curl -X POST http://localhost:5000/api/nutrition-routine/generate \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json"
```

### Obtener detalle de comida

```bash
curl -X GET http://localhost:5000/api/nutrition-routine/meals/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Manejo de Errores Recomendado

```javascript
async function generateRoutine(token) {
  try {
    const response = await fetch('/api/nutrition-routine/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      // Token expirado
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    if (response.status === 409) {
      // Módulo no configurado
      throw new Error('Debes completar la configuración del módulo Nutrición primero.');
    }

    if (response.status === 404) {
      throw new Error('Tu perfil nutricional no está configurado.');
    }

    if (!response.ok) {
      throw new Error(`Error inesperado: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al generar rutina:', error);
    // Mostrar error al usuario
    alert(error.message);
    throw error;
  }
}

async function getMealDetail(token, mealId) {
  try {
    const response = await fetch(`/api/nutrition-routine/meals/${mealId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      throw new Error('Sesión expirada.');
    }

    if (response.status === 404) {
      throw new Error('Comida no encontrada.');
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al obtener detalle:', error);
    alert(error.message);
    throw error;
  }
}
```

---

## FAQ

**P: ¿Puedo generar múltiples rutinas?**
R: Sí. Cada vez que llames a `POST /generate`, la rutina anterior se desactiva y se guarda una nueva como activa. Las viejas quedan en la BD sin acceso desde esta API.

**P: ¿Los IDs de comida son permanentes?**
R: Mientras no generes una nueva rutina, sí. Si generas una nueva, los IDs antiguos ya no funcionan (pertenecen a una rutina desactiva).

**P: ¿Qué pasa si llamo `GET /meals/{id}` con un ID que no me pertenece?**
R: Recibirás `404`. El backend valida ownership.

**P: ¿Hay límite de llamadas?**
R: No hay rate limiting específico en esta feature. Usa responsabilemente.

**P: ¿Se puede obtener una rutina generada en el pasado?**
R: Desde esta API, no. Esta API solo devuelve la rutina **activa**. Las antiguas se guardan en BD pero no hay endpoint para recuperarlas (se puede agregar en el futuro).

