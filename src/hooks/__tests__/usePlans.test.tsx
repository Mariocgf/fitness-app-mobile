import { renderHook, waitFor } from '@testing-library/react-native';

import { getPurchaseProvider } from '@/src/services/purchase';
import { getSubscriptionPlans } from '@/src/services/subscription.service';
import { SubscriptionPlanDto } from '@/src/types/subscription';

import { usePlans } from '../usePlans';

jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('token-de-prueba'),
    isSignedIn: true,
  }),
}));

jest.mock('@/src/services/subscription.service', () => ({
  getSubscriptionPlans: jest.fn(),
}));

jest.mock('@/src/services/purchase', () => ({
  getPurchaseProvider: jest.fn(),
}));

const mockedGetPlans = getSubscriptionPlans as jest.Mock;
const mockedGetProvider = getPurchaseProvider as jest.Mock;

const freePlan: SubscriptionPlanDto = {
  tier: 'Free',
  name: 'Free',
  price: 0,
  currency: 'USD',
  monthlyCredits: 0,
  billingInterval: 'Monthly',
  productId: null,
  unlockedModules: [],
};

const paidPlan: SubscriptionPlanDto = {
  tier: 'Full',
  name: 'Full',
  price: 49.9,
  currency: 'USD',
  monthlyCredits: 100,
  billingInterval: 'Monthly',
  productId: 'full_monthly',
  unlockedModules: ['fitness', 'nutrition'],
};

const mockGetProducts = (impl: jest.Mock) => {
  mockedGetProvider.mockReturnValue({ getProducts: impl, purchase: jest.fn() });
};

describe('usePlans — degradación cuando el store no responde', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetPlans.mockResolvedValue([freePlan, paidPlan]);
  });

  it('sigue mostrando los planes con el precio de referencia si el store falla', async () => {
    // Reproduce el bug de producción: `/admin/catalog` bloqueado por CORS.
    mockGetProducts(jest.fn().mockRejectedValue(new Error('Network Error')));

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // El paywall NO se cae: los planes del backend ya estaban en la mano.
    expect(result.current.error).toBeNull();
    expect(result.current.plans).toHaveLength(2);
    expect(result.current.plans[0].localizedPrice).toBe('Gratis');
    expect(result.current.plans[1].localizedPrice).toBe('$49.90');
  });

  it('usa el precio localizado del store cuando está disponible', async () => {
    mockGetProducts(
      jest.fn().mockResolvedValue([
        { productId: 'full_monthly', localizedPrice: '$59.90', currency: 'USD', amount: 59.9 },
      ]),
    );

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // El store manda sobre el precio de referencia (regla Apple/Google).
    expect(result.current.plans[1].localizedPrice).toBe('$59.90');
    expect(result.current.plans[1].amount).toBe(59.9);
  });

  it('sí reporta error cuando el que falla es el backend', async () => {
    // El store es un adorno; los planes NO. Si no hay planes, hay error.
    mockedGetPlans.mockRejectedValue(new Error('500'));
    mockGetProducts(jest.fn());

    const { result } = renderHook(() => usePlans());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).not.toBeNull();
    expect(result.current.plans).toHaveLength(0);
  });
});
