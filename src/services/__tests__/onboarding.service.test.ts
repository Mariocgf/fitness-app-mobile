import apiClient from '../../api/client';
import { acceptTerms, getOnboardingStatus } from '../onboarding.service';

// Mock de apiClient
jest.mock('../../api/client', () => ({
  get: jest.fn(),
  post: jest.fn(),
}));

describe('onboarding.service', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOnboardingStatus', () => {
    it('debe obtener el estado correctamente', async () => {
      const mockResponse = { data: { status: 'AWAITING_TERMS_ACCEPTANCE' } };
      (apiClient.get as jest.Mock).mockResolvedValue(mockResponse);

      const result = await getOnboardingStatus(mockToken);

      expect(apiClient.get).toHaveBeenCalledWith('/api/Onboarding/status', {
        headers: { Authorization: `Bearer ${mockToken}` },
      });
      expect(result.status).toBe('AWAITING_TERMS_ACCEPTANCE');
    });
  });

  describe('acceptTerms', () => {
    it('debe devolver true si el status es 204', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 204 });

      const result = await acceptTerms(mockToken);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/api/Users/accept-terms',
        {},
        { headers: { Authorization: `Bearer ${mockToken}` } }
      );
      expect(result).toBe(true);
    });

    it('debe devolver false si el status no es 204', async () => {
      (apiClient.post as jest.Mock).mockResolvedValue({ status: 200 });

      const result = await acceptTerms(mockToken);
      expect(result).toBe(false);
    });
  });
});
