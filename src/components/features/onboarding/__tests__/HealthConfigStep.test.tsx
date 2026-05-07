import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HealthConfigStep from '../HealthConfigStep';
import * as healthService from '@/src/services/health.service';

// Mocks
jest.mock('@/src/services/health.service');
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn(() => Promise.resolve('token')) }),
}));
jest.mock('@/src/hooks/use-module-config-storage', () => ({
  useModuleConfigStorage: () => ({
    saveHealthConfig: jest.fn(),
    loadHealthConfig: jest.fn().mockResolvedValue(null),
  }),
}));

describe('HealthConfigStep', () => {
  const mockOnComplete = jest.fn();
  const mockSetIsSubmitting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    (healthService.getInjuries as jest.Mock).mockResolvedValue([]);
    (healthService.getMedicalConditions as jest.Mock).mockResolvedValue([]);
  });

  it('debe navegar a través de los sub-pasos correctamente', async () => {
    const { getByText } = render(
      <HealthConfigStep
        brandColor="#00c2e0"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    // Esperar carga inicial
    await waitFor(() => expect(getByText('Lesiones')).toBeTruthy());
    
    fireEvent.press(getByText('Continuar'));

    // SubStep 1: Afecciones
    await waitFor(() => expect(getByText('Afecciones médicas')).toBeTruthy());
  });

  it('debe enviar el perfil al finalizar', async () => {
    (healthService.submitHealthProfile as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(
      <HealthConfigStep
        brandColor="#00c2e0"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    await waitFor(() => getByText('Lesiones'));
    fireEvent.press(getByText('Continuar')); // a paso 1

    await waitFor(() => getByText('Afecciones médicas'));
    
    await act(async () => {
      fireEvent.press(getByText('Continuar'));
    });

    expect(healthService.submitHealthProfile).toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
