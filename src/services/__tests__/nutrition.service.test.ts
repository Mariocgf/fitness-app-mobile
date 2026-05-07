import apiClient from '../../api/client';
import { getFoodAllergies, getDietaryPreferences, submitNutritionProfile } from '../nutrition.service';

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
      subGoals: ['3'],
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await submitNutritionProfile(payload, mockToken);
    expect(apiClient.post).toHaveBeenCalledWith('/api/Onboarding/module/nutrition', payload, expect.anything());
    expect(result).toEqual({ success: true });
  });
});
