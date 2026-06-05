import apiClient from '../../api/client';
import { getFoodAllergies, getFoodByBarcode, submitNutritionProfile } from '../nutrition.service';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('nutrition.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener alergias correctamente', async () => {
    const mockAllergies = [{ id: '1', name: 'Maní' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockAllergies });

    const result = await getFoodAllergies(mockToken);
    expect(result).toEqual(mockAllergies);
  });

  it('debe enviar el perfil de nutrición correctamente', async () => {
    const payload = {
      allergyIds: ['1'],
      dietaryPreferenceIds: ['2'],
      subGoalId: '3',
      activityLevel: 'Moderate' as const,
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await submitNutritionProfile(payload, mockToken);
    expect(apiClient.post).toHaveBeenCalledWith('/api/Onboarding/module/nutrition', payload, expect.anything());
    expect(result).toEqual({ success: true });
  });

  it('debe obtener un alimento por código de barras con respuesta envuelta', async () => {
    const mockFood = {
      id: 'food-1',
      barcode: '7791234567890',
      productName: 'Yogur',
      brand: 'Marca',
      energyKcal100g: 80,
      fat100g: 2,
      saturatedFat100g: 1,
      carbohydrates100g: 10,
      sugars100g: 8,
      fiber100g: null,
      proteins100g: 5,
      salt100g: 0.1,
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: mockFood } });

    const result = await getFoodByBarcode('7791234567890', mockToken);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/nutrition/foods/barcode/7791234567890',
      expect.objectContaining({
        headers: { Authorization: `Bearer ${mockToken}` },
      }),
    );
    expect(result).toEqual(mockFood);
  });
});
