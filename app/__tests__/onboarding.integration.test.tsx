import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import OnboardingScreen from '../onboarding';
import * as onboardingService from '@/src/services/onboarding.service';

// Mock de apiClient para evitar errores de axios/fetch
jest.mock('@/src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

// Mocks de servicios
jest.mock('@/src/services/onboarding.service');
jest.mock('@/src/services/goal.service', () => ({
  getGlobalGoals: jest.fn().mockResolvedValue([]),
}));
jest.mock('@/src/hooks/use-onboarding-storage', () => ({
  useOnboardingStorage: () => ({
    saveDraft: jest.fn(),
    loadDraft: jest.fn().mockResolvedValue(null),
    clearDraft: jest.fn(),
  }),
}));
jest.mock('@/src/hooks/use-module-config-storage', () => ({
  useModuleConfigStorage: () => ({
    saveSelectedModules: jest.fn(),
    loadSelectedModules: jest.fn(),
    clearAllModuleConfig: jest.fn(),
    saveConfigStep: jest.fn(),
    loadConfigStep: jest.fn(),
    setOnboardingCompleted: jest.fn(),
  }),
}));

describe('Onboarding Integration - Flow Privacidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe mostrar la pantalla de privacidad si el status es AWAITING_TERMS_ACCEPTANCE', async () => {
    // Configuramos el mock para que devuelva el estado de términos
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({
      status: 'AWAITING_TERMS_ACCEPTANCE',
    });

    const { getByText, queryByText } = render(<OnboardingScreen />);

    // Esperar a que desaparezca el loader inicial y aparezca la pantalla de privacidad
    await waitFor(() => {
      expect(getByText('Tu privacidad es lo primero')).toBeTruthy();
    });
    
    expect(queryByText('Datos basico')).toBeNull(); // No debería mostrar el paso 0 aún
  });

  it('debe avanzar al paso 0 después de aceptar los términos exitosamente', async () => {
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({
      status: 'AWAITING_TERMS_ACCEPTANCE',
    });
    (onboardingService.acceptTerms as jest.Mock).mockResolvedValue(true);

    const { getByText, getByRole } = render(<OnboardingScreen />);

    await waitFor(() => getByText('Tu privacidad es lo primero'));

    // Aceptar términos
    const switchComponent = getByRole('switch');
    fireEvent(switchComponent, 'onValueChange', true);

    const button = getByText('Continuar & Configurar');
    
    await act(async () => {
      fireEvent.press(button);
    });

    // Verificar llamada al servicio
    expect(onboardingService.acceptTerms).toHaveBeenCalled();

    // Verificar que avanzó al siguiente paso (Datos básicos)
    await waitFor(() => {
      expect(getByText('Datos basico')).toBeTruthy();
    });
  });

  it('debe mostrar una alerta si falla la aceptación de términos', async () => {
    const alertMock = jest.spyOn(global, 'alert');
    
    (onboardingService.getOnboardingStatus as jest.Mock).mockResolvedValue({
      status: 'AWAITING_TERMS_ACCEPTANCE',
    });
    (onboardingService.acceptTerms as jest.Mock).mockResolvedValue(false);

    const { getByText, getByRole } = render(<OnboardingScreen />);

    await waitFor(() => getByText('Tu privacidad es lo primero'));

    const switchComponent = getByRole('switch');
    fireEvent(switchComponent, 'onValueChange', true);

    const button = getByText('Continuar & Configurar');
    
    await act(async () => {
      fireEvent.press(button);
    });

    expect(alertMock).toHaveBeenCalledWith('Hubo un problema al aceptar los términos.');
    
    alertMock.mockRestore();
  });
});
