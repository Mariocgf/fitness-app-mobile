import {
  AddConsumedFoodItemPayload,
  FoodCatalogItemDto,
} from '../types/nutrition';

/**
 * Convierte un alimento del catálogo en el payload que espera el backend
 * para registrar consumo. El cálculo nutricional final queda en backend.
 */
export const mapCatalogFoodToAddPayload = (
  food: FoodCatalogItemDto,
  gramsConsumed: number,
): AddConsumedFoodItemPayload => ({
  barcode: food.barcode,
  name: food.productName,
  brand: food.brand,
  gramsConsumed,
  caloriesPer100g: food.energyKcal100g,
  proteinPer100g: food.proteins100g,
  carbsPer100g: food.carbohydrates100g,
  fatPer100g: food.fat100g,
  saturatedFatPer100g: food.saturatedFat100g,
  sugarPer100g: food.sugars100g,
  fiberPer100g: food.fiber100g,
  saltPer100g: food.salt100g,
});
