import apiClient from '../../api/client';
import { getEquipments, getSubGoals, submitFitnessProfile } from '../fitness.service';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('fitness.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener equipos correctamente', async () => {
    const mockEquipments = [{ id: '1', name: 'Mancuerna', imageUrl: '' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockEquipments });

    const result = await getEquipments(mockToken);
    expect(result).toEqual(mockEquipments);
  });

  it('debe enviar el perfil de fitness correctamente', async () => {
    const payload = {
      experienceLevel: 'beginner',
      trainingHistory: 'sedentary',
      subGoals: ['g1'],
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await submitFitnessProfile(payload, mockToken);
    expect(apiClient.post).toHaveBeenCalledWith('/api/Onboarding/module/fitness', payload, expect.anything());
    expect(result).toEqual({ success: true });
  });
});
