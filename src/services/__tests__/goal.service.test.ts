import apiClient from '../../api/client';
import { getGlobalGoals } from '../goal.service';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

describe('goal.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener los objetivos globales correctamente', async () => {
    const mockGoals = [
      { id: '1', name: 'Objetivo 1' },
      { id: '2', name: 'Objetivo 2' },
    ];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockGoals });

    const result = await getGlobalGoals(mockToken);

    expect(apiClient.get).toHaveBeenCalledWith('/api/Goals/global-goals', {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    expect(result).toEqual(mockGoals);
  });

  it('debe propagar el error si la API falla', async () => {
    const error = new Error('Network Error');
    (apiClient.get as jest.Mock).mockRejectedValue(error);

    await expect(getGlobalGoals(mockToken)).rejects.toThrow('Network Error');
  });
});
