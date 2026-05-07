import apiClient from '../../api/client';
import { getActiveModules } from '../module.service';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
}));

describe('module.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener los módulos activos del usuario correctamente', async () => {
    const mockActiveModules = [{ name: 'Fitness' }, { name: 'Nutrition' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockActiveModules });

    const result = await getActiveModules(mockToken);

    expect(apiClient.get).toHaveBeenCalledWith('/api/Modules/user/active', {
      headers: { Authorization: `Bearer ${mockToken}` },
    });
    expect(result).toEqual(mockActiveModules);
  });
});
