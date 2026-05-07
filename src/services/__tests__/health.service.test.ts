import apiClient from '../../api/client';
import { getInjuries, getMedicalConditions, submitHealthProfile } from '../health.service';

jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('health.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener lesiones correctamente', async () => {
    const mockInjuries = [{ id: '1', name: 'Rodilla' }];
    (apiClient.get as jest.Mock).mockResolvedValue({ data: mockInjuries });

    const result = await getInjuries(mockToken);
    expect(result).toEqual(mockInjuries);
  });

  it('debe enviar el perfil de salud correctamente', async () => {
    const payload = {
      injuryIds: ['1'],
      medicalConditionIds: ['2'],
    };
    (apiClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

    const result = await submitHealthProfile(payload, mockToken);
    expect(apiClient.post).toHaveBeenCalledWith('/api/Onboarding/module/health', payload, expect.anything());
    expect(result).toEqual({ success: true });
  });
});
