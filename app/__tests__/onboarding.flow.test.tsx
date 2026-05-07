import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import OnboardingScreen from '../onboarding';
import * as onboardingService from '@/src/services/onboarding.service';
import * as goalService from '@/src/services/goal.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mocks de servicios (apiClient ya está mockeado en jest-setup.ts)
jest.mock('@/src/services/onboarding.service');
jest.mock('@/src/services/goal.service');
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('Onboarding Flow Integration', () => {
  const mockToken = 'mock-token';

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
  });

  it('debe fluir desde el paso 0 hasta selección de módulos exitosamente', async () => {
    // 1. Mock de estado inicial (AWAITING_BASIC_DATA)
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({ status: 'AWAITING_BASIC_DATA' });
    (goalService.getGlobalGoals as jest.Mock).mockResolvedValue([{ id: 'g1', name: 'Objetivo 1' }]);
    (onboardingService.getModules as jest.Mock).mockResolvedValue([{ id: 'm1', name: 'Fitness', imageUrl: 'url' }]);

    const { getByText, findByText, getByTestId } = render(<OnboardingScreen />);

    // Esperar a que cargue el paso 0
    await waitFor(() => expect(getByText('Datos basico')).toBeTruthy());

    // Paso 0 -> 1
    // Usar fireEvent sobre el Picker directamente
    fireEvent(getByTestId('Picker'), 'onValueChange', 'male');
    fireEvent.press(getByText('Continuar'));

    // Paso 1 -> 2
    await waitFor(() => expect(getByText('Peso')).toBeTruthy());
    fireEvent.press(getByText('Continuar'));

    // Paso 2 -> 3 (Envío a Backend)
    await waitFor(() => expect(getByText('Tu objetivo')).toBeTruthy());
    fireEvent.press(getByText('Objetivo 1'));
    
    (onboardingService.setBasicInfo as jest.Mock).mockResolvedValue({ success: true });
    
    await act(async () => {
      fireEvent.press(getByText('Continuar'));
    });

    // Verificar que se llamó al servicio
    expect(onboardingService.setBasicInfo).toHaveBeenCalled();
    
    // Verificar que estamos en el paso de módulos
    await waitFor(() => expect(getByText('Modulos')).toBeTruthy());
  });

  it('debe manejar errores de red al guardar datos básicos (Caso Negativo)', async () => {
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({ status: 'AWAITING_BASIC_DATA' });
    (goalService.getGlobalGoals as jest.Mock).mockResolvedValue([{ id: 'g1', name: 'Objetivo 1' }]);

    const { getByText, getByTestId } = render(<OnboardingScreen />);

    // Llegar al paso 2
    await waitFor(() => getByText('Datos basico'));
    fireEvent(getByTestId('Picker'), 'onValueChange', 'male');
    fireEvent.press(getByText('Continuar'));
    await waitFor(() => getByText('Peso'));
    fireEvent.press(getByText('Continuar'));
    await waitFor(() => getByText('Tu objetivo'));
    fireEvent.press(getByText('Objetivo 1'));

    // Simular fallo de API
    (onboardingService.setBasicInfo as jest.Mock).mockRejectedValue(new Error('API Failure'));

    await act(async () => {
      fireEvent.press(getByText('Continuar'));
    });

    // Verificar que se mostró una alerta
    expect(global.alert).toHaveBeenCalledWith('Hubo un error al guardar los datos.');
    
    // El usuario debería seguir en el paso 2 para reintentar
    expect(getByText('Tu objetivo')).toBeTruthy();
  });

  it('debe recuperar el progreso desde AsyncStorage al iniciar (Draft Persistence)', async () => {
    // Simular que el usuario ya guardó datos pero cerró la app en el paso 1
    const mockDraft = JSON.stringify({
      gender: 'female',
      currentStep: 1,
      heightCm: 160,
      weightKg: 55,
    });
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key) => {
      if (key === '@onboarding_draft') return Promise.resolve(mockDraft);
      return Promise.resolve(null);
    });
    
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({ status: 'AWAITING_BASIC_DATA' });

    const { getByText } = render(<OnboardingScreen />);

    // Debería aparecer directamente en el paso 1 (Peso/Altura)
    await waitFor(() => expect(getByText('Configura tu perfil basico para comenzar')).toBeTruthy());
    expect(getByText('Peso')).toBeTruthy();
  });
});
