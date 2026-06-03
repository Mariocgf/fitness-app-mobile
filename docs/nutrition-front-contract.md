# Contrato front — Nutrición Wellium

Este documento resume lo necesario para implementar la pantalla de Nutrición y el registro de alimentos en front usando el backend actual. Las imágenes de referencia que acompañan este contrato son:

- `C:/Users/mario/Downloads/Wellium/nutrition-view.png`
- `C:/Users/mario/Downloads/Wellium/nutrition-view-1.png`
- `C:/Users/mario/Downloads/Wellium/food-register.png`
- `C:/Users/mario/Downloads/Wellium/food-register-1.png`
- `C:/Users/mario/Downloads/Wellium/food-register-2.png`

> Alcance actual: pantalla de Nutrición y registro de alimentos. La pantalla de Salud/medidas corporales queda para otra fase.

## Ruta rápida de implementación

1. Al entrar a Nutrición, cargar en paralelo:
   - `GET /api/nutrition/profile`
   - `GET /api/nutrition/targets?from=YYYY-MM-DD&to=YYYY-MM-DD`
   - `GET /api/nutrition/days/YYYY-MM-DD`
2. Renderizar el anillo principal con los totales del día contra el target del día.
3. Renderizar comidas desde `day.meals`.
4. Al tocar una comida o `Registrar alimentos`, abrir la vista de registro para esa comida.
5. Buscar alimentos con `GET /api/nutrition/foods?query=...` o escanear con `GET /api/nutrition/foods/barcode/{code}`.
6. Agregar alimentos con `POST /api/nutrition/days/{date}/meals/{mealType}/items`.
7. Refrescar el día con la respuesta del POST, no recalcular estado local manualmente.

## Autenticación

Todos los endpoints de Nutrición nuevos requieren usuario autenticado, salvo catálogos legacy indicados como públicos en el back.

El front debe enviar el token habitual en `Authorization: Bearer <token>`.

## Enums que usa el front

### MealType

Usar estos valores en path params:

```ts
type MealType = 'Breakfast' | 'Lunch' | 'Snack' | 'Dinner';
```

Mapeo visual sugerido:

| UI | Backend |
|----|---------|
| Desayuno | `Breakfast` |
| Almuerzo | `Lunch` |
| Merienda | `Snack` |
| Cena | `Dinner` |

### MealStatus

```ts
type MealStatus = 'Pending' | 'Completed' | 'Skipped';
```

## Pantalla principal de Nutrición

### Endpoint: perfil nutricional

```http
GET /api/nutrition/profile
```

Respuesta:

```ts
type NutritionProfileDto = {
  userId: string;
  selectedSubGoalId: string | null;
  activityLevel: string;
  activityLevelSource: string;
  calculationLevel: string;
  bmrKcal: number;
  tdeeKcal: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  requiresReconfiguration: boolean;
};
```

Uso en front:

- Si `requiresReconfiguration === true`, mostrar CTA para reconfigurar nutrición antes de confiar en targets.
- No mostrar BMR/TDEE en la pantalla principal salvo que haya una vista de detalle.

### Endpoint: targets por fecha

```http
GET /api/nutrition/targets?from=2026-06-03&to=2026-06-03
```

Respuesta:

```ts
type NutritionTargetDto = {
  date: string; // YYYY-MM-DD
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  calculationLevel: string;
  hasPlannedTraining: boolean;
};
```

Uso en el mockup:

- Centro del anillo: `day.totalCalories`.
- Targets debajo:
  - proteína: `day.totalProteinGrams / target.proteinGrams`
  - carbohidratos: `day.totalCarbsGrams / target.carbsGrams`
  - grasa: `day.totalFatGrams / target.fatGrams`

> Importante: el front NO debe recalcular objetivos. Los objetivos vienen del backend.

### Endpoint: día nutricional

```http
GET /api/nutrition/days/2026-06-03
```

Respuesta:

```ts
type NutritionDayDto = {
  date: string;
  status: string;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  meals: NutritionMealDto[];
};

type NutritionMealDto = {
  id: string;
  mealType: MealType;
  status: MealStatus;
  items: ConsumedFoodItemDto[];
};

type ConsumedFoodItemDto = {
  id: string;
  name: string;
  barcode: string | null;
  gramsConsumed: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};
```

Uso en el mockup:

- Cards de comida: sumar `items[].calories` o usar el total por meal calculado en front solo para visualización.
- El estado real del día viene en `status`.
- Si una comida no existe o no tiene items, mostrar `0 kcal` o estado vacío.

## Menú flotante del botón central

Mockup: `nutrition-view-1.png`.

Acciones:

| Acción UI | Implementación actual |
|-----------|------------------------|
| Registrar alimentos | Abrir vista `Registrar alimentos` con comida seleccionable. |
| Escanear comida | Abrir scanner y consultar `GET /api/nutrition/foods/barcode/{code}`. |
| Generar dieta | No implementado en backend actual. Mostrar disabled/ocultar o dejar como futura fase. |

