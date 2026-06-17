import apiClient from '../../api/client';
import {
  getBodyEvolutionDashboard,
  getInjuries,
  submitHealthProfile,
} from '../health.service';

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

  it('debe obtener el dashboard de evolución física con respuesta plana', async () => {
    const dashboard = {
      fromDate: null,
      toDate: null,
      metrics: [
        {
          metric: 'weightKg',
          label: 'Peso',
          unit: 'kg',
          latestValue: 76,
          absoluteChange: -4,
          percentageChange: -5,
          points: [
            { date: '2026-01-01', value: 80 },
            { date: '2026-01-15', value: 76 },
          ],
        },
      ],
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: dashboard });

    const result = await getBodyEvolutionDashboard(mockToken);

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/health/body-measurements/dashboard',
      {
        params: {},
        headers: { Authorization: `Bearer ${mockToken}` },
      },
    );
    expect(result).toEqual(dashboard);
  });

  it('debe obtener el dashboard de evolución física con respuesta envuelta en data', async () => {
    const dashboard = {
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
      metrics: [
        {
          metric: 'waistCm',
          label: 'Cintura',
          unit: 'cm',
          latestValue: 82,
          absoluteChange: -3,
          percentageChange: -3.5,
          points: [{ date: '2026-01-15', value: 82 }],
        },
      ],
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: dashboard } });

    const result = await getBodyEvolutionDashboard(mockToken, {
      fromDate: '2026-01-01',
      toDate: '2026-01-31',
    });

    expect(apiClient.get).toHaveBeenCalledWith(
      '/api/health/body-measurements/dashboard',
      {
        params: { fromDate: '2026-01-01', toDate: '2026-01-31' },
        headers: { Authorization: `Bearer ${mockToken}` },
      },
    );
    expect(result).toEqual(dashboard);
  });

  it('debe soportar métricas vacías en el dashboard de evolución física', async () => {
    const dashboard = {
      fromDate: null,
      toDate: null,
      metrics: [
        {
          metric: 'neckCm',
          label: 'Cuello',
          unit: 'cm',
          latestValue: null,
          absoluteChange: null,
          percentageChange: null,
          points: [],
        },
      ],
    };
    (apiClient.get as jest.Mock).mockResolvedValue({ data: dashboard });

    const result = await getBodyEvolutionDashboard(mockToken);

    expect(result.metrics[0].points).toEqual([]);
    expect(result.metrics[0].latestValue).toBeNull();
  });
});