## Vista Registrar alimentos

Mockup: `food-register.png`.

Estado necesario:

```ts
type FoodRegisterState = {
  date: string; // YYYY-MM-DD
  selectedMealType: MealType;
  day: NutritionDayDto;
  target: NutritionTargetDto;
};
```

Header:

- Título: `Registrar alimentos`.
- Kcal: total de la comida seleccionada, no total del día.
- Tabs: Desayuno, Almuerzo, Merienda, Cena.

Card de alimento registrado:

- Nombre: `item.name`.
- kcal: `item.calories`.
- gramos: `item.gramsConsumed`.
- macros:
  - `item.proteinGrams`
  - `item.carbsGrams`
  - `item.fatGrams`

> Backend actual no expone marca en `ConsumedFoodItemDto`. Si la UI necesita marca en alimentos ya registrados, hay que extender el DTO.

## Bottom sheet: buscar alimento

Mockup: `food-register-1.png`.

### Endpoint: buscar catálogo

```http
GET /api/nutrition/foods?query=sandwich&page=1&pageSize=20
```

Respuesta:

```ts
type FoodCatalogItemDto = {
  id: string;
  barcode: string;
  productName: string;
  brand: string | null;
  energyKcal100g: number;
  fat100g: number;
  saturatedFat100g: number | null;
  carbohydrates100g: number;
  sugars100g: number | null;
  fiber100g: number | null;
  proteins100g: number;
  salt100g: number | null;
};
```

Render por resultado:

- Título: `productName`.
- Marca: `brand`.
- kcal chip: `energyKcal100g` por 100g.
- macros por 100g:
  - `proteins100g`
  - `carbohydrates100g`
  - `fat100g`

### Endpoint: buscar por barcode

```http
GET /api/nutrition/foods/barcode/38000184949
```

- `200`: devuelve `FoodCatalogItemDto`.
- `404`: alimento no encontrado.

El `code` del documento Mongo es el código de barra escaneable.

## Bottom sheet: detalle alimento

Mockup: `food-register-2.png`.

El detalle puede salir del mismo `FoodCatalogItemDto` seleccionado.

Mostrar:

- `productName`
- `brand`
- base `100g`
- `energyKcal100g`
- `proteins100g`
- `carbohydrates100g`
- `fat100g`
- `saturatedFat100g`
- `fiber100g`
- `salt100g`

Para agregar, el usuario debe poder confirmar o ajustar gramos.

### Endpoint: agregar alimento a comida

```http
POST /api/nutrition/days/2026-06-03/meals/Snack/items
Content-Type: application/json
```

Body desde catálogo:

```json
{
  "barcode": "38000184949",
  "name": "Crema y Cebolla",
  "brand": "Pringles",
  "gramsConsumed": 100,
  "caloriesPer100g": 544,
  "proteinPer100g": 4.8,
  "carbsPer100g": 60,
  "fatPer100g": 32,
  "saturatedFatPer100g": 8.8,
  "sugarPer100g": 1.6,
  "fiberPer100g": 3.6,
  "saltPer100g": 1.01
}
```

Respuesta: `NutritionDayDto` actualizado.

Regla front:

- Después de agregar, reemplazar el estado del día con la respuesta.
- No recalcular macros del día a mano salvo para preview antes de confirmar.

## Onboarding de Nutrición

El front debe agregar la parte faltante siguiendo estilos/componentes existentes del onboarding.

### Catálogos existentes

```http
GET /api/nutrition/food-allergies
GET /api/nutrition/type-of-diets
```

### Configurar módulo nutrición

```http
POST /api/onboarding/module/nutrition
Content-Type: application/json
```

Body:

```ts
type ConfigNutritionModuleDto = {
  allergyIds: string[];
  dietaryPreferenceIds: string[];
  subGoalId: string;
  activityLevel?: string | null;
};
```

Valores sugeridos para `activityLevel`:

```ts
type ActivityLevel =
  | 'Sedentary'
  | 'Light'
  | 'Moderate'
  | 'Active'
  | 'VeryActive';
```

> Los objetivos/subobjetivos vienen de DB. El front debe reutilizar el flujo ya existente para elegir objetivo/subobjetivo y mandar `subGoalId`; no hardcodear objetivos nutricionales.

## Estados mínimos que el front debe cubrir

- Sin perfil nutricional o `requiresReconfiguration`: mostrar CTA de configuración.
- Sin target para el día: mostrar skeleton/error recuperable.
- Sin comidas registradas: cards con 0 kcal y CTA para agregar.
- Barcode no encontrado: permitir búsqueda manual.
- `Generar dieta`: ocultar o bloquear porque no hay endpoint backend en esta fase.

## Fuera de alcance por ahora

- Pantalla de Salud y medidas corporales.
- Tests frontend.
- Dieta generada automáticamente.
- Rebalance/notices visuales.
- Edición/eliminación de alimento ya agregado: backend actual todavía no expone endpoint dedicado.
